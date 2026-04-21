import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { TenantContext } from '../../common/context/tenant-context';
import BigNumber from 'bignumber.js';

export interface LedgerDrillDownRow {
    date: Date;
    description: string;
    transactionId: string;
    debit: string;
    credit: string;
    runningBalance: string;
    reference?: string;
}

@Injectable()
export class LedgerReportService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * GENERAL LEDGER (DRILL-DOWN)
   * Strictly derived from Ledger entries ONLY.
   * Implements a deterministic running balance algorithm.
   */
  async getAccountJournal(accountCode: string, startDate: Date, endDate: Date): Promise<LedgerDrillDownRow[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const account = await this.dataSource.getRepository(LedgerAccountEntity).findOne({
        where: { tenantId, code: accountCode }
    });

    if (!account) throw new Error(`Account ${accountCode} not found`);

    // 1. Calculate Opening Balance @ StartDate
    const openingBalance = await this.calculateOpeningBalance(account.id, startDate);
    
    // 2. Stream chronological entries
    const entries = await this.dataSource
        .getRepository(LedgerEntryEntity)
        .find({
            where: [
                { tenantId, debitAccountId: account.id },
                { tenantId, creditAccountId: account.id }
            ],
            relations: ['transaction'],
            order: { createdAt: 'ASC' }
        });

    // Filter by date (since TypeORM where array and date range is tricky in a single find)
    const filteredEntries = entries.filter(e => e.createdAt >= startDate && e.createdAt <= endDate);

    const result: LedgerDrillDownRow[] = [];
    let currentBalance = new BigNumber(openingBalance);

    for (const entry of filteredEntries) {
        const isDebit = entry.debitAccountId === account.id;
        const debit = isDebit ? entry.amount : '0.0000';
        const credit = !isDebit ? entry.amount : '0.0000';

        // Update Running Balance
        if (account.type === LedgerAccountType.ASSET || account.type === LedgerAccountType.EXPENSE) {
            currentBalance = currentBalance.plus(debit).minus(credit);
        } else {
            currentBalance = currentBalance.plus(credit).minus(debit);
        }

        result.push({
            date: entry.createdAt,
            description: entry.description || '',
            transactionId: entry.transactionId,
            debit,
            credit,
            runningBalance: currentBalance.toFixed(4),
            reference: entry.transaction?.reference
        });
    }

    return result;
  }

  private async calculateOpeningBalance(accountId: string, beforeDate: Date): Promise<string> {
    const tenantId = TenantContext.getRequiredTenantId();
    const account = await this.dataSource.getRepository(LedgerAccountEntity).findOne({ where: { id: accountId } });
    
    // Sum all entries before beforeDate
    const query = this.dataSource
        .getRepository(LedgerEntryEntity)
        .createQueryBuilder('entry')
        .where('entry.tenantId = :tenantId', { tenantId })
        .andWhere('entry.createdAt < :beforeDate', { beforeDate });

    const debitRes = await query.clone().select('SUM(entry.amount)', 'total').andWhere('entry.debitAccountId = :accountId', { accountId }).getRawOne();
    const creditRes = await query.clone().select('SUM(entry.amount)', 'total').andWhere('entry.creditAccountId = :accountId', { accountId }).getRawOne();

    const d = new BigNumber(debitRes?.total || '0.0000');
    const c = new BigNumber(creditRes?.total || '0.0000');

    if (account?.type === LedgerAccountType.ASSET || account?.type === LedgerAccountType.EXPENSE) {
        return d.minus(c).toFixed(4);
    }
    return c.minus(d).toFixed(4);
  }
}
