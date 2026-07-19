import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { ExternalTransactionEntity } from '../../database/entities/external-transaction.entity';
import { TenantContext } from '../../common/context/tenant-context';

export interface ReconReportRow {
    date: Date;
    description: string;
    internalAmount: string;
    externalAmount: string;
    difference: string;
    status: string;
}

@Injectable()
export class ReconReportService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * BANK RECONCILIATION REPORT
   * Compares internal ledger state against external evidence (Bank Feed).
   */
  async getReconReport(accountId: string, startDate: Date, endDate: Date): Promise<ReconReportRow[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    // 1. Get Internal Bank Entries
    const internalEntries = await this.dataSource.getRepository(LedgerEntryEntity).find({
        where: [
            { tenantId, debitAccountId: accountId },
            { tenantId, creditAccountId: accountId }
        ],
        relations: ['transaction'],
        order: { createdAt: 'ASC' }
    });

    // 2. Get External Bank Confirmations
    const externalTxs = await this.dataSource.getRepository(ExternalTransactionEntity).find({
        where: { tenantId },
        order: { eventDate: 'ASC' }
    });

    // Mapping logic (simplified for proof of concept)
    // In a real system, this would use the ReconciliationService's link mapping.
    const report: ReconReportRow[] = [];
    
    for (const entry of internalEntries) {
        if (entry.createdAt < startDate || entry.createdAt > endDate) continue;

        // Try to find matching evidence
        const evidence = externalTxs.find(tx => tx.externalReferenceId === entry.transaction?.reference);

        report.push({
            date: entry.createdAt,
            description: entry.description || 'Internal Ledger Entry',
            internalAmount: entry.amount,
            externalAmount: evidence?.amount || '0.0000',
            difference: evidence ? '0.0000' : entry.amount,
            status: evidence ? 'RECONCILED' : 'UNMATCHED'
        });
    }

    return report;
  }

  /**
   * ANOMALY SUMMARY
   * Quick status snapshot for DashboardAggregatorService.
   * Highly optimized: replaces 3 sequential database round-trips with a single aggregation query.
   */
  async getAnomalySummary(_snapshotAt?: Date): Promise<{
    anomalies: Array<{ type: string; id: string }>;
    pendingExternalCount: number;
    lastReconciledAt: Date | null;
  }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const { ReconciliationStatus } = await import('../../database/entities/external-transaction.entity');
    const { TenantQueryPolicy } = await import('../../common/governance/tenant/tenant-query-policy');
    const repo = this.dataSource.getRepository(ExternalTransactionEntity);

    // Build optimized single-query aggregation via QueryBuilder
    const qb = repo.createQueryBuilder('et');

    // Enforce multi-tenant isolation policy on query builder
    TenantQueryPolicy.enforce(qb, tenantId, 'et', 'ReconReportService', 'getAnomalySummary');

    // Aggregate unmatched count, mismatch count, and retrieve latest matched eventDate in one trip
    const result = await qb
      .select("SUM(CASE WHEN et.reconciliationStatus = :unmatchedStatus THEN 1 ELSE 0 END)", 'unmatchedCount')
      .addSelect("SUM(CASE WHEN et.reconciliationStatus = :mismatchStatus THEN 1 ELSE 0 END)", 'mismatchCount')
      .addSelect("MAX(CASE WHEN et.reconciliationStatus = :matchedStatus THEN et.eventDate ELSE NULL END)", 'lastMatchedDate')
      .setParameters({
        unmatchedStatus: ReconciliationStatus.UNMATCHED,
        mismatchStatus: ReconciliationStatus.MISMATCH,
        matchedStatus: ReconciliationStatus.MATCHED,
      })
      .getRawOne();

    const unmatchedCount = parseInt(result?.unmatchedCount, 10) || 0;
    const mismatchCount = parseInt(result?.mismatchCount, 10) || 0;
    const lastMatchedDate = result?.lastMatchedDate ? new Date(result.lastMatchedDate) : null;

    const anomalies = Array.from({ length: mismatchCount }, (_, i) => ({
      type: 'AMOUNT_MISMATCH',
      id: `ANOMALY-${i}`,
    }));

    return {
      anomalies,
      pendingExternalCount: unmatchedCount,
      lastReconciledAt: lastMatchedDate,
    };
  }
}

