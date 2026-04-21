import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
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
   */
  async getComplianceSummary(startDate: Date, endDate: Date): Promise<StatutoryAccountSummary[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    
    // Identify Liability Accounts
    const accounts = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: [
            { tenantId, code: 'LIAB-TDS' },
            { tenantId, code: 'LIAB-PF' },
            { tenantId, code: 'LIAB-ESI' }
        ]
    });

    const report: StatutoryAccountSummary[] = [];

    for (const account of accounts) {
        const openingBalance = await this.calculateOpeningBalance(account.id, startDate);
        
        // Additions are where this account was CREDITED (Increasing the Liability)
        const additions = await this.calculateActivity(account.id, startDate, endDate, 'CREDIT');
        
        // Payments are where this account was DEBITED (Decreasing the Liability via Payment)
        const payments = await this.calculateActivity(account.id, startDate, endDate, 'DEBIT');

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
            closingBalance
        });
    }

    return report;
  }

  private async calculateOpeningBalance(accountId: string, beforeDate: Date): Promise<string> {
    const tenantId = TenantContext.getRequiredTenantId();
    const query = this.dataSource
        .getRepository(LedgerEntryEntity)
        .createQueryBuilder('entry')
        .where('entry.tenantId = :tenantId', { tenantId })
        .andWhere('entry.createdAt < :beforeDate', { beforeDate });

    const creditRes = await query.clone().select('SUM(entry.amount)', 'total').andWhere('entry.creditAccountId = :accountId', { accountId }).getRawOne();
    const debitRes = await query.clone().select('SUM(entry.amount)', 'total').andWhere('entry.debitAccountId = :accountId', { accountId }).getRawOne();

    const c = new BigNumber(creditRes?.total || '0.0000');
    const d = new BigNumber(debitRes?.total || '0.0000');

    // Liability is Credit Normal
    return c.minus(d).toFixed(4);
  }

  private async calculateActivity(accountId: string, startDate: Date, endDate: Date, type: 'DEBIT' | 'CREDIT'): Promise<string> {
    const tenantId = TenantContext.getRequiredTenantId();
    const query = this.dataSource
        .getRepository(LedgerEntryEntity)
        .createQueryBuilder('entry')
        .where('entry.tenantId = :tenantId', { tenantId })
        .andWhere('entry.createdAt >= :startDate', { startDate })
        .andWhere('entry.createdAt <= :endDate', { endDate });

    const column = type === 'DEBIT' ? 'debitAccountId' : 'creditAccountId';
    const res = await query
        .select('SUM(entry.amount)', 'total')
        .andWhere(`entry.${column} = :accountId`, { accountId })
        .getRawOne();

    return res?.total || '0.0000';
  }
}
