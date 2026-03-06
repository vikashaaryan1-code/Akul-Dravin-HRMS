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

@Injectable()
export class FinanceService {
  private readonly invoices: FinanceInvoiceRecord[] = [
    {
      id: 'FIN-INV-1',
      invoiceNumber: 'INV-2026-1102',
      customerName: 'CloudWorks Asia',
      amount: 184000,
      status: 'Paid',
      dueDate: '2026-03-10',
    },
    {
      id: 'FIN-INV-2',
      invoiceNumber: 'INV-2026-1107',
      customerName: 'NorthGrid Energy',
      amount: 246000,
      status: 'Pending',
      dueDate: '2026-03-14',
    },
    {
      id: 'FIN-INV-3',
      invoiceNumber: 'INV-2026-1111',
      customerName: 'Aster Logistics',
      amount: 162000,
      status: 'Overdue',
      dueDate: '2026-03-02',
    },
  ];

  private readonly expenses: FinanceExpenseRecord[] = [
    {
      id: 'FIN-EXP-1',
      category: 'Cloud Infrastructure',
      amount: 96000,
      ownerName: 'Finance Ops',
      status: 'Approved',
      expenseDate: '2026-03-03',
    },
    {
      id: 'FIN-EXP-2',
      category: 'Performance Marketing',
      amount: 42000,
      ownerName: 'Marketing Team',
      status: 'Approved',
      expenseDate: '2026-03-04',
    },
    {
      id: 'FIN-EXP-3',
      category: 'Recruitment Events',
      amount: 18000,
      ownerName: 'Talent Team',
      status: 'Submitted',
      expenseDate: '2026-03-05',
    },
  ];

  private readonly summary: FinanceSummaryRecord = {
    totalRevenue: 1294000,
    totalExpenses: 546000,
    receivables: 408000,
    gstPayable: 116000,
    operatingMarginPercent: 57.8,
  };

  getInvoices(): FinanceInvoiceRecord[] {
    return this.invoices;
  }

  getExpenses(): FinanceExpenseRecord[] {
    return this.expenses;
  }

  getSummary(): FinanceSummaryRecord {
    return this.summary;
  }
}
