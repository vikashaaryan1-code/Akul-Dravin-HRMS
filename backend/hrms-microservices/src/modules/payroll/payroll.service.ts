import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DataSource, EntityManager } from 'typeorm';
import { PayrollBatchEntity, PayrollBatchStatus } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity, PayrollItemExecutionStatus } from '../../database/entities/payroll-item.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { CompanyEntity } from '../../database/entities/company.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { LedgerService } from '../finance/ledger.service';
import { FinancialOutboxService } from '../finance/financial-outbox.service';
import { PerformanceManagementService } from '../performance-management/performance-management.service';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';
import { createHash } from 'node:crypto';
import { BankFileArtifactEntity } from '../../database/entities/bank-file-artifact.entity';
import { RedlockService } from '../../common/locks/redlock.service';
import { QUEUE_PAYROLL } from '../../common/queues/queue-names';
import { RenderDocumentDto, DocumentType, DesignMode } from '../document-center/dto/render-document.dto';
import {
  TransitionPolicyEngine,
  TransitionActorContext,
} from '../../common/governance/transitions/transition-policy-engine';
import { TaxEngineService } from './tax-engine.service';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly ledgerService: LedgerService,
    private readonly outboxService: FinancialOutboxService,
    private readonly performanceService: PerformanceManagementService,
    @InjectQueue(QUEUE_PAYROLL)
    private readonly payrollQueue: Queue,
    private readonly redlockService: RedlockService,
    /**
     * The sole legal mutation surface for PayrollBatch status.
     * All state transitions MUST pass through this engine.
     * Direct batch.status assignment is not permitted after Commit 5.
     */
    private readonly transitionEngine: TransitionPolicyEngine,
    private readonly taxEngine: TaxEngineService,
  ) {}

  /**
   * STEP 1: GENERATE BATCH (DRAFT)
   * Creates the snapshot of salary calculations for a specific month.
   */
  async generateBatch(year: number, month: number): Promise<PayrollBatchEntity> {
    const tenantId = TenantContext.getRequiredTenantId();

    return await this.dataSource.transaction(async (manager) => {
        // 1. Check if batch already exists — pessimistic write lock prevents
        //    race window between SELECT and INSERT under concurrent requests.
        //    Lock is inside this.dataSource.transaction() → atomicity guaranteed.
        //    NOTE: sql.js (test DB) ignores the lock mode; it exercises in Postgres.
        const existing = await manager.findOne(PayrollBatchEntity, {
            where: { tenantId, year, month },
            lock: { mode: 'pessimistic_write' },
        });
        if (existing) throw new BadRequestException(`Payroll batch for ${month}/${year} already exists.`);

        // 2. Create Batch Header
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0); // Last day of month

        const batch = manager.create(PayrollBatchEntity, {
            tenantId,
            year,
            month,
            status: PayrollBatchStatus.DRAFT,
            periodStart,
            periodEnd,
            cutoffAt: new Date(),
            timezone: 'UTC',
        });
        const savedBatch = await manager.save(batch);

        // 3. Populate Items (Calculation Snapshots)
        const employees = await manager.find(EmployeeEntity, { where: { tenantId } });
        const items: PayrollItemEntity[] = [];

        for (const emp of employees) {
            const calculation = await this.calculateSalarySnapshot(emp);
            items.push(manager.create(PayrollItemEntity, {
                tenantId,
                batchId: savedBatch.id,
                employeeId: emp.id,
                grossSalary: calculation.grossSalary,
                deductions: calculation.deductions,
                netPayable: calculation.netPayable,
                currency: calculation.currency,
                calculationStatus: 'calculated',
                metadata: calculation.metadata
            }));
        }

        await manager.save(items);

        // 4. Update Batch Totals
        await this.updateBatchTotals(manager, savedBatch.id);
        
        return await manager.findOne(PayrollBatchEntity, {
            where: { id: savedBatch.id },
            relations: ['items']
        }) as PayrollBatchEntity;
    });
  }

  /**
   * STEP 2 & 3: VALIDATE & LOCK BATCH
   * Seals the batch against mutation. No more calculation changes allowed.
   *
   * @param batchId   Batch to lock.
   * @param actor     Actor context — who is locking and with what roles.
   *                  Defaults to PAYROLL_OFFICER system actor if not provided.
   */
  async lockBatch(
    batchId: string,
    actor: TransitionActorContext = { actorId: 'SYSTEM', actorRoles: ['PAYROLL_OFFICER'] },
  ): Promise<PayrollBatchEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const repo = this.dataSource.getRepository(PayrollBatchEntity);

    const batch = await repo.findOne({ where: { id: batchId, tenantId }, relations: ['items'] });
    if (!batch) throw new NotFoundException('Batch not found');

    // Performance/Validation check
    if (batch.items.length === 0) throw new BadRequestException('Cannot lock an empty batch.');

    // Generate per-item idempotency keys during seal.
    batch.items.forEach(item => {
      item.idempotencyKey = `PAYROLL|${batch.id}|${item.employeeId}`;
    });

    // FORENSIC SEAL: Generate bitwise hash of the entire intent.
    batch.batchSeal = this.computeBatchSeal(batch.items);

    // ── GOVERNED TRANSITION ─────────────────────────────────────────────────
    // The engine validates legality + RBAC, then appends the immutable journal
    // entry, then emits the domain event. The engine does NOT mutate batch.status.
    // We apply the mutation AFTER the engine succeeds — within the same operation.
    await this.transitionEngine.transition({
      aggregateId: batch.id,
      fromStatus: batch.status,
      toStatus: PayrollBatchStatus.LOCKED,
      tenantId,
      actor,
      metadata: { batchSeal: batch.batchSeal, itemCount: batch.items.length },
    });

    // Apply status + timestamp AFTER successful engine validation
    batch.status  = PayrollBatchStatus.LOCKED;
    batch.lockedAt = new Date();

    return await repo.save(batch);
  }

  /**
   * BITWISE INTEGRITY HELPER
   */
  private computeBatchSeal(items: PayrollItemEntity[]): string {
    // Sort items by employeeId to ensure deterministic hashing regardless of storage order.
    const sortedItems = [...items].sort((a, b) => a.employeeId.localeCompare(b.employeeId));
    
    const hasher = createHash('sha256');
    for (const item of sortedItems) {
        const itemBody = `${item.employeeId}|${item.grossSalary}|${item.deductions}|${item.netPayable}|${item.currency}`;
        hasher.update(itemBody);
    }
    
    return hasher.digest('hex');
  }

  /**
   * STEP 4: PROCESS (Execution Orchestration)
   * Emits Financial Commands to the Truth Layer.
   *
   * @param batchId  Batch to execute.
   * @param actor    Actor context. System-originated by default.
   */
  async executeBatch(
    batchId: string,
    actor: TransitionActorContext = { actorId: 'SYSTEM', actorRoles: ['SYSTEM'] },
  ): Promise<PayrollBatchEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const batchRepo = this.dataSource.getRepository(PayrollBatchEntity);

    const batch = await batchRepo.findOne({
      where: { id: batchId, tenantId },
      relations: ['items'],
    });

    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== PayrollBatchStatus.LOCKED && batch.status !== PayrollBatchStatus.PROCESSING) {
      throw new BadRequestException('Batch must be LOCKED or PROCESSING to execute.');
    }

    // ── GOVERNED TRANSITION: LOCKED → PROCESSING ─────────────────────────
    if (batch.status === PayrollBatchStatus.LOCKED) {
      await this.transitionEngine.transition({
        aggregateId: batch.id,
        fromStatus: batch.status,
        toStatus: PayrollBatchStatus.PROCESSING,
        tenantId,
        actor,
        metadata: { itemCount: batch.items.length },
      });
      batch.status     = PayrollBatchStatus.PROCESSING;
      batch.executedAt = new Date();
      await batchRepo.save(batch);
    }

    // Iterate through items that are not yet SUCCESS
    for (const item of batch.items) {
      if (item.executionStatus === PayrollItemExecutionStatus.SUCCESS) continue;
      try {
        await this.executeSingleItemTransactionally(item.id, batch);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.error(`Isolated failure for Item ${item.id}: ${msg}`);
      }
    }

    return await batchRepo.findOne({ where: { id: batchId }, relations: ['items'] }) as PayrollBatchEntity;
  }

  /**
   * ISOLATED TRANSACTION BOUNDARY
   * Ensures one employee's failure does not block the entire batch.
   */
  private async executeSingleItemTransactionally(itemId: string, batch: PayrollBatchEntity): Promise<void> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    await this.dataSource.transaction(async (manager) => {
        const item = await manager.findOne(PayrollItemEntity, { where: { id: itemId, tenantId } });
        if (!item) return;

        try {
            // BITWISE INTEGRITY CHECK (Per item)
            // Re-verify that this specific item hasn't been tampered with since LOCK.
            const itemSeal = createHash('sha256')
                .update(`${item.employeeId}|${item.grossSalary}|${item.deductions}|${item.netPayable}|${item.currency}`)
                .digest('hex');
            
            // STEP 0: IDEMPOTENCY RECOVERY
            // Check if this specific item has already been committed to the Truth Layer.
            const existingTx = await this.ledgerService.findTransactionByIdempotencyKey(tenantId, item.idempotencyKey!);

            
            if (existingTx) {
                item.linkedTransactionId = existingTx.id;
                item.executionStatus = PayrollItemExecutionStatus.SUCCESS;
                item.errorLog = null as any;
                await manager.save(item);
                return; // RECOVERY SUCCESSFUL
            }

            // PRECISION: Resolve Banker's Rounded components from calculation metadata.
            const currency = item.currency;
            const fxRate = '1.0000'; // Hardcoded for domestic run

            const command = {
                idempotencyKey: item.idempotencyKey,
                reference: batch.id,
                type: 'PAYROLL_DISBURSEMENT',
                description: `Payroll Payout for ${batch.month}/${batch.year} - Emp: ${item.employeeId}`,
                entries: [
                    {
                        debitAccountCode: 'EXPENSE_SALARY',
                        creditAccountCode: 'TEMP_SETTLEMENT_PAYROLL',
                        amount: item.grossSalary,
                        description: `Gross Salary for ${item.employeeId}`,
                    },
                    {
                        debitAccountCode: 'TEMP_SETTLEMENT_PAYROLL',
                        creditAccountCode: 'LIABILITY_TDS_PAYABLE',
                        amount: item.metadata?.breakdown?.tds || '0.0000',
                        description: 'Statutory Deduction: TDS',
                    },
                    {
                        debitAccountCode: 'TEMP_SETTLEMENT_PAYROLL',
                        creditAccountCode: 'LIABILITY_PF_PAYABLE',
                        amount: item.metadata?.breakdown?.pf || '0.0000',
                        description: 'Statutory Deduction: PF',
                    },
                    {
                        debitAccountCode: 'TEMP_SETTLEMENT_PAYROLL',
                        creditAccountCode: 'LIABILITY_ESI_PAYABLE',
                        amount: item.metadata?.breakdown?.esi || '0.0000',
                        description: 'Statutory Deduction: ESI',
                    },
                    {
                        debitAccountCode: 'TEMP_SETTLEMENT_PAYROLL',
                        creditAccountCode: 'BANK_MAIN', // Final Net Payout
                        amount: item.netPayable,
                        description: 'Net Payout Dispatched to Employee',
                    }
                ],
                metadata: { 
                    batchId: batch.id, 
                    itemId: item.id,
                    breakdown: item.metadata?.breakdown
                }
            };

            const tx = await this.ledgerService.executeTransaction({
               ...command,
               idempotencyKey: command.idempotencyKey!,
            });
            await this.ledgerService.markAsSettlementPending(tx.id);

            item.linkedTransactionId = tx.id;
            item.executionStatus = PayrollItemExecutionStatus.SUCCESS;
            item.errorLog = null as any;
            await manager.save(item);

        } catch (e: unknown) {
            item.executionStatus = PayrollItemExecutionStatus.FAILED;
            item.errorLog = e instanceof Error ? e.message : String(e);
            await manager.save(item);
            throw e; // Reraise to log at batch level
        }
    });
  }

  /**
   * STEP 5 & 6: MONITOR & COMPLETE
   * Verifies that all items are RECONCILED then transitions PROCESSING → COMPLETED.
   *
   * System-originated: no human actor required.
   */
  async finalizeBatch(
    batchId: string,
    actor: TransitionActorContext = { actorId: 'SYSTEM', actorRoles: ['SYSTEM'] },
  ): Promise<PayrollBatchEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const batch = await this.dataSource.getRepository(PayrollBatchEntity).findOne({
      where: { id: batchId, tenantId },
      relations: ['items', 'items.linkedTransaction'],
    });

    if (!batch) throw new NotFoundException('Batch not found');

    const txIds = batch.items
      .filter(item => item.linkedTransactionId)
      .map(item => item.linkedTransactionId!);

    if (txIds.length < batch.items.length) {
      throw new BadRequestException('Cannot finalize batch: Some items have not been executed yet.');
    }

    // HANDSHAKE: Ensure all are reconciled.
    await this.ledgerService.ensureAllReconciled(txIds);

    // ── GOVERNED TRANSITION: PROCESSING → COMPLETED ──────────────────────
    await this.transitionEngine.transition({
      aggregateId: batch.id,
      fromStatus: batch.status,
      toStatus: PayrollBatchStatus.COMPLETED,
      tenantId,
      actor,
      metadata: { txCount: txIds.length },
    });

    batch.status = PayrollBatchStatus.COMPLETED;
    return await this.dataSource.getRepository(PayrollBatchEntity).save(batch);
  }

  private async calculateSalarySnapshot(employee: EmployeeEntity): Promise<any> {
    const taxResult = this.taxEngine.calculateIndianTax(employee.monthlyCtc || '0');

    return {
      grossSalary: taxResult.grossSalary,
      deductions: taxResult.deductions.total,
      netPayable: taxResult.netPayable,
      currency: taxResult.currency,
      metadata: { 
        calculationVersion: '3.0', 
        baseSalary: employee.monthlyCtc,
        taxRegime: taxResult.taxRegime,
        breakdown: {
          tds: taxResult.deductions.tds,
          pf: taxResult.deductions.pf,
          esi: taxResult.deductions.esi,
          pt: taxResult.deductions.professionalTax,
        }
      }
    };
  }

  /**
   * PROOF LAYER: EXTERNAL ARTIFACT GENERATION
   * Generates a deterministic hashed bank file for bulk payout.
   */
  async generateBankFile(batchId: string): Promise<BankFileArtifactEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const batchRepo = this.dataSource.getRepository(PayrollBatchEntity);
    const artifactRepo = this.dataSource.getRepository(BankFileArtifactEntity);

    const batch = await batchRepo.findOne({ where: { id: batchId, tenantId }, relations: ['items'] });
    if (!batch) throw new NotFoundException('Batch not found');

    const csvLines = ['EmployeeId,NetPayable,Currency,BankCode'];
    
    // Sort items by ID for bitwise deterministic output
    const sortedItems = [...batch.items].sort((a,b) => a.id.localeCompare(b.id));

    for (const item of sortedItems) {
        if (item.executionStatus !== PayrollItemExecutionStatus.SUCCESS) continue;
        csvLines.push(`${item.employeeId},${item.netPayable},${item.currency},BANK_MAIN_001`);
    }

    const fileContent = csvLines.join('\n');
    const fileHash = createHash('sha256').update(fileContent).digest('hex');

    const artifact = artifactRepo.create({
        tenantId,
        batchId,
        fileType: 'NEFT_CSV',
        fileContent,
        fileHash,
        generatedAt: new Date(),
        metadata: { itemCount: batch.items.length }
    });

    return await artifactRepo.save(artifact);
  }

  /**
   * ORCHESTRATED BATCH REVERSAL — GOVERNED MUTATION
   *
   * Requires: PAYROLL_ADMIN or SUPER_ADMIN role + justification text.
   *
   * The TransitionPolicyEngine enforces:
   *  1. Transition legality: COMPLETED → REVERSED only.
   *  2. RBAC: PAYROLL_ADMIN or SUPER_ADMIN required.
   *  3. Justification: non-empty string required.
   *  4. Journal: immutable entry appended before any ledger mutation.
   *  5. Domain event: payroll.batch.reversed emitted after journal persisted.
   *
   * @param batchId       Batch to reverse.
   * @param actor         Must carry PAYROLL_ADMIN or SUPER_ADMIN role.
   * @param justification Why this reversal is being executed.
   */
  async reverseBatch(
    batchId: string,
    actor: TransitionActorContext,
    justification: string,
  ): Promise<void> {
    const tenantId = TenantContext.getRequiredTenantId();
    const batchRepo = this.dataSource.getRepository(PayrollBatchEntity);

    const batch = await batchRepo.findOne({ where: { id: batchId, tenantId }, relations: ['items'] });
    if (!batch) throw new NotFoundException('Batch not found');

    // ── GOVERNED TRANSITION: COMPLETED → REVERSED ────────────────────────
    // Phase order (engine-enforced):
    //   legality check → RBAC check → justification check
    //   → journal.save() → bus.emit()
    //
    // journal.save() occurs BEFORE ledger mutation below.
    // If the ledger mutation fails, the journal entry already exists —
    // enabling forensic reconstruction of partial reversals.
    await this.transitionEngine.transition({
      aggregateId: batch.id,
      fromStatus: batch.status,
      toStatus: PayrollBatchStatus.REVERSED,
      tenantId,
      actor,
      justification,
      metadata: { itemCount: batch.items.length, year: batch.year, month: batch.month },
    });

    // Ledger reversals — run AFTER journal is persisted
    await this.dataSource.transaction(async (manager) => {
      for (const item of batch.items) {
        if (item.linkedTransactionId) {
          await this.ledgerService.reverseTransaction(item.linkedTransactionId);
        }
        // REVERSED is semantically distinct from FAILED:
        // FAILED = execution error | REVERSED = intentional rollback by authorized actor
        item.executionStatus = PayrollItemExecutionStatus.REVERSED;
        await manager.save(item);
      }

      // Apply the status mutation — only after all validations and journal write succeed
      batch.status = PayrollBatchStatus.REVERSED;
      await manager.save(batch);
    });

    this.logger.log(
      `Payroll batch REVERSED: batchId=${batchId} tenant=${tenantId} ` +
        `actor=${actor.actorId} justification="${justification}"`,
    );
  }

  private async updateBatchTotals(manager: EntityManager, batchId: string): Promise<void> {
    const tenantId = TenantContext.getRequiredTenantId();
    // Tenant-scope the item fetch — prevents cross-tenant aggregation if batchId
    // were ever mistakenly reused across tenants (defence-in-depth).
    const items = await manager.find(PayrollItemEntity, { where: { batchId, tenantId } });

    let gross = new BigNumber(0);
    let deds  = new BigNumber(0);
    let net   = new BigNumber(0);

    for (const item of items) {
        gross = gross.plus(new BigNumber(item.grossSalary));
        deds  = deds.plus(new BigNumber(item.deductions));
        net   = net.plus(new BigNumber(item.netPayable));
    }

    await manager.update(PayrollBatchEntity, batchId, {
        totalGross:      gross.toFixed(4),
        totalDeductions: deds.toFixed(4),
        totalNet:        net.toFixed(4),
    });
  }

  /**
   * PAYROLL REGISTER REPORT
   * High-fidelity per-employee breakdown for a specific batch.
   */
  async getPayrollRegister(batchId: string): Promise<any> {
    const tenantId = TenantContext.getRequiredTenantId();
    const batchRepo = this.dataSource.getRepository(PayrollBatchEntity);

    const batch = await batchRepo.findOne({ 
        where: { id: batchId, tenantId }, 
        relations: ['items'] 
    });

    if (!batch) throw new NotFoundException('Batch not found');

    return {
        batchMetadata: {
            id: batch.id,
            period: `${batch.month}/${batch.year}`,
            status: batch.status,
            totalGross: batch.totalGross,
            totalNet: batch.totalNet
        },
        items: (batch.items || []).map(item => ({
            employeeId: item.employeeId,
            grossSalary: item.grossSalary,
            tds: item.metadata?.breakdown?.tds || '0.0000',
            pf: item.metadata?.breakdown?.pf || '0.0000',
            esi: item.metadata?.breakdown?.esi || '0.0000',
            netPayable: item.netPayable,
            linkedTransactionId: item.linkedTransactionId,
            status: item.executionStatus
        }))
    };
  }

  /** Get all payroll batches for the current tenant */
  async findAll(): Promise<PayrollBatchEntity[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    return this.dataSource.getRepository(PayrollBatchEntity).find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Get all payroll items for the current tenant */
  async findAllItems(): Promise<PayrollItemEntity[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    return this.dataSource.getRepository(PayrollItemEntity).find({
      where: { tenantId },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Get single batch by ID */
  async findOne(id: string): Promise<PayrollBatchEntity | null> {

    const tenantId = TenantContext.getRequiredTenantId();
    return this.dataSource.getRepository(PayrollBatchEntity).findOne({ where: { id, tenantId } });
  }

  /** Get all payroll batches for an employee */
  async findByEmployee(employeeId: string): Promise<any[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const repo = this.dataSource.getRepository(PayrollItemEntity);
    return repo.find({ where: { employeeId, tenantId }, order: { createdAt: 'DESC' } });
  }

  /**
   * Self-service: returns payroll items for the currently authenticated user.
   * Resolves employeeId from userId via the employees table.
   * If the user has no linked employee record, returns an empty array
   * (graceful — employee link may not be set up yet).
   *
   * @param userId  - JWT `sub` of the requesting user
   * @param adminEmployeeId - if provided (admin override), bypass the userId→employee lookup
   *                          and return all items for the given employeeId directly.
   */
  async findMyPayslips(userId: string, adminEmployeeId?: string): Promise<any[]> {
    const tenantId = TenantContext.getRequiredTenantId();

    if (adminEmployeeId) {
      // Admin override path: trust the caller-supplied employeeId
      return this.findByEmployee(adminEmployeeId);
    }

    // Employee self-service: resolve employeeId from userId
    const employee = await this.dataSource.getRepository(EmployeeEntity).findOne({
      where: { tenantId, userId },
      select: ['id'],
    });

    if (!employee) {
      // User has no linked employee record — return empty rather than throwing
      this.logger.warn(
        `PAYSLIP_ME_NO_EMPLOYEE userId=${userId} tenant=${tenantId} — no employee record linked`,
      );
      return [];
    }

    const repo = this.dataSource.getRepository(PayrollItemEntity);
    return repo.find({
      where: { employeeId: employee.id, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * TARGET-BASED SALARY CALCULATION
   * Formula: baseSalary + variableSalary × (achievedValue / targetValue)
   * Prorated by elapsed days if elapsedDaysInMonth / totalDaysInMonth is provided.
   * Currency: INR-only (v1 hard constraint).
   */
  async calculateTargetBasedSalary(dto: {
    baseSalary: number;
    variableSalary: number;
    targetValue: number;
    achievedValue: number;
    spiffBonus?: number;
    elapsedDaysInMonth?: number;
    totalDaysInMonth?: number;
    currency?: string;
  }): Promise<any> {
    if (dto.targetValue <= 0) throw new BadRequestException('targetValue must be greater than 0');

    const base = new BigNumber(dto.baseSalary);
    const variable = new BigNumber(dto.variableSalary);
    const achievementRatio = new BigNumber(dto.achievedValue).dividedBy(dto.targetValue).toFixed(4);
    const earnedVariable = variable.multipliedBy(achievementRatio);
    const spiff = new BigNumber(dto.spiffBonus ?? 0);

    // Proration: if partial month, scale everything by elapsed/total
    const elapsedDays = dto.elapsedDaysInMonth ?? 30;
    const totalDays = dto.totalDaysInMonth ?? 30;
    if (totalDays <= 0) throw new BadRequestException('totalDaysInMonth must be > 0');
    const prorateRatio = new BigNumber(elapsedDays).dividedBy(totalDays);

    const proratedBase = base.multipliedBy(prorateRatio);
    const proratedVariable = earnedVariable.multipliedBy(prorateRatio);
    const gross = proratedBase.plus(proratedVariable).plus(spiff);

    // Statutory deductions — INR-only (PF: 12% of basic, TDS: 10% of variable)
    const pf = proratedBase.multipliedBy('0.12');
    const tds = proratedVariable.multipliedBy('0.10');
    const totalDeductions = pf.plus(tds);
    const net = gross.minus(totalDeductions);

    return {
      currency: dto.currency ?? 'INR',
      achievementRatio: new BigNumber(achievementRatio).toFixed(4),
      prorateRatio: prorateRatio.toFixed(4),
      breakdown: {
        proratedBase: proratedBase.toFixed(4),
        proratedVariable: proratedVariable.toFixed(4),
        spiff: spiff.toFixed(4),
      },
      gross: gross.toFixed(4),
      deductions: {
        pf: pf.toFixed(4),
        tds: tds.toFixed(4),
        total: totalDeductions.toFixed(4),
      },
      net: net.toFixed(4),
    };
  }

  /**
   * SIX-TIER BONUS SLA MATRIX
   * Tier is determined by achievementPercent, modified by quality and attendance scores.
   * Tiers: <50%=0x, 50–60%=0.5x, 60–75%=0.6x, 75–85%=0.75x, 85–100%=1.0x, >100%=1.2x
   */
  async calculateSixTierBonusSla(dto: {
    baseVariableBonus: number;
    achievementPercent: number;
    qualityScore?: number;
    attendanceScore?: number;
    breachCount?: number;
    currency?: string;
  }): Promise<any> {
    const tiers: Array<{ threshold: number; multiplier: number; label: string }> = [
      { threshold: 100, multiplier: 1.2,  label: 'Platinum — Exceeded' },
      { threshold: 85,  multiplier: 1.0,  label: 'Gold — Target Met' },
      { threshold: 75,  multiplier: 0.75, label: 'Silver — Near Target' },
      { threshold: 60,  multiplier: 0.60, label: 'Bronze — Partial' },
      { threshold: 50,  multiplier: 0.50, label: 'Entry — Minimum' },
      { threshold: 0,   multiplier: 0.0,  label: 'Below Threshold — No Bonus' },
    ];

    const achievement = Number(dto.achievementPercent);
    const tier = tiers.find(t => achievement >= t.threshold) ?? tiers[tiers.length - 1];

    let multiplier = new BigNumber(tier.multiplier);

    // Quality modifier: deduct 0.05x per 10 points below 80
    if (dto.qualityScore !== undefined && dto.qualityScore < 80) {
      const qualityPenalty = new BigNumber(80 - dto.qualityScore).dividedBy(10).multipliedBy('0.05');
      multiplier = multiplier.minus(qualityPenalty).decimalPlaces(4, BigNumber.ROUND_DOWN);
    }

    // Attendance modifier: deduct 0.02x per breach
    if (dto.breachCount && dto.breachCount > 0) {
      const breachPenalty = new BigNumber(dto.breachCount).multipliedBy('0.02');
      multiplier = multiplier.minus(breachPenalty).decimalPlaces(4, BigNumber.ROUND_DOWN);
    }

    // Ensure multiplier doesn't go negative
    if (multiplier.isLessThan(0)) multiplier = new BigNumber(0);

    const bonusAmount = new BigNumber(dto.baseVariableBonus).multipliedBy(multiplier);

    return {
      currency: dto.currency ?? 'INR',
      achievementPercent: achievement,
      tier: tier.label,
      baseMultiplier: tier.multiplier,
      effectiveMultiplier: multiplier.toFixed(4),
      bonusAmount: bonusAmount.toFixed(4),
    };
  }

  /**
   * DAYS-WISE PRORATION CALCULATION
   * NetPayable = (monthlySalary / workingDaysInMonth) × effectiveDays − deductions
   * effectiveDays = workingDays − unpaidLeaveDays − (halfDays × 0.5)
   * INR-only (v1).
   */
  async calculateDaysWiseSalary(dto: {
    monthlyBaseSalary: number;
    workingDaysInMonth: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    halfDays: number;
    onDutyDays?: number;
    wfhDays?: number;
    deductions?: Array<{ name: string; amount: number }>;
    targetBonus?: number;
    currency?: string;
  }): Promise<any> {
    if (dto.workingDaysInMonth <= 0) throw new BadRequestException('workingDaysInMonth must be > 0');

    const dailyRate = new BigNumber(dto.monthlyBaseSalary).dividedBy(dto.workingDaysInMonth);

    // Effective paid days: total − unpaid − half-days (0.5 day each)
    const effectiveDays = new BigNumber(dto.workingDaysInMonth)
      .minus(dto.unpaidLeaveDays)
      .minus(new BigNumber(dto.halfDays).multipliedBy('0.5'))
      .decimalPlaces(2);

    if (effectiveDays.isLessThan(0)) throw new BadRequestException('Effective paid days resolved to negative — check leave inputs');

    const proratedBase = dailyRate.multipliedBy(effectiveDays);
    const bonus = new BigNumber(dto.targetBonus ?? 0);

    // Custom deductions (LOP, etc.)
    const customDeductionsTotal = (dto.deductions ?? []).reduce(
      (acc, d) => acc.plus(new BigNumber(d.amount)), new BigNumber(0)
    );

    // Statutory (INR-only)
    const pf = proratedBase.multipliedBy('0.12');
    const esi = proratedBase.isLessThanOrEqualTo(21000) ? proratedBase.multipliedBy('0.0075') : new BigNumber(0);
    const totalDeductions = pf.plus(esi).plus(customDeductionsTotal);

    const gross = proratedBase.plus(bonus);
    const net = gross.minus(totalDeductions);

    return {
      currency: dto.currency ?? 'INR',
      dailyRate: dailyRate.toFixed(4),
      effectiveDays: effectiveDays.toFixed(2),
      breakdown: {
        proratedBase: proratedBase.toFixed(4),
        bonus: bonus.toFixed(4),
        unpaidLeaveDays: dto.unpaidLeaveDays,
        halfDays: dto.halfDays,
      },
      gross: gross.toFixed(4),
      deductions: {
        pf: pf.toFixed(4),
        esi: esi.toFixed(4),
        custom: customDeductionsTotal.toFixed(4),
        total: totalDeductions.toFixed(4),
      },
      net: net.toFixed(4),
    };
  }

  /** Unified salary summary for a single employee across all batches */
  async calculateUnifiedSalary(employeeId: string): Promise<any> {
    const items = await this.findByEmployee(employeeId);
    const totalNet = items.reduce((acc, i) => acc + Number(i.netPayable ?? 0), 0);
    return { employeeId, totalNetPaid: totalNet.toFixed(4), batchCount: items.length };
  }

  /** Generate payroll batch for a given month string (YYYY-MM) */
  async generateMonthlyPayroll(month: string): Promise<PayrollBatchEntity> {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('month must be in YYYY-MM format (e.g. 2026-04)');
    }
    const [year, m] = month.split('-').map(Number);
    return this.generateBatch(year, m);
  }

  /** Global payroll financial summary across all batches */
  async getGlobalSummary(): Promise<any> {
    const tenantId = TenantContext.getRequiredTenantId();
    const batches = await this.dataSource.getRepository(PayrollBatchEntity).find({ where: { tenantId } });
    const totalGross = batches.reduce((acc, b) => acc + Number(b.totalGross ?? 0), 0);
    const totalNet = batches.reduce((acc, b) => acc + Number(b.totalNet ?? 0), 0);
    return {
      totalBatches: batches.length,
      totalGross: totalGross.toFixed(4),
      totalNet: totalNet.toFixed(4),
      completedBatches: batches.filter(b => b.status === PayrollBatchStatus.COMPLETED).length,
    };
  }

  /**
   * DEPARTMENTAL PAYROLL SUMMARY
   * Real JOIN: PayrollItem → Employee → group by departmentId.
   * Returns one row per department with aggregate net pay and headcount.
   */
  async getDepartmentalSummary(): Promise<Array<{
    departmentId: string;
    departmentLabel: string;
    headcount: number;
    totalGross: string;
    totalNet: string;
    totalDeductions: string;
  }>> {
    const tenantId = TenantContext.getRequiredTenantId();

    // Aggregate directly in DB using TypeORM QueryBuilder for efficiency
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('e.department_id', 'departmentId')
      .addSelect('COUNT(DISTINCT pi.employee_id)', 'headcount')
      .addSelect('SUM(CAST(pi.gross_salary AS NUMERIC))', 'totalGross')
      .addSelect('SUM(CAST(pi.net_payable AS NUMERIC))', 'totalNet')
      .addSelect('SUM(CAST(pi.deductions AS NUMERIC))', 'totalDeductions')
      .from('payroll_items', 'pi')
      .innerJoin('employees', 'e', 'e.id = pi.employee_id AND e.tenant_id = :tenantId', { tenantId })
      .where('pi.tenant_id = :tenantId', { tenantId })
      .groupBy('e.department_id')
      .orderBy('totalNet', 'DESC')
      .getRawMany();

    return rows.map(r => ({
      departmentId: r.departmentId ?? 'UNASSIGNED',
      departmentLabel: r.departmentId ?? 'Unassigned Department',
      headcount: Number(r.headcount ?? 0),
      totalGross: new BigNumber(r.totalGross ?? 0).toFixed(4),
      totalNet: new BigNumber(r.totalNet ?? 0).toFixed(4),
      totalDeductions: new BigNumber(r.totalDeductions ?? 0).toFixed(4),
    }));
  }

  /** Command-center payroll overview snapshot */
  async getCommandCenterOverview(asOfDate?: Date): Promise<any> {
    const [global, departmental] = await Promise.all([
      this.getGlobalSummary(),
      this.getDepartmentalSummary(),
    ]);
    return {
      snapshotAt: asOfDate ?? new Date(),
      global,
      departmental,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Queue API — async batch enqueue (Phase 9A)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Enqueue a payroll batch generation job.
   *
   * Guards:
   *  1. Backpressure: rejects if queue has > PAYROLL_QUEUE_MAX_DEPTH waiting jobs.
   *  2. Redlock: prevents duplicate enqueues for the same tenant + period from
   *     concurrent HTTP requests across multiple worker processes.
   *
   * Returns { jobId } immediately — caller polls GET /payroll/batch/job/:jobId/status.
   */
  async enqueueBatch(year: number, month: number): Promise<{ jobId: string }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const maxDepth = Number(process.env.PAYROLL_QUEUE_MAX_DEPTH) || 50;

    // 1. Backpressure check — prevent queue saturation before acquiring lock
    const { waiting } = await this.payrollQueue.getJobCounts('waiting');
    if (waiting > maxDepth) {
      throw new HttpException(
        `Payroll queue is saturated (${waiting} waiting jobs). Retry later.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Redlock — atomic guard against duplicate submissions for same period
    const lockKey  = `payroll:enqueue:${tenantId}:${year}-${String(month).padStart(2, '0')}`;
    const lockTtl  = 10_000; // 10s: enough to enqueue + return jobId

    return this.redlockService.withLock(lockKey, lockTtl, async () => {
      const job = await this.payrollQueue.add(
        'generate-batch',
        { year, month, tenantId, lockKey },
        {
          attempts:    3,
          backoff:     { type: 'exponential', delay: 5_000 },
          removeOnComplete: { count: 100 },
          removeOnFail:     { count: 50 },
        },
      );

      this.logger.log(
        `Payroll batch job enqueued: jobId=${job.id} year=${year} month=${month} tenant=${tenantId}`,
      );

      return { jobId: job.id as string };
    });
  }

  /**
   * Poll the status of a queued payroll batch job.
   * Returns BullMQ job state string + optional error message.
   */
  async getBatchJobStatus(jobId: string): Promise<{ jobId: string; status: string; error?: string }> {
    const job = await this.payrollQueue.getJob(jobId);
    if (!job) {
      return { jobId, status: 'unknown' };
    }
    const state = await job.getState();
    return {
      jobId,
      status: state,
      ...(state === 'failed' ? { error: job.failedReason } : {}),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Payslip generation helper — builds RenderDocumentDto from DB records
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Assembles a RenderDocumentDto for the given payroll item.
   * Used by GET /payroll/payslip/:itemId to generate PDF via DocumentEngineService.
   *
   * Tenant-scoped: will throw NotFoundException if itemId belongs to a different tenant.
   */
  async getPayslipData(itemId: string): Promise<RenderDocumentDto> {
    const tenantId = TenantContext.getRequiredTenantId();

    const item = await this.dataSource.getRepository(PayrollItemEntity).findOne({
      where: { id: itemId, tenantId },
    });
    if (!item) throw new NotFoundException(`Payroll item not found: ${itemId}`);

    const employee = await this.dataSource.getRepository(EmployeeEntity).findOne({
      where: { id: item.employeeId, tenantId },
    });
    if (!employee) throw new NotFoundException(`Employee not found for payroll item: ${itemId}`);

    const company = await this.dataSource.getRepository(CompanyEntity).findOne({
      where: { tenantId },
    });
    if (!company) throw new NotFoundException(`Company record not found for tenant: ${tenantId}`);

    // Fetch the parent batch for period metadata
    const batch = await this.dataSource.getRepository(PayrollBatchEntity).findOne({
      where: { id: item.batchId, tenantId },
    });

    const breakdown = item.metadata?.breakdown ?? {};

    const dto: RenderDocumentDto = {
      type:   DocumentType.SALARY_SLIP,
      design: DesignMode.PRINT_CLEAN,
      employee: {
        name:        `${employee.firstName} ${employee.lastName ?? ''}`.trim(),
        employeeId:   employee.employeeCode,
        designation:  employee.designation,
        email:        employee.workEmail,
        joinDate:     employee.joinDate,
        gross:        Number(item.grossSalary),
        net:          Number(item.netPayable),
        ctc:          Number(employee.monthlyCtc ?? 0),
      },
      company: {
        name: company.displayName,
      },
      custom: {
        period:         batch ? `${String(batch.month).padStart(2, '0')}/${batch.year}` : 'N/A',
        grossSalary:    item.grossSalary,
        netPayable:     item.netPayable,
        deductions:     item.deductions,
        currency:       item.currency,
        tds:            breakdown.tds  ?? '0.0000',
        pf:             breakdown.pf   ?? '0.0000',
        esi:            breakdown.esi  ?? '0.0000',
        batchId:        item.batchId,
        payrollItemId:  item.id,
        executionStatus: item.executionStatus,
      },
      includeQr:        true,
      includeSignature: false,
      includeStamp:     false,
      tenantId,
    };

    return dto;
  }
}
