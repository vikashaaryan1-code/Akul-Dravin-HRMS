import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';
import BigNumber from 'bignumber.js';

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  type: LedgerAccountType;
  debitTotal: string;
  creditTotal: string;
  closingBalance: string;
}

export interface TrialBalanceReport {
  timestamp: string;
  items: TrialBalanceItem[];
  totalDebits: string;
  totalCredits: string;
  isBalanced: boolean;
}

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * FINANCIAL TRUTH CHECKSUM: TRIAL BALANCE
   * Proves Total Debits === Total Credits across all accounts.
   *
   * PERFORMANCE OPTIMIZATION (Bolt ⚡):
   * Replaced N-loop queries (2N queries) with 2 grouped aggregation queries
   * executed at the database level with TenantQueryPolicy governance.
   * Total queries reduced from 1 + 2N to 3 queries regardless of account count
   * (~97% query reduction for a chart of 50 accounts).
   */
  async getTrialBalance(): Promise<TrialBalanceReport> {
    const tenantId = TenantContext.getRequiredTenantId();
    const accounts = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: { tenantId, isActive: true }
    });

    const { debitMap, creditMap } = await this.getAggregatedAccountTotals(tenantId);

    const reportItems: TrialBalanceItem[] = [];
    let totalDebits = new BigNumber(0);
    let totalCredits = new BigNumber(0);

    for (const account of accounts) {
        const debitTotal = debitMap.get(account.id) || '0.0000';
        const creditTotal = creditMap.get(account.id) || '0.0000';
        const closingBalance = this.calculateClosingBalance(account.type, debitTotal, creditTotal);

        reportItems.push({
            accountCode: account.code,
            accountName: account.name,
            type: account.type,
            debitTotal,
            creditTotal,
            closingBalance
        });

        totalDebits = totalDebits.plus(debitTotal);
        totalCredits = totalCredits.plus(creditTotal);
    }

    const report: TrialBalanceReport = {
        timestamp: new Date().toISOString(),
        items: reportItems,
        totalDebits: totalDebits.toFixed(4),
        totalCredits: totalCredits.toFixed(4),
        isBalanced: totalDebits.isEqualTo(totalCredits)
    };

    if (!report.isBalanced) {
        this.logger.error(`Critical Invariant Violation: Trial Balance is out of sync for Tenant ${tenantId}. Delta: ${totalDebits.minus(totalCredits).toFixed(4)}`);
    }

    return report;
  }

  /**
   * LIABILITY REPORT
   * Specifically aggregates accounts that represent external obligations (TDS, PF, ESI).
   *
   * PERFORMANCE OPTIMIZATION (Bolt ⚡):
   * Uses batched grouped aggregation totals instead of executing 2 queries per liability account,
   * dropping total database round-trips from 1 + 2M to 3 queries.
   */
  async getLiabilityReport(): Promise<any> {
    const tenantId = TenantContext.getRequiredTenantId();
    const liabilities = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: { tenantId, type: LedgerAccountType.LIABILITY, isActive: true }
    });

    const { debitMap, creditMap } = await this.getAggregatedAccountTotals(tenantId);

    const report = [];
    for (const account of liabilities) {
        const debitTotal = debitMap.get(account.id) || '0.0000';
        const creditTotal = creditMap.get(account.id) || '0.0000';

        report.push({
            accountCode: account.code,
            accountName: account.name,
            totalObligation: new BigNumber(creditTotal).minus(debitTotal).toFixed(4) // Liability is Credit Normal
        });
    }

    return report;
  }

  /**
   * Fetches aggregated debit and credit sums grouped by account ID for the given tenant.
   * Employs TenantQueryPolicy.enforce to guarantee strict multi-tenant isolation.
   */
  private async getAggregatedAccountTotals(tenantId: string): Promise<{
    debitMap: Map<string, string>;
    creditMap: Map<string, string>;
  }> {
    const entryRepo = this.dataSource.getRepository(LedgerEntryEntity);

    // Group debits by debitAccountId
    const debitQb = entryRepo.createQueryBuilder('entry');
    TenantQueryPolicy.enforce(debitQb, tenantId, 'entry', 'ReportingService', 'getAggregatedAccountTotals:debits');
    const rawDebits: Array<{ accountId: string; total: string }> = await debitQb
      .select('entry.debitAccountId', 'accountId')
      .addSelect('SUM(entry.amount)', 'total')
      .groupBy('entry.debitAccountId')
      .getRawMany();

    // Group credits by creditAccountId
    const creditQb = entryRepo.createQueryBuilder('entry');
    TenantQueryPolicy.enforce(creditQb, tenantId, 'entry', 'ReportingService', 'getAggregatedAccountTotals:credits');
    const rawCredits: Array<{ accountId: string; total: string }> = await creditQb
      .select('entry.creditAccountId', 'accountId')
      .addSelect('SUM(entry.amount)', 'total')
      .groupBy('entry.creditAccountId')
      .getRawMany();

    const debitMap = new Map<string, string>();
    for (const row of rawDebits) {
      if (row.accountId) {
        debitMap.set(row.accountId, row.total ? new BigNumber(row.total).toFixed(4) : '0.0000');
      }
    }

    const creditMap = new Map<string, string>();
    for (const row of rawCredits) {
      if (row.accountId) {
        creditMap.set(row.accountId, row.total ? new BigNumber(row.total).toFixed(4) : '0.0000');
      }
    }

    return { debitMap, creditMap };
  }

  private calculateClosingBalance(type: LedgerAccountType, debit: string, credit: string): string {
    const d = new BigNumber(debit);
    const c = new BigNumber(credit);
    
    // Normal Balance Rules
    if (type === LedgerAccountType.ASSET || type === LedgerAccountType.EXPENSE) {
        return d.minus(c).toFixed(4);
    }
    return c.minus(d).toFixed(4);
  }
}
