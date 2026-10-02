import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { LedgerAccountEntity } from '../../database/entities/ledger-account.entity';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';

export interface StatutoryAccountSummary {
    accountCode: string;
    accountName: string;
    openingBalance: string;
    additions: string; // From Payroll Accruals
    payments: string;  // From Bank Settlements
    closingBalance: string;
}

@Injectable()
export class StatutoryReportService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * STATUTORY LIABILITY REPORT (INDIA)
   * Tracks obligations for TDS, PF, and ESI.
   * Derived strictly from Ledger entries.
   *
   * OPTIMIZATION SUMMARY:
   * Replaced sequential per-account loops executing 4 database queries per account
   * (13+ queries total for 3 accounts) with 2 bulk database queries using double-ended
   * conditional aggregation (`SUM(CASE ...)` for opening balance, additions, payments)
   * grouped by `creditAccountId` and `debitAccountId`.
   *
   * PERFORMANCE IMPACT:
   * - Reduces database round-trips from O(4N + 1) to O(1) (3 queries total).
   * - Cuts total execution time significantly, eliminating N+1 query overhead.
   */
  async getComplianceSummary(startDate: Date, endDate: Date): Promise<StatutoryAccountSummary[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    // 1. Identify Liability Accounts (1 query)
    const accounts = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: [
            { tenantId, code: 'LIAB-TDS' },
            { tenantId, code: 'LIAB-PF' },
            { tenantId, code: 'LIAB-ESI' }
        ]
    });

    if (!accounts.length) {
      return [];
    }

    const accountIds = accounts.map(a => a.id);

    // 2. Aggregate all credit entries for target accounts in single query (1 query)
    // Computes opening credit sum, additions (credit sum in range)
    const creditAggregates = await this.dataSource
      .getRepository(LedgerEntryEntity)
      .createQueryBuilder('entry')
      .select('entry.creditAccountId', 'accountId')
      .addSelect(
        `SUM(CASE WHEN entry.createdAt < :startDate THEN entry.amount ELSE 0 END)`,
        'openingCredit'
      )
      .addSelect(
        `SUM(CASE WHEN entry.createdAt >= :startDate AND entry.createdAt <= :endDate THEN entry.amount ELSE 0 END)`,
        'additions'
      )
      .where('entry.tenantId = :tenantId', { tenantId })
      .andWhere('entry.creditAccountId IN (:...accountIds)', { accountIds })
      .andWhere('entry.createdAt <= :endDate', { endDate })
      .setParameter('startDate', startDate)
      .groupBy('entry.creditAccountId')
      .getRawMany();

    // 3. Aggregate all debit entries for target accounts in single query (1 query)
    // Computes opening debit sum, payments (debit sum in range)
    const debitAggregates = await this.dataSource
      .getRepository(LedgerEntryEntity)
      .createQueryBuilder('entry')
      .select('entry.debitAccountId', 'accountId')
      .addSelect(
        `SUM(CASE WHEN entry.createdAt < :startDate THEN entry.amount ELSE 0 END)`,
        'openingDebit'
      )
      .addSelect(
        `SUM(CASE WHEN entry.createdAt >= :startDate AND entry.createdAt <= :endDate THEN entry.amount ELSE 0 END)`,
        'payments'
      )
      .where('entry.tenantId = :tenantId', { tenantId })
      .andWhere('entry.debitAccountId IN (:...accountIds)', { accountIds })
      .andWhere('entry.createdAt <= :endDate', { endDate })
      .setParameter('startDate', startDate)
      .groupBy('entry.debitAccountId')
      .getRawMany();

    // Map aggregated results by accountId for fast O(1) lookup
    const creditMap = new Map<string, { openingCredit: string; additions: string }>();
    for (const row of creditAggregates) {
      creditMap.set(row.accountId, {
        openingCredit: row.openingCredit || '0.0000',
        additions: row.additions || '0.0000',
      });
    }

    const debitMap = new Map<string, { openingDebit: string; payments: string }>();
    for (const row of debitAggregates) {
      debitMap.set(row.accountId, {
        openingDebit: row.openingDebit || '0.0000',
        payments: row.payments || '0.0000',
      });
    }

    const report: StatutoryAccountSummary[] = [];

    for (const account of accounts) {
      const cData = creditMap.get(account.id) || { openingCredit: '0.0000', additions: '0.0000' };
      const dData = debitMap.get(account.id) || { openingDebit: '0.0000', payments: '0.0000' };

      const openingBalance = new BigNumber(cData.openingCredit)
        .minus(dData.openingDebit)
        .toFixed(4);

      const additions = new BigNumber(cData.additions).toFixed(4);
      const payments = new BigNumber(dData.payments).toFixed(4);

      const closingBalance = new BigNumber(openingBalance)
        .plus(additions)
        .minus(payments)
        .toFixed(4);

      report.push({
        accountCode: account.code,
        accountName: account.name,
        openingBalance,
        additions,
        payments,
        closingBalance,
      });
    }

    return report;
  }
}
