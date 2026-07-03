'use client';

import { useMemo, useState } from 'react';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useApiResource } from '@/hooks/useApiResource';
import {
 platformApi,
 type BillingInvoiceApiRecord,
 type BillingSubscriptionApiRecord,
 type FinanceSummaryApiRecord,
} from '@/services/api/platform-api';

type BillingModuleViewProps = {
 focus: 'subscriptions' | 'payments';
};

type BillingPayload = {
 subscriptions: BillingSubscriptionApiRecord[];
 invoices: BillingInvoiceApiRecord[];
 financeSummary: FinanceSummaryApiRecord;
};

const fallbackData: BillingPayload = {
 subscriptions: [
 {
 id: 'fallback-sub-1',
 tenantId: null,
 companyId: 'COMPANY-ALPHA',
 planName: 'Enterprise Growth',
 billingCycle: 'monthly',
 price: '2999.00',
 features: { seats: 120, modules: ['payments', 'finance', 'analytics'] },
 startDate: '2026-04-01',
 endDate: '2026-04-30',
 status: 'active',
 createdAt: '2026-04-01T09:00:00.000Z',
 updatedAt: '2026-04-01T09:00:00.000Z',
 },
 {
 id: 'fallback-sub-2',
 tenantId: null,
 companyId: 'COMPANY-BETA',
 planName: 'Recruitment Pro',
 billingCycle: 'annual',
 price: '18000.00',
 features: { seats: 60, modules: ['recruitment', 'marketplace'] },
 startDate: '2026-01-15',
 endDate: '2027-01-14',
 status: 'active',
 createdAt: '2026-01-15T11:00:00.000Z',
 updatedAt: '2026-01-15T11:00:00.000Z',
 },
 ],
 invoices: [
 {
 id: 'fallback-invoice-1',
 tenantId: null,
 subscriptionId: 'fallback-sub-1',
 invoiceNumber: 'AD-2026-0412',
 amount: '2999.00',
 currency: 'INR',
 dueDate: '2026-04-18',
 status: 'pending',
 createdAt: '2026-04-12T08:30:00.000Z',
 updatedAt: '2026-04-12T08:30:00.000Z',
 },
 {
 id: 'fallback-invoice-2',
 tenantId: null,
 subscriptionId: 'fallback-sub-2',
 invoiceNumber: 'AD-2026-0301',
 amount: '18000.00',
 currency: 'INR',
 dueDate: '2026-03-05',
 status: 'paid',
 createdAt: '2026-03-01T10:00:00.000Z',
 updatedAt: '2026-03-03T16:15:00.000Z',
 },
 ],
 financeSummary: {
 totalRevenue: 184000,
 totalExpenses: 138000,
 receivables: 408000,
 gstPayable: 33120,
 operatingMarginPercent: 25,
 },
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
 style: 'currency',
 currency: 'INR',
 maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string) => currencyFormatter.format(Number(value) || 0);
const formatDate = (value: string) =>
 new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));

const statusTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = status.toLowerCase();

 if (normalized.includes('paid') || normalized.includes('active')) {
 return 'success';
 }

 if (normalized.includes('overdue') || normalized.includes('failed') || normalized.includes('cancel')) {
 return 'danger';
 }

 if (normalized.includes('pending') || normalized.includes('due') || normalized.includes('trial')) {
 return 'warning';
 }

 return 'default';
};

export function BillingModuleView({ focus }: BillingModuleViewProps) {
 const [actionState, setActionState] = useState<'subscription' | 'invoice' | 'settle' | null>(null);
 const [message, setMessage] = useState<string | null>(null);

 const { data, isLive, loading, error, refresh } = useApiResource<BillingPayload>({
 loader: async () => {
 const [subscriptions, invoices, financeSummary] = await Promise.all([
 platformApi.getBillingSubscriptions(),
 platformApi.getBillingInvoices(),
 platformApi.getFinanceSummary(),
 ]);

 return {
 subscriptions,
 invoices,
 financeSummary,
 };
 },
 fallback: fallbackData,
 });

 const summary = useMemo(() => {
 const activeSubscriptions = data.subscriptions.filter((item) => item.status.toLowerCase().includes('active'));
 const recurringRevenue = activeSubscriptions.reduce((sum, item) => sum + Number(item.price), 0);
 const collected = data.invoices
 .filter((item) => item.status.toLowerCase().includes('paid'))
 .reduce((sum, item) => sum + Number(item.amount), 0);
 const receivables = data.invoices
 .filter((item) => !item.status.toLowerCase().includes('paid'))
 .reduce((sum, item) => sum + Number(item.amount), 0);

 return {
 activeSubscriptions: activeSubscriptions.length,
 recurringRevenue,
 collected,
 receivables,
 };
 }, [data.invoices, data.subscriptions]);

 const title = focus === 'payments' ? 'Payments & Collections Desk' : 'Subscription Lifecycle Desk';
 const description = focus === 'payments'
 ? 'Track collections, issue invoices, and settle receivables against live protected billing APIs.'
 : 'Manage plan renewals, contract status, and invoice generation from the live subscription service.';

 const createSubscription = async () => {
 setActionState('subscription');
 setMessage(null);

 try {
 await platformApi.createBillingSubscription({
 companyId: `COMPANY-${Date.now().toString().slice(-4)}`,
 planName: focus === 'payments' ? 'Collections Control' : 'Growth Suite',
 billingCycle: 'monthly',
 price: 3499,
 features: {
 seats: 75,
 modules: ['payments', 'subscriptions', 'finance'],
 },
 startDate: new Date().toISOString().slice(0, 10),
 endDate: null,
 status: 'active',
 });
 await refresh();
 setMessage('Demo subscription created successfully.');
 } catch (caught) {
 setMessage(caught instanceof Error ? caught.message : 'Unable to create subscription.');
 } finally {
 setActionState(null);
 }
 };

 const createInvoice = async () => {
 setActionState('invoice');
 setMessage(null);

 try {
 let subscriptionId = data.subscriptions[0]?.id;

 if (!subscriptionId) {
 const created = await platformApi.createBillingSubscription({
 companyId: `COMPANY-${Date.now().toString().slice(-4)}`,
 planName: 'Starter Platform',
 billingCycle: 'monthly',
 price: 2499,
 status: 'active',
 startDate: new Date().toISOString().slice(0, 10),
 });
 subscriptionId = created.id;
 }

 await platformApi.createBillingInvoice({
 subscriptionId,
 amount: 2499,
 currency: 'INR',
 dueDate: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)).toISOString().slice(0, 10),
 status: 'pending',
 });
 await refresh();
 setMessage('Invoice generated and added to the payment queue.');
 } catch (caught) {
 setMessage(caught instanceof Error ? caught.message : 'Unable to generate invoice.');
 } finally {
 setActionState(null);
 }
 };

 const settleInvoice = async () => {
 const openInvoice = data.invoices.find((item) => !item.status.toLowerCase().includes('paid'));
 if (!openInvoice) {
 setMessage('No pending invoice is waiting for collection.');
 return;
 }

 setActionState('settle');
 setMessage(null);

 try {
 await platformApi.updateBillingInvoice(openInvoice.id, {
 status: 'paid',
 });
 await refresh();
 setMessage(`Invoice ${openInvoice.invoiceNumber} marked as paid.`);
 } catch (caught) {
 setMessage(caught instanceof Error ? caught.message : 'Unable to settle invoice.');
 } finally {
 setActionState(null);
 }
 };

 return (
 <div className="space-y-5">
 <PageTitle
 title={title}
 description={description}
 actions={
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => void createSubscription()}
 disabled={actionState !== null}
 className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
 >
 {actionState === 'subscription' ? 'Creating...' : 'Add Subscription'}
 </button>
 <button
 type="button"
 onClick={() => void createInvoice()}
 disabled={actionState !== null}
 className="rounded-md bg-aqua px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
 >
 {actionState === 'invoice' ? 'Generating...' : 'Generate Invoice'}
 </button>
 <button
 type="button"
 onClick={() => void settleInvoice()}
 disabled={actionState !== null}
 className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 "
 >
 {actionState === 'settle' ? 'Settling...' : 'Mark Pending Paid'}
 </button>
 </div>
 }
 />

 <ModuleLinksBar
 links={[
 { label: 'Subscriptions', href: '/subscriptions' },
 { label: 'Payments', href: '/payments' },
 { label: 'Finance', href: '/finance' },
 { label: 'Dashboard', href: '/dashboard' },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 {message ? (
 <p className="rounded-lg border border-aqua/30 bg-aqua/10 px-4 py-3 text-sm text-aqua ">
 {message}
 </p>
 ) : null}

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Active Subscriptions</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{summary.activeSubscriptions}</p>
 <p className="mt-1 text-xs text-slate-500">Live plans currently billing</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Recurring Bookings</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{formatCurrency(summary.recurringRevenue)}</p>
 <p className="mt-1 text-xs text-slate-500">Active plan value on the books</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Collected</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{formatCurrency(summary.collected)}</p>
 <p className="mt-1 text-xs text-slate-500">Invoices already settled</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Receivables</p>
 <p className="mt-2 text-2xl font-semibold text-slate-900 ">{formatCurrency(summary.receivables)}</p>
 <p className="mt-1 text-xs text-slate-500">Open payment exposure</p>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 ">Billing Health</p>
 <div className="mt-4 grid gap-3 sm:grid-cols-2">
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Revenue</p>
 <p className="mt-2 text-xl font-semibold text-slate-900 ">{formatCurrency(data.financeSummary.totalRevenue)}</p>
 </div>
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Expenses</p>
 <p className="mt-2 text-xl font-semibold text-slate-900 ">{formatCurrency(data.financeSummary.totalExpenses)}</p>
 </div>
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">GST Payable</p>
 <p className="mt-2 text-xl font-semibold text-slate-900 ">{formatCurrency(data.financeSummary.gstPayable)}</p>
 </div>
 <div className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Operating Margin</p>
 <p className="mt-2 text-xl font-semibold text-slate-900 ">{data.financeSummary.operatingMarginPercent.toFixed(1)}%</p>
 </div>
 </div>
 </GlassCard>

 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 ">Collection Notes</p>
 <ul className="mt-4 space-y-2 text-sm text-slate-600 ">
 <li className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 Protected billing routes accept the JWT from login and unlock invoice actions for admin roles.
 </li>
 <li className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 Generate invoice creates a live billing record, and Mark Pending Paid updates the same record in place.
 </li>
 <li className="rounded-lg border border-slate-200/80 bg-white/70 px-4 py-3 ">
 Finance summary stays in sync so collections and operating visibility live in one workspace.
 </li>
 </ul>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-2">
 <GlassCard>
 <p className="mb-3 text-sm font-semibold text-slate-800 ">Subscriptions</p>
 <SimpleTable
 rows={data.subscriptions}
 columns={[
 { key: 'planName', label: 'Plan' },
 { key: 'billingCycle', label: 'Cycle' },
 { key: 'price', label: 'Price', render: (row) => formatCurrency(row.price) },
 {
 key: 'status',
 label: 'Status',
 render: (row) => <StatusPill label={row.status} tone={statusTone(row.status)} />,
 },
 {
 key: 'startDate',
 label: 'Start',
 render: (row) => formatDate(row.startDate),
 },
 ]}
 />
 </GlassCard>

 <GlassCard>
 <p className="mb-3 text-sm font-semibold text-slate-800 ">Invoices</p>
 <SimpleTable
 rows={data.invoices}
 columns={[
 { key: 'invoiceNumber', label: 'Invoice' },
 { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
 {
 key: 'dueDate',
 label: 'Due',
 render: (row) => formatDate(row.dueDate),
 },
 {
 key: 'status',
 label: 'Status',
 render: (row) => <StatusPill label={row.status} tone={statusTone(row.status)} />,
 },
 { key: 'currency', label: 'Currency' },
 ]}
 />
 </GlassCard>
 </section>
 </div>
 );
}
