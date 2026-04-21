import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { TenantContext } from '../../common/context/tenant-context';
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
   */
  async getTrialBalance(): Promise<TrialBalanceReport> {
    const tenantId = TenantContext.getRequiredTenantId();
    const accounts = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: { tenantId, isActive: true }
    });

    const reportItems: TrialBalanceItem[] = [];
    let totalDebits = new BigNumber(0);
    let totalCredits = new BigNumber(0);

    for (const account of accounts) {
        const item = await this.calculateAccountTotals(account.id);
        reportItems.push({
            accountCode: account.code,
            accountName: account.name,
            type: account.type,
            debitTotal: item.debitTotal,
            creditTotal: item.creditTotal,
            closingBalance: this.calculateClosingBalance(account.type, item.debitTotal, item.creditTotal)
        });

        totalDebits = totalDebits.plus(item.debitTotal);
        totalCredits = totalCredits.plus(item.creditTotal);
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
   */
  async getLiabilityReport(): Promise<any> {
    const tenantId = TenantContext.getRequiredTenantId();
    const liabilities = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: { tenantId, type: LedgerAccountType.LIABILITY, isActive: true }
    });

    const report = [];
    for (const account of liabilities) {
        const totals = await this.calculateAccountTotals(account.id);
        report.push({
            accountCode: account.code,
            accountName: account.name,
            totalObligation: new BigNumber(totals.creditTotal).minus(totals.debitTotal).toFixed(4) // Liability is Credit Normal
        });
    }

    return report;
  }

  private async calculateAccountTotals(accountId: string): Promise<{ debitTotal: string, creditTotal: string }> {
    const entryRepo = this.dataSource.getRepository(LedgerEntryEntity);
    
    // Calculate total debits to this account
    const debitRes = await entryRepo
        .createQueryBuilder('entry')
        .select('SUM(entry.amount)', 'total')
        .where('entry.debitAccountId = :accountId', { accountId })
        .getRawOne();

    // Calculate total credits to this account
    const creditRes = await entryRepo
        .createQueryBuilder('entry')
        .select('SUM(entry.amount)', 'total')
        .where('entry.creditAccountId = :accountId', { accountId })
        .getRawOne();

    return {
        debitTotal: debitRes?.total || '0.0000',
        creditTotal: creditRes?.total || '0.0000'
    };
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
