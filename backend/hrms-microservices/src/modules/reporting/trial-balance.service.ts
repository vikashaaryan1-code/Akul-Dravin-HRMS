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
   *
   * OPTIMIZATION:
   * Previously executed 2 SQL queries per account in a loop (2N + 1 queries total).
   * Replaced with 2 database-level GROUP BY aggregation queries for debit and credit totals,
   * reducing database round-trips from 2N + 1 to 3 queries total regardless of account count.
   */
  async getReport(asOfDate?: Date): Promise<{ items: TrialBalanceRow[], totalDebit: string, totalCredit: string, isBalanced: boolean }> {
    const tenantId = TenantContext.getRequiredTenantId();
    const accounts = await this.dataSource.getRepository(LedgerAccountEntity).find({
        where: { tenantId }
    });

    if (!accounts.length) {
        return {
            items: [],
            totalDebit: '0.0000',
            totalCredit: '0.0000',
            isBalanced: true
        };
    }

    // Query 1: Grouped debit totals per account
    const debitQuery = this.dataSource
        .getRepository(LedgerEntryEntity)
        .createQueryBuilder('entry')
        .select('entry.debitAccountId', 'account_id')
        .addSelect('SUM(entry.amount)', 'total')
        .where('entry.tenantId = :tenantId', { tenantId });

    if (asOfDate) {
        debitQuery.andWhere('entry.createdAt <= :asOfDate', { asOfDate });
    }

    const debitRows = await debitQuery
        .groupBy('entry.debitAccountId')
        .getRawMany<{ account_id: string; accountid?: string; total: string }>();

    // Query 2: Grouped credit totals per account
    const creditQuery = this.dataSource
        .getRepository(LedgerEntryEntity)
        .createQueryBuilder('entry')
        .select('entry.creditAccountId', 'account_id')
        .addSelect('SUM(entry.amount)', 'total')
        .where('entry.tenantId = :tenantId', { tenantId });

    if (asOfDate) {
        creditQuery.andWhere('entry.createdAt <= :asOfDate', { asOfDate });
    }

    const creditRows = await creditQuery
        .groupBy('entry.creditAccountId')
        .getRawMany<{ account_id: string; accountid?: string; total: string }>();

    // Map aggregated totals by account ID
    const debitMap = new Map<string, string>();
    for (const row of debitRows) {
        const id = row.account_id || row.accountid;
        if (id) {
            debitMap.set(id, row.total || '0.0000');
        }
    }

    const creditMap = new Map<string, string>();
    for (const row of creditRows) {
        const id = row.account_id || row.accountid;
        if (id) {
            creditMap.set(id, row.total || '0.0000');
        }
    }

    const report: TrialBalanceRow[] = [];
    let grandTotalDebit = new BigNumber(0);
    let grandTotalCredit = new BigNumber(0);

    for (const account of accounts) {
        const debitTotal = debitMap.get(account.id) || '0.0000';
        const creditTotal = creditMap.get(account.id) || '0.0000';
        const closing = this.calculateClosingBalance(account.type, debitTotal, creditTotal);
        
        report.push({
            account_code: account.code,
            account_name: account.name,
            type: account.type,
            total_debit: debitTotal,
            total_credit: creditTotal,
            closing_balance: closing
        });

        grandTotalDebit = grandTotalDebit.plus(debitTotal);
        grandTotalCredit = grandTotalCredit.plus(creditTotal);
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
