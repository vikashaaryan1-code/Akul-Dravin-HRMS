import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';

export interface TrialBalanceRow {
    account_code: string;
    account_name: string;
    type: LedgerAccountType;
    total_debit: string;
    total_credit: string;
    closing_balance: string;
}

@Injectable()
export class TrialBalanceService {
  private readonly logger = new Logger(TrialBalanceService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * THE CHECKSUM: TRIAL BALANCE
   * Strictly derived from Ledger entries ONLY.
   */
  async getReport(asOfDate?: Date): Promise<{ items: TrialBalanceRow[], totalDebit: string, totalCredit: string, isBalanced: boolean }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const accounts = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: { tenantId }
    });

    const report: TrialBalanceRow[] = [];
    let grandTotalDebit = new BigNumber(0);
    let grandTotalCredit = new BigNumber(0);

    for (const account of accounts) {
        const totals = await this.getAccountTotals(account.id, asOfDate);
        const closing = this.calculateClosingBalance(account.type, totals.debit, totals.credit);
        
        report.push({
            account_code: account.code,
            account_name: account.name,
            type: account.type,
            total_debit: totals.debit,
            total_credit: totals.credit,
            closing_balance: closing
        });

        grandTotalDebit = grandTotalDebit.plus(totals.debit);
        grandTotalCredit = grandTotalCredit.plus(totals.credit);
    }

    const isBalanced = grandTotalDebit.isEqualTo(grandTotalCredit);
    if (!isBalanced) {
        this.logger.error(`TRIAL BALANCE ANOMALY DETECTED for tenant ${tenantId}. Delta: ${grandTotalDebit.minus(grandTotalCredit).toFixed(4)}`);
    }

    return {
        items: report,
        totalDebit: grandTotalDebit.toFixed(4),
        totalCredit: grandTotalCredit.toFixed(4),
        isBalanced
    };
  }

  private async getAccountTotals(accountId: string, asOfDate?: Date): Promise<{ debit: string, credit: string }> {
    const query = this.dataSource
        .getRepository(LedgerEntryEntity)
        .createQueryBuilder('entry')
        .where('entry.tenantId = :tenantId', { tenantId: TenantContext.getRequiredTenantId() });

    if (asOfDate) {
        query.andWhere('entry.createdAt <= :asOfDate', { asOfDate });
    }

    // THE USER'S CORE LOGIC
    const debitRes = await query
        .clone()
        .select('SUM(entry.amount)', 'total')
        .andWhere('entry.debitAccountId = :accountId', { accountId })
        .getRawOne();

    const creditRes = await query
        .clone()
        .select('SUM(entry.amount)', 'total')
        .andWhere('entry.creditAccountId = :accountId', { accountId })
        .getRawOne();

    return {
        debit: debitRes?.total || '0.0000',
        credit: creditRes?.total || '0.0000'
    };
  }

  private calculateClosingBalance(type: LedgerAccountType, debit: string, credit: string): string {
    const d = new BigNumber(debit);
    const c = new BigNumber(credit);
    
    // Debit-Normal: Assets, Expenses
    if (type === LedgerAccountType.ASSET || type === LedgerAccountType.EXPENSE) {
        return d.minus(c).toFixed(4);
    }
    // Credit-Normal: Liabilities, Equity, Revenue
    return c.minus(d).toFixed(4);
  }
}
