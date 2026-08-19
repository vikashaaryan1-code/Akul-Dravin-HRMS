import { Injectable } from '@nestjs/common';
import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { TransactionEntity } from '../../database/entities/transaction.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';

export interface FinanceSummaryRecord {
  totalRevenue: number;
  totalExpenses: number;
  receivables: number;
  gstPayable: number;
  operatingMarginPercent: number;
}

@Injectable()
export class FinanceService {
  constructor() {}

  private get invoiceRepository() {
    return TenantContext.getRepository(InvoiceEntity);
  }

  private get transactionRepository() {
    return TenantContext.getRepository(TransactionEntity);
  }

  async getInvoices(): Promise<InvoiceEntity[]> {
    return this.invoiceRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createInvoice(payload: Partial<InvoiceEntity>): Promise<InvoiceEntity> {
    const invoice = this.invoiceRepository.create(payload);
    return this.invoiceRepository.save(invoice);
  }

  async updateInvoiceStatus(id: string, status: string): Promise<InvoiceEntity | null> {
    await this.invoiceRepository.update(id, { status });
    return this.invoiceRepository.findOne({ where: { id } });
  }

  async getSummary(): Promise<FinanceSummaryRecord> {
    const tenantId = TenantContext.getRequiredTenantId();

    // ⚡ Bolt: Aggregate invoice revenue and receivables at database level via QueryBuilder
    const invoiceQb = this.invoiceRepository.createQueryBuilder('invoice');
    TenantQueryPolicy.enforce(invoiceQb, tenantId, 'invoice', 'FinanceService', 'getSummary-invoices');
    const invoiceRes = await invoiceQb
      .select(
        "SUM(CASE WHEN LOWER(invoice.status) LIKE '%paid%' THEN CAST(invoice.amount AS numeric) ELSE 0 END)",
        'totalRevenue',
      )
      .addSelect(
        "SUM(CASE WHEN LOWER(invoice.status) NOT LIKE '%paid%' THEN CAST(invoice.amount AS numeric) ELSE 0 END)",
        'receivables',
      )
      .getRawOne();

    const totalRevenue = parseFloat(invoiceRes?.totalRevenue) || 0;
    const receivables = parseFloat(invoiceRes?.receivables) || 0;

    // ⚡ Bolt: Aggregate expense DEBIT transactions directly at database level
    const txQb = this.transactionRepository.createQueryBuilder('tx');
    TenantQueryPolicy.enforce(txQb, tenantId, 'tx', 'FinanceService', 'getSummary-transactions');
    const txRes = await txQb
      .select('SUM(CAST(tx.amount AS numeric))', 'totalExpenses')
      .andWhere('tx.type = :type', { type: 'DEBIT' })
      .getRawOne();

    const totalExpenses = parseFloat(txRes?.totalExpenses) || 0;

    const gstPayable = Math.round(totalRevenue * 0.18);

    const operatingMarginPercent =
      totalRevenue > 0
        ? Number((((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1))
        : 0;

    return {
      totalRevenue,
      totalExpenses,
      receivables,
      gstPayable,
      operatingMarginPercent,
    };
  }

  async getExpenses(): Promise<TransactionEntity[]> {
    return this.transactionRepository.find({
      where: { type: 'DEBIT' },
      order: { createdAt: 'DESC' }
    });
  }

  async createExpense(payload: Partial<TransactionEntity>) {
    const tx = this.transactionRepository.create({
      ...payload,
      type: 'DEBIT'
    });
    return this.transactionRepository.save(tx);
  }
}

