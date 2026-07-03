'use client';

import { useMemo } from 'react';
import { CircleDollarSign, FileSpreadsheet, ReceiptText, WalletCards } from 'lucide-react';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import {
 financeExpenseRecords,
 financeInvoiceRecords,
 financeSummary,
} from '@/services/platform-data';
import type {
 FinanceExpenseApiRecord,
 FinanceInvoiceApiRecord,
 FinanceSummaryApiRecord,
 SalesSummaryApiRecord,
} from '@/services/api/platform-api';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const invoiceTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = status.toLowerCase();

 if (normalized.includes('paid')) return 'success';
 if (normalized.includes('pending')) return 'warning';
 if (normalized.includes('overdue')) return 'danger';
 return 'default';
};

const expenseTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = status.toLowerCase();

 if (normalized.includes('approve')) return 'success';
 if (normalized.includes('submit')) return 'warning';
 if (normalized.includes('reject')) return 'danger';
 return 'default';
};

type FinanceModulePayload = {
 invoices: FinanceInvoiceApiRecord[];
 expenses: FinanceExpenseApiRecord[];
 summary: FinanceSummaryApiRecord;
 salesSummary: SalesSummaryApiRecord | null;
};

export function FinanceModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);

 const { data, isLive, loading, error } = useApiResource<FinanceModulePayload>({
 loader: async () => {
 const [invoices, expenses, summary] = await Promise.all([
 platformApi.getFinanceInvoices(),
 platformApi.getFinanceExpenses(),
 platformApi.getFinanceSummary(),
 ]);

 let salesSummary: SalesSummaryApiRecord | null = null;
 try {
 salesSummary = await platformApi.getSalesSummary();
 } catch {
 salesSummary = null;
 }

 return {
 invoices,
 expenses,
 summary,
 salesSummary,
 };
 },
 fallback: {
 invoices: financeInvoiceRecords,
 expenses: financeExpenseRecords,
 summary: financeSummary,
 salesSummary: null,
 },
 });

 const invoices = data.invoices as FinanceInvoiceApiRecord[];
 const expenses = data.expenses as FinanceExpenseApiRecord[];

 const summaryCards = useMemo(() => {
 const paidRevenue = invoices
 .filter((invoice) => invoice.status.toLowerCase().includes('paid'))
 .reduce((sum, invoice) => sum + invoice.amount, 0);

 const outstanding = invoices
 .filter((invoice) => !invoice.status.toLowerCase().includes('paid'))
 .reduce((sum, invoice) => sum + invoice.amount, 0);

 const approvedExpenses = expenses
 .filter((expense) => expense.status.toLowerCase().includes('approve'))
 .reduce((sum, expense) => sum + expense.amount, 0);

 return {
 paidRevenue,
 outstanding,
 approvedExpenses,
 margin: data.summary.operatingMarginPercent,
 };
 }, [data.summary.operatingMarginPercent, expenses, invoices]);

 const invoiceStatusMix = useMemo(() => {
 const grouped = new Map<string, number>();

 invoices.forEach((invoice) => {
 grouped.set(invoice.status, (grouped.get(invoice.status) ?? 0) + 1);
 });

 return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
 }, [invoices]);

 const budgetAllocation = useMemo(
 () => [
 { name: 'Revenue', value: data.summary.totalRevenue },
 { name: 'Expenses', value: data.summary.totalExpenses },
 { name: 'Receivables', value: data.summary.receivables },
 { name: 'GST Payable', value: data.summary.gstPayable },
 ],
 [data.summary.gstPayable, data.summary.receivables, data.summary.totalExpenses, data.summary.totalRevenue],
 );

 const cashflowTrend = useMemo(() => {
 const monthMap = new Map<string, number>();

 invoices.forEach((invoice) => {
 const monthKey = new Date(invoice.dueDate).toLocaleString('en-US', { month: 'short' });
 monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + invoice.amount);
 });

 expenses.forEach((expense) => {
 const monthKey = new Date(expense.expenseDate).toLocaleString('en-US', { month: 'short' });
 monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) - expense.amount);
 });

 const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

 return Array.from(monthMap.entries())
 .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
 .map(([name, value]) => ({ name, value }));
 }, [expenses, invoices]);

 const salesPipelineValue = data.salesSummary?.totalDealValue ?? 0;

 return (
 <div className="space-y-5">
 <PageTitle
 title="Finance & Accounting"
 description="Track invoices, expenses, tax obligations, and margin intelligence with cross-module business visibility."
 />

 <ModuleLinksBar
 links={[
 { label: 'Sales', href: `/sales?role=${activeRole}` },
 { label: 'Payroll', href: `/payroll?role=${activeRole}` },
 { label: 'Marketing', href: `/marketing?role=${activeRole}` },
 { label: 'Analytics', href: `/analytics?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Collected Revenue</p>
 <CircleDollarSign size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatCurrency(summaryCards.paidRevenue)}</p>
 <p className="mt-1 text-xs text-slate-500">Paid invoices reconciled this cycle</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Outstanding Receivables</p>
 <WalletCards size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatCurrency(summaryCards.outstanding)}</p>
 <p className="mt-1 text-xs text-slate-500">Pending + overdue collections</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Approved Expenses</p>
 <ReceiptText size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatCurrency(summaryCards.approvedExpenses)}</p>
 <p className="mt-1 text-xs text-slate-500">Expense controls aligned with policy</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Operating Margin</p>
 <FileSpreadsheet size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatPercent(summaryCards.margin)}</p>
 <p className="mt-1 text-xs text-slate-500">Auto-derived from revenue and expense ledgers</p>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
 <DonutChartCard title="Financial Allocation" data={budgetAllocation} />
 <StackedBarChart title="Invoice Status Mix" data={invoiceStatusMix} mode="single" />
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
 <TrendAreaChart title="Cashflow Trend" data={cashflowTrend} color="#E85A2A" />
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Cross-Module Finance Signals</p>
 <p className="text-sm text-slate-600 ">
 Sales pipeline and finance collections stay connected for better forecasting and payout readiness.
 </p>
 <div className="space-y-2 text-sm text-slate-600 ">
 <p>Sales pipeline value: {formatCurrency(salesPipelineValue)}</p>
 <p>Receivables tracked in weekly forecast board.</p>
 <p>GST obligations included in monthly closing checklist.</p>
 </div>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Invoice Ledger</p>
 <SimpleTable
 rows={invoices}
 columns={[
 { key: 'invoiceNumber', label: 'Invoice' },
 { key: 'customerName', label: 'Customer' },
 {
 key: 'amount',
 label: 'Amount',
 render: (invoice) => formatCurrency(invoice.amount),
 },
 {
 key: 'status',
 label: 'Status',
 render: (invoice) => <StatusPill label={invoice.status} tone={invoiceTone(invoice.status)} />,
 },
 { key: 'dueDate', label: 'Due Date' },
 ]}
 />
 </GlassCard>

 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Expense Ledger</p>
 <SimpleTable
 rows={expenses}
 columns={[
 { key: 'category', label: 'Category' },
 {
 key: 'amount',
 label: 'Amount',
 render: (expense) => formatCurrency(expense.amount),
 },
 { key: 'ownerName', label: 'Owner' },
 {
 key: 'status',
 label: 'Status',
 render: (expense) => <StatusPill label={expense.status} tone={expenseTone(expense.status)} />,
 },
 { key: 'expenseDate', label: 'Expense Date' },
 ]}
 />
 </GlassCard>
 </section>
 </div>
 );
}
