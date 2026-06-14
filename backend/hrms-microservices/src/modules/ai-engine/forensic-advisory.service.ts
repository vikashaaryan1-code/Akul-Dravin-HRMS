import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { ExternalTransactionEntity, ReconciliationStatus } from '../../database/entities/external-transaction.entity';
import { PayrollBatchEntity, PayrollBatchStatus } from '../../database/entities/payroll-batch.entity';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';


@Injectable()
export class ForensicAdvisoryService {
  private readonly logger = new Logger(ForensicAdvisoryService.name);

  /**
   * SCAN FOR ANOMALIES (RED)
   * Hard failures that compromise ledger integrity.
   */
  async detectHardAnomalies(snapshotAt: Date): Promise<any[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const anomalies = [];

    // 1. Reconciliation Violations (Over 48 hours unmatched)
    const cutoff48h = new Date(snapshotAt.getTime() - 48 * 60 * 60 * 1000);
    const staleTransactions = await TenantContext.getRepository(ExternalTransactionEntity).count({
        where: {
            tenantId,
            reconciliationStatus: ReconciliationStatus.UNMATCHED,
            eventDate: LessThan(cutoff48h)
        }
    });

    if (staleTransactions > 0) {
        anomalies.push({
            type: 'STALE_RECONCILIATION',
            severity: 'HIGH',
            message: `${staleTransactions} transactions have remained unmatched beyond the 48-hour forensic window.`,
            confidence: 1.0
        });
    }

    return anomalies;
  }

  /**
   * SCAN FOR WARNINGS (YELLOW)
   * Operational concerns within SLA.
   */
  async detectWarnings(snapshotAt: Date): Promise<any[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const warnings = [];

    // 1. Reconciliation SLA (Within 24-48 hours)
    const cutoff24h = new Date(snapshotAt.getTime() - 24 * 60 * 60 * 1000);
    const pendingSla = await TenantContext.getRepository(ExternalTransactionEntity).count({
        where: {
            tenantId,
            reconciliationStatus: ReconciliationStatus.UNMATCHED,
            eventDate: LessThan(snapshotAt),
            receivedAt: MoreThan(cutoff24h)
        }
    });

    if (pendingSla > 0) {
        warnings.push({
            type: 'RECONCILIATION_SLA_WARNING',
            severity: 'LOW',
            message: `${pendingSla} transactions are pending reconciliation within the active SLA window.`,
            confidence: 0.95
        });
    }

    return warnings;
  }

  /**
   * PAYROLL VARIANCE GUARD
   * Comparing current batch vs Historical Average.
   */
  async detectPayrollVariance(batchId: string, snapshotAt: Date): Promise<any[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const batchRepo = TenantContext.getRepository(PayrollBatchEntity);
    
    const currentBatch = await batchRepo.findOne({ where: { id: batchId, tenantId } });
    if (!currentBatch) return [];

    // Find previous successful batch for comparison
    const previousBatch = await batchRepo.findOne({
        where: { 
            tenantId, 
            status: PayrollBatchStatus.COMPLETED,
            periodStart: LessThan(currentBatch.periodStart ?? new Date())
        },
        order: { periodStart: 'DESC' }
    });

    if (!previousBatch) return [];

    const variance = new BigNumber(currentBatch.totalNet || 0)
        .minus(previousBatch.totalNet || 0)
        .dividedBy(previousBatch.totalNet || 1)
        .multipliedBy(100);

    if (variance.absoluteValue().gt(20)) {
        return [{
            type: 'PAYROLL_NET_VARIANCE',
            severity: 'MEDIUM',
            message: `Batch total net (₹${currentBatch.totalNet}) shows a ${variance.toFixed(2)}% variance from last cycle (₹${previousBatch.totalNet}).`,
            confidence: 0.85
        }];
    }

    return [];
  }

  /**
   * RECONCILIATION SLA BREAKDOWN
   */
  async getReconciliationSlaDetails(snapshotAt: Date) {
    const tenantId = TenantContext.getRequiredTenantId();
    const repo = TenantContext.getRepository(ExternalTransactionEntity);
    const slaMinutes = 30;
    const slaCutoff = new Date(snapshotAt.getTime() - slaMinutes * 60 * 1000);

    const [withinSla, breachedSla] = await Promise.all([
        repo.count({
            where: {
                tenantId,
                reconciliationStatus: ReconciliationStatus.UNMATCHED,
                eventDate: MoreThan(slaCutoff),
                receivedAt: LessThan(snapshotAt)
            }
        }),
        repo.count({
            where: {
                tenantId,
                reconciliationStatus: ReconciliationStatus.UNMATCHED,
                eventDate: LessThan(slaCutoff)
            }
        })
    ]);

    return { withinSla, breachedSla, slaMinutes };
  }
}
