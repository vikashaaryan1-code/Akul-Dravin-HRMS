import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager, In, Not } from 'typeorm';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { LedgerTransactionEntity, LedgerTransactionStatus, ForensicAuditStatus } from '../../database/entities/ledger-transaction.entity';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { FinancialCommand } from './interfaces/financial-command.interface';
import { BlockedFlowException } from '../../common/exceptions/blocked-flow.exception';
import BigNumber from 'bignumber.js';
import { createHash } from 'node:crypto';

@Injectable()
export class LedgerService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * THE TRUTH LAYER: OMNIX Atomic Transaction Executor.
   * Responsibilities:
   * 1. Deterministic Settings Resolution.
   * 2. Pessimistic Row-Level Locking (Accounts + Chain Head).
   * 3. Linked Forensic Hashing (SHA-256).
   * 4. Idempotent State Machine (PENDING -> COMMITTED).
   */
  async executeTransaction(command: FinancialCommand): Promise<LedgerTransactionEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const settings = TenantContext.getSettings();

    return await this.dataSource.transaction(async (manager) => {
      // 0. Safety Halt (Forensic Check)
      // Block execution if high-priority anomalies exist for this tenant.
      const activeAnomalies = await manager.count(LedgerTransactionEntity, {
        where: { tenantId, auditStatus: ForensicAuditStatus.ANOMALY_DETECTED }
      });

      if (activeAnomalies > 0) {
        throw new BadRequestException(`SAFETY_HALT: Financial operations are suspended due to ${activeAnomalies} unresolved anomalies. Please reconcile the Truth Layer.`);
      }

      // 1. Idempotency Check
      const existingTx = await manager.findOne(LedgerTransactionEntity, {
        where: { tenantId, idempotencyKey: command.idempotencyKey },
      });

      if (existingTx) {
        if (existingTx.status === LedgerTransactionStatus.COMMITTED) return existingTx;
        throw new BadRequestException(`Transaction Collision: A pending or failed transaction exists for this key.`);
      }

      // 2. Lock & Sequence (Chain Head Identification)
      // Acquire pessimistic lock on the tenant's hash chain to prevent race conditions.
      const lastEntry = await manager
        .createQueryBuilder(LedgerEntryEntity, 'entry')
        .where('entry.tenantId = :tenantId', { tenantId })
        .orderBy('entry.createdAt', 'DESC')
        .setLock('pessimistic_write')
        .getOne();

      let previousHash = lastEntry?.entryHash || createHash('sha256').update(tenantId).digest('hex');

      // 3. Resolve & Lock Accounts
      const accounts = await this.lockAndResolveAccounts(manager, tenantId, command);

      // 4. Initialize Transaction (PENDING)
      const transaction = manager.create(LedgerTransactionEntity, {
        tenantId,
        idempotencyKey: command.idempotencyKey,
        reference: command.reference,
        type: command.type,
        description: command.description,
        status: LedgerTransactionStatus.CREATED,
        auditStatus: ForensicAuditStatus.CLEAR,
        policySnapshot: settings,
        metadata: command.metadata,
      });

      await manager.save(transaction);

      // 5. Entry Generation & Chaining
      const entryHashes: string[] = [];
      const entries: LedgerEntryEntity[] = [];

      for (const entryCmd of command.entries) {
        const debitAccount = accounts.get(entryCmd.debitAccountCode);
        const creditAccount = accounts.get(entryCmd.creditAccountCode);

        if (!debitAccount || !creditAccount) {
          throw new BadRequestException(`Account mapping error: ${entryCmd.debitAccountCode} or ${entryCmd.creditAccountCode} not found.`);
        }

        const amountNum = new BigNumber(entryCmd.amount);
        const precision = settings.financial.precision;
        const amountStr = amountNum.toFixed(precision);

        // Update Balances (Truth Calculation)
        this.updateAccountBalance(debitAccount, amountStr, 'DEBIT', settings);
        this.updateAccountBalance(creditAccount, amountStr, 'CREDIT', settings);

        await manager.save(debitAccount);
        await manager.save(creditAccount);

        // Compute Forensic Hash (Linked)
        const entryData = `${transaction.id}|${debitAccount.id}|${creditAccount.id}|${amountStr}`;
        const entryHash = createHash('sha256')
          .update(entryData + previousHash)
          .digest('hex');

        const entry = manager.create(LedgerEntryEntity, {
          tenantId,
          transactionId: transaction.id,
          debitAccountId: debitAccount.id,
          creditAccountId: creditAccount.id,
          amount: amountStr,
          entryHash: entryHash,
          description: entryCmd.description,
        });

        previousHash = entryHash; // Chain moves forward
        entryHashes.push(entryHash);
        entries.push(entry);
      }

      await manager.save(entries);

      // 6. Aggregate Transaction Seal
      const txMetadataStr = JSON.stringify(command.metadata || {});
      
      // FORENSIC FX SNAPSHOT: Lock in the rates used at execution.
      transaction.policySnapshot = {
          ...settings,
          forensicTrace: {
              currency: command.metadata?.currency || 'INR',
              precision: settings.financial?.precision || 4,
              fxRate: command.metadata?.fxRate || '1.0000',
              executedAt: new Date().toISOString()
          }
      };

      const transactionHash = createHash('sha256')
        .update(entryHashes.join(',') + txMetadataStr + JSON.stringify(transaction.policySnapshot))
        .digest('hex');

      transaction.transactionHash = transactionHash;
      transaction.status = LedgerTransactionStatus.COMMITTED;
      
      return await manager.save(transaction);
    });
  }

  /**
   * Safe Balance Update
   */
  private updateAccountBalance(account: LedgerAccountEntity, amountStr: string, type: 'DEBIT' | 'CREDIT', settings: any) {
    const amount = new BigNumber(amountStr);
    const existingBalance = new BigNumber(account.balance);
    let newBalance: BigNumber;

    if (type === 'DEBIT') {
      newBalance = existingBalance.plus(amount);
    } else {
      newBalance = existingBalance.minus(amount);
    }

    // Firm Invariant Guard
    if (settings.financial.allowNegativeBalance === false && newBalance.isLessThan(0)) {
       throw new BadRequestException(`INVARIANT_VIOLATION: Account ${account.code} cannot have negative balance.`);
    }

    account.balance = newBalance.toString();
  }

  /**
   * Pessimistic Lock Acquisition
   */
  private async lockAndResolveAccounts(
    manager: EntityManager, 
    tenantId: string, 
    command: FinancialCommand
  ): Promise<Map<string, LedgerAccountEntity>> {
    const codes = new Set<string>();
    command.entries.forEach(e => {
      codes.add(e.debitAccountCode);
      codes.add(e.creditAccountCode);
    });

    const accountsList = await manager
      .createQueryBuilder(LedgerAccountEntity, 'account')
      .where('account.tenantId = :tenantId', { tenantId })
      .andWhere('account.code IN (:...codes)', { codes: Array.from(codes) })
      .setLock('pessimistic_write')
      .getMany();

    if (accountsList.length !== codes.size) {
      const missing = Array.from(codes).filter(c => !accountsList.find(a => a.code === c));
      throw new BadRequestException(`Missing Ledger Accounts: ${missing.join(', ')}`);
    }

    return new Map(accountsList.map(a => [a.code, a]));
  }

  /**
   * Account Provisioning (Controlled)
   */
  async ensureAccount(tenantId: string, code: string, name: string, type: LedgerAccountType): Promise<LedgerAccountEntity> {
    const repo = this.dataSource.getRepository(LedgerAccountEntity);
    let account = await repo.findOne({ where: { tenantId, code } });

    if (!account) {
      account = repo.create({
        tenantId,
        code,
        name,
        type,
        balance: '0.0000',
        isActive: true,
      });
      await repo.save(account);
    }

    return account;
  }

  /**
   * FINALITY GUARD
   * Enforces that a transaction is 'RECONCILED' before allowing it to influence
   * payouts, statutory filings, or batch finalizations.
   */
  async ensureReconciled(transactionId: string): Promise<LedgerTransactionEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const tx = await this.dataSource.getRepository(LedgerTransactionEntity).findOne({
      where: { id: transactionId, tenantId }
    });

    if (!tx) {
      throw new BadRequestException(`Transaction ${transactionId} not found.`);
    }

    if (tx.status !== LedgerTransactionStatus.RECONCILED) {
      throw new BlockedFlowException(tx.id, tx.status);
    }

    return tx;
  }

  /**
   * BATCH FINALITY GUARD
   * Verifies that all provided transactions are RECONCILED.
   * Throws BlockedFlowException if any transaction is not reconciled.
   */
  async ensureAllReconciled(transactionIds: string[]): Promise<void> {
    const tenantId = TenantContext.getRequiredTenantId();
    const unreconciled = await this.dataSource.getRepository(LedgerTransactionEntity).count({
        where: { 
            id: In(transactionIds), 
            tenantId, 
            status: Not(LedgerTransactionStatus.RECONCILED) 
        }
    });

    if (unreconciled > 0) {
        throw new BlockedFlowException('BATCH_EXECUTION', `${unreconciled} transactions are not yet reconciled.`);
    }
  }

  /**
   * SETTLEMENT GATING
   * Moves a transaction from COMMITTED to SETTLEMENT_PENDING once it is 
   * officially dispatched to an external provider (bank/gateway).
   */
  async markAsSettlementPending(transactionId: string): Promise<LedgerTransactionEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const repo = this.dataSource.getRepository(LedgerTransactionEntity);
    
    const tx = await repo.findOne({ where: { id: transactionId, tenantId } });
    if (!tx) throw new BadRequestException(`Transaction ${transactionId} not found.`);

    if (!tx.canTransitionTo(LedgerTransactionStatus.SETTLEMENT_PENDING)) {
        throw new BadRequestException(`Invalid state transition: Cannot move ${tx.status} to SETTLEMENT_PENDING.`);
    }

    tx.status = LedgerTransactionStatus.SETTLEMENT_PENDING;
    return await repo.save(tx);
  }

  /**
   * IDEMPOTENCY RECOVERY
   * Allows external orchestrators to check if a specific idempotent command
   * has already been successfully committed to the ledger.
   */
  async findTransactionByIdempotencyKey(tenantId: string, key: string): Promise<LedgerTransactionEntity | null> {
    return await this.dataSource.getRepository(LedgerTransactionEntity).findOne({
        where: { tenantId, idempotencyKey: key }
    });
  }

  /**
   * NON-MUTATING REVERSAL PROTOCOL
   * Neutralizes a mistake by issuing a mirrored transaction.
   * Swaps all Credit/Debit accounts.
   */
  async reverseTransaction(transactionId: string): Promise<LedgerTransactionEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const repo = this.dataSource.getRepository(LedgerTransactionEntity);
    const entryRepo = this.dataSource.getRepository(LedgerEntryEntity);

    const originalTx = await repo.findOne({ 
        where: { id: transactionId, tenantId },
    });

    if (!originalTx) throw new BadRequestException(`Transaction ${transactionId} not found.`);
    if (originalTx.status === LedgerTransactionStatus.REVERSED) {
        throw new BadRequestException('Transaction is already reversed.');
    }

    // Load entries separately (no OneToMany relation on entity)
    const originalEntries = await entryRepo.find({ where: { transactionId } });

    // MAP ENTRIES: Swap Credit and Debit accounts
    const reversedEntries = originalEntries.map(entry => ({
        debitAccountCode: String(entry.creditAccountId),  // Swap — resolved to code below
        creditAccountCode: String(entry.debitAccountId),  // Swap
        amount: entry.amount,
        description: `Reversal: ${entry.description ?? ''}`
    }));

    // Resolve account IDs → codes via a quick lookup
    const allAccountIds = [
        ...originalEntries.map(e => e.debitAccountId),
        ...originalEntries.map(e => e.creditAccountId)
    ].filter(Boolean) as string[];

    const accountList = await this.dataSource.getRepository(LedgerAccountEntity).findByIds(allAccountIds);
    const accountMap = new Map(accountList.map(a => [a.id, a.code]));

    const resolvedEntries = reversedEntries.map((e, i) => ({
        debitAccountCode: accountMap.get(originalEntries[i].creditAccountId!) ?? e.debitAccountCode,
        creditAccountCode: accountMap.get(originalEntries[i].debitAccountId!) ?? e.creditAccountCode,
        amount: e.amount,
        description: e.description,
    }));

    const command: FinancialCommand = {
        idempotencyKey: `REVERSAL|${originalTx.id}`,
        reference: `REVERSAL_OF_${originalTx.reference || originalTx.id}`,
        type: 'REVERSAL',
        description: `Mirror Reversal of Transaction ${originalTx.id}`,
        metadata: { 
            reversalOfTransactionId: originalTx.id,
            reason: 'Correction',
            originalPolicy: originalTx.policySnapshot?.forensicTrace
        },
        entries: resolvedEntries,
    };

    return await this.dataSource.transaction(async (manager) => {
        const reversalTx = await this.executeTransaction(command);
        
        // Link parent
        reversalTx.reversalOfTransactionId = originalTx.id;
        await manager.save(reversalTx);

        // Mark original as REVERSED
        originalTx.status = LedgerTransactionStatus.REVERSED;
        await manager.save(originalTx);

        return reversalTx;
    });
  }
}
