import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager, Between } from 'typeorm';
import { LedgerTransactionEntity, LedgerTransactionStatus, ForensicAuditStatus } from '../../database/entities/ledger-transaction.entity';
import { ExternalTransactionEntity, ExternalTransactionSource, ExternalTransactionStatus, ReconciliationStatus } from '../../database/entities/external-transaction.entity';
import { ForensicAuditEntity, AnomalyType } from '../../database/entities/forensic-audit.entity';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';
import { createHmac } from 'node:crypto';

export interface ExternalEvent {
  externalReferenceId: string;
  source: ExternalTransactionSource;
  amount: string;
  status: ExternalTransactionStatus;
  eventDate: Date;
  hashSignature?: string; // For Zero-Trust validation
  metadata?: any;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * PHASE 1: INGESTION (Event Store Pattern)
   * `event` -> `store`
   * Responsibilities: Handshake, Duplication Check, Persistent Ingestion.
   */
  async ingest(event: ExternalEvent): Promise<ExternalTransactionEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    // 1. Handshake Verification (Zero-Trust)
    if (event.hashSignature) {
        await this.verifySignature(event);
    }

    return await this.dataSource.transaction(async (manager) => {
      // 2. Check for double-ingestion
      let externalTx = await manager.findOne(ExternalTransactionEntity, {
          where: { externalReferenceId: event.externalReferenceId, tenantId },
      });

      if (externalTx) {
          this.logger.warn(`Potential Double Ingestion: ${event.externalReferenceId}. Updating existing record.`);
          externalTx.status = event.status;
          externalTx.metadata = { ...externalTx.metadata, ...event.metadata, reingestedAt: new Date() };
          return await manager.save(externalTx);
      }

      // 3. Store the Claim (UNMATCHED by default)
      externalTx = manager.create(ExternalTransactionEntity, {
          tenantId,
          externalReferenceId: event.externalReferenceId,
          source: event.source,
          status: event.status,
          amount: event.amount,
          eventDate: event.eventDate,
          reconciliationStatus: ReconciliationStatus.UNMATCHED,
          hashSignature: event.hashSignature,
          metadata: event.metadata,
      });

      const saved = await manager.save(externalTx);
      
      // 4. Opportunistic Resolution
      // We try to reconcile immediately, but failures are handled gracefully (Event-Store pattern).
      try {
          await this.resolve(manager, saved.id);
      } catch (e) {
          this.logger.log(`Resolution Deferred for ${saved.externalReferenceId}: ${e.message}`);
      }

      return saved;
    });
  }

  /**
   * PHASE 2: RESOLUTION (Deterministic Transition)
   * `store` -> `reconcile`
   * Responsibilities: Priority Matching, Parity Audit, Lifecycle Finalization.
   */
  async resolve(manager: EntityManager, externalTxId: string): Promise<void> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    const externalTx = await manager.findOne(ExternalTransactionEntity, {
        where: { id: externalTxId, tenantId },
        relations: ['linkedTransaction']
    });

    if (!externalTx) throw new BadRequestException('External Claim not found.');
    if (externalTx.reconciliationStatus === ReconciliationStatus.MATCHED) return;

    // 1. Find Match by Priority
    const ledgerTx = await this.findMatchByPriority(manager, tenantId, externalTx);

    if (!ledgerTx) {
        externalTx.reconciliationStatus = ReconciliationStatus.UNMATCHED;
        await manager.save(externalTx);
        return;
    }

    // 2. Link & Audit
    externalTx.linkedTransaction = ledgerTx;
    await this.runParityAudit(manager, ledgerTx, externalTx);

    // 3. State Machine Transition: COMMITTED -> SETTLED -> RECONCILED
    if (externalTx.status === ExternalTransactionStatus.SUCCESS) {
        
        // Step 1: Transitions to SETTLED (Bank confirmed success)
        if (ledgerTx.canTransitionTo(LedgerTransactionStatus.SETTLED)) {
            ledgerTx.status = LedgerTransactionStatus.SETTLED;
            ledgerTx.settledAt = new Date();
        }

        // Step 2: Transitions to RECONCILED (Internal parity match)
        if (externalTx.reconciliationStatus === ReconciliationStatus.MATCHED) {
            if (ledgerTx.canTransitionTo(LedgerTransactionStatus.RECONCILED)) {
                ledgerTx.status = LedgerTransactionStatus.RECONCILED;
                ledgerTx.reconciledAt = new Date();
                ledgerTx.auditStatus = ForensicAuditStatus.CLEAR;
            }
        } else if (externalTx.reconciliationStatus === ReconciliationStatus.MISMATCH) {
             ledgerTx.status = LedgerTransactionStatus.ANOMALY;
             await this.flagAnomaly(manager, ledgerTx, externalTx, AnomalyType.AMOUNT_MISMATCH);
        }
    } else if (externalTx.status === ExternalTransactionStatus.FAILED) {
        ledgerTx.status = LedgerTransactionStatus.FAILED;
    }

    await manager.save(ledgerTx);
    await manager.save(externalTx);
  }

  /**
   * RETRY ENGINE: Batch resolve unmatched claims
   */
  async retryOrphans(): Promise<{ attempted: number, resolved: number }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const orphans = await this.dataSource.getRepository(ExternalTransactionEntity).find({
        where: { tenantId, reconciliationStatus: ReconciliationStatus.UNMATCHED }
    });

    let resolvedCount = 0;
    for (const orphan of orphans) {
        try {
            await this.dataSource.transaction(async manager => {
                await this.resolve(manager, orphan.id);
            });
            resolvedCount++;
        } catch (e) {
            this.logger.error(`Retry Failed for ${orphan.externalReferenceId}: ${e.message}`);
        }
    }

    return { attempted: orphans.length, resolved: resolvedCount };
  }

  private async findMatchByPriority(manager: EntityManager, tenantId: string, event: ExternalTransactionEntity): Promise<LedgerTransactionEntity | null> {
    // Priority 1: Exact Reference Match
    let tx = await manager.findOne(LedgerTransactionEntity, {
        where: { tenantId, reference: event.externalReferenceId }
    });

    if (tx) return tx;

    // Priority 2: Amount + Timestamp Window Match
    const windowMinutes = 60;
    const startTime = new Date(event.eventDate.getTime() - windowMinutes * 60000);
    const endTime = new Date(event.eventDate.getTime() + windowMinutes * 60000);

    const candidates = await manager.find(LedgerTransactionEntity, {
        where: { 
            tenantId, 
            status: LedgerTransactionStatus.COMMITTED,
            transactionDate: Between(startTime, endTime)
        }
    });

    for (const candidate of candidates) {
        const ledgerAmount = await this.calculateLedgerTotal(manager, candidate.id);
        if (ledgerAmount.isEqualTo(new BigNumber(event.amount))) {
            return candidate;
        }
    }

    return null;
  }

  private async verifySignature(event: ExternalEvent): Promise<void> {
    const secret = process.env.FINANCE_PROVIDER_SECRET || 'PROVIDER_SECRET_PLACEHOLDER'; 
    const payload = JSON.stringify({ ref: event.externalReferenceId, amount: event.amount });
    const expected = createHmac('sha256', secret).update(payload).digest('hex');

    if (event.hashSignature !== expected) {
        this.logger.error(`SECURITY ALERT: Webhook signature mismatch for ref ${event.externalReferenceId}`);
        throw new UnauthorizedException('Invalid hash signature from external source.');
    }
  }

  private async runParityAudit(manager: EntityManager, ledgerTx: LedgerTransactionEntity, externalTx: ExternalTransactionEntity): Promise<void> {
    const ledgerAmount = await this.calculateLedgerTotal(manager, ledgerTx.id);
    const externalAmount = new BigNumber(externalTx.amount);

    if (!ledgerAmount.isEqualTo(externalAmount)) {
        externalTx.reconciliationStatus = ReconciliationStatus.MISMATCH;
    } else {
        externalTx.reconciliationStatus = ReconciliationStatus.MATCHED;
    }
  }

  private async calculateLedgerTotal(manager: EntityManager, txId: string): Promise<BigNumber> {
    // Note: In a production environment, we should have a 'total_amount' field on the transaction header
    // for performance. For now, we sum the entries.
    const entries = await manager.find(require('../../database/entities/ledger-entry.entity').LedgerEntryEntity, {
        where: { transactionId: txId }
    });
    return entries.reduce((acc, e) => acc.plus(new BigNumber(e.amount)), new BigNumber(0));
  }

  private async flagAnomaly(manager: EntityManager, ledgerTx: LedgerTransactionEntity, externalTx: ExternalTransactionEntity, type: AnomalyType): Promise<void> {
    ledgerTx.auditStatus = ForensicAuditStatus.ANOMALY_DETECTED;
    const anomaly = manager.create(ForensicAuditEntity, {
      tenantId: ledgerTx.tenantId,
      anomalyType: type,
      targetId: ledgerTx.id,
      evidenceSnapshot: { ledgerTx, externalTx, detectedAt: new Date() }
    });
    await manager.save(anomaly);
  }
}
