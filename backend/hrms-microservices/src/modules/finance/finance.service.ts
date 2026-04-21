import { Injectable } from '@nestjs/common';

type FinanceInvoiceRecord = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  dueDate: string;
};

type FinanceExpenseRecord = {
  id: string;
  category: string;
  amount: number;
  ownerName: string;
  status: string;
  expenseDate: string;
};

type FinanceSummaryRecord = {
  totalRevenue: number;
  totalExpenses: number;
  receivables: number;
  gstPayable: number;
  operatingMarginPercent: number;
};

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from '../../database/entities/invoice.entity';
import { TransactionEntity } from '../../database/entities/transaction.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

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
    const invoices = await this.invoiceRepository.find();
    
    // Revenue from Invoices
    const totalRevenue = invoices
      .filter((invoice) => invoice.status.toLowerCase().includes('paid'))
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    
    const receivables = invoices
      .filter((invoice) => !invoice.status.toLowerCase().includes('paid'))
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    
    // Expenses from Transactions
    const expenseRecords = await this.transactionRepository.find({
      where: { type: 'DEBIT' }
    });
    const totalExpenses = expenseRecords.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    const gstPayable = Math.round(totalRevenue * 0.18);
    
    const operatingMarginPercent = totalRevenue > 0
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

