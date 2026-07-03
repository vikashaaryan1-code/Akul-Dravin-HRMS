'use client';

import { useMemo } from 'react';
import { Building2, ClipboardCheck, IndianRupee, TrendingDown } from 'lucide-react';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import {
 procurementOrderRecords,
 procurementSummary,
 procurementVendorRecords,
} from '@/services/platform-data';
import type {
 FinanceSummaryApiRecord,
 ProcurementOrderApiRecord,
 ProcurementSummaryApiRecord,
 ProcurementVendorApiRecord,
} from '@/services/api/platform-api';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { canPerformAction } from '@/utils/action-permissions';
import { formatCurrency } from '@/utils/formatters';

const vendorTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = status.toLowerCase();

 if (normalized.includes('active')) return 'success';
 if (normalized.includes('review')) return 'warning';
 if (normalized.includes('blocked')) return 'danger';
 return 'default';
};

const orderTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = status.toLowerCase();

 if (normalized.includes('approved')) return 'success';
 if (normalized.includes('pending') || normalized.includes('raised')) return 'warning';
 if (normalized.includes('rejected')) return 'danger';
 return 'default';
};

type ProcurementPayload = {
 vendors: ProcurementVendorApiRecord[];
 orders: ProcurementOrderApiRecord[];
 summary: ProcurementSummaryApiRecord;
 financeSummary: FinanceSummaryApiRecord | null;
};

export function ProcurementModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);
 const canCreatePo = canPerformAction(activeRole, 'procurement.create-po');
 const canApprovePo = canPerformAction(activeRole, 'procurement.approve-po');

 const { data, isLive, loading, error } = useApiResource<ProcurementPayload>({
 loader: async () => {
 const [vendors, orders, summary] = await Promise.all([
 platformApi.getProcurementVendors(),
 platformApi.getProcurementOrders(),
 platformApi.getProcurementSummary(),
 ]);

 let financeSummary: FinanceSummaryApiRecord | null = null;
 try {
 financeSummary = await platformApi.getFinanceSummary();
 } catch {
 financeSummary = null;
 }

 return {
 vendors,
 orders,
 summary,
 financeSummary,
 };
 },
 fallback: {
 vendors: procurementVendorRecords,
 orders: procurementOrderRecords,
 summary: procurementSummary,
 financeSummary: null,
 },
 });

 const vendors = data.vendors as ProcurementVendorApiRecord[];
 const orders = data.orders as ProcurementOrderApiRecord[];

 const statusMix = useMemo(() => {
 const grouped = new Map<string, number>();

 vendors.forEach((vendor) => {
 grouped.set(vendor.status, (grouped.get(vendor.status) ?? 0) + 1);
 });

 return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
 }, [vendors]);

 const orderValues = useMemo(
 () =>
 orders.map((order) => ({
 name: order.poNumber.split('-').slice(-1)[0],
 value: order.amount,
 })),
 [orders],
 );

 const spendTrend = useMemo(() => {
 const financeExpense = data.financeSummary?.totalExpenses ?? data.summary.monthlySpend;

 return [
 { name: 'Forecast', value: data.summary.monthlySpend },
 { name: 'Actual', value: financeExpense },
 { name: 'Savings', value: data.summary.savingsRealized },
 ];
 }, [data.financeSummary?.totalExpenses, data.summary.monthlySpend, data.summary.savingsRealized]);

 return (
 <div className="space-y-5">
 <PageTitle
 title="Procurement & Vendor Management"
 description="Manage vendor performance, purchase order lifecycle, spend governance, and finance-aligned procurement outcomes."
 actions={
 <div className="flex flex-col items-start gap-2">
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 disabled={!canCreatePo}
 className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 "
 title={canCreatePo ? 'Create Purchase Order' : 'Your role cannot create purchase orders.'}
 >
 Create Purchase Order
 </button>
 <button
 type="button"
 disabled={!canApprovePo}
 className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45 "
 title={canApprovePo ? 'Approve Purchase Order' : 'Your role cannot approve purchase orders.'}
 >
 Approve Purchase Order
 </button>
 </div>
 {!canCreatePo || !canApprovePo ? (
 <p className="text-[11px] text-amber-700 ">Procurement actions are restricted by active role policy.</p>
 ) : null}
 </div>
 }
 />

 <ModuleLinksBar
 links={[
 { label: 'Finance', href: `/finance?role=${activeRole}` },
 { label: 'Marketing', href: `/marketing?role=${activeRole}` },
 { label: 'Recruitment', href: `/recruitment?role=${activeRole}` },
 { label: 'Analytics', href: `/analytics?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Active Vendors</p>
 <Building2 size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{data.summary.activeVendors}</p>
 <p className="mt-1 text-xs text-slate-500">Approved supplier base</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Open POs</p>
 <ClipboardCheck size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{data.summary.openPurchaseOrders}</p>
 <p className="mt-1 text-xs text-slate-500">Pending approval and fulfillment</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Monthly Spend</p>
 <IndianRupee size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatCurrency(data.summary.monthlySpend)}</p>
 <p className="mt-1 text-xs text-slate-500">Controlled by procurement workflows</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Savings Realized</p>
 <TrendingDown size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatCurrency(data.summary.savingsRealized)}</p>
 <p className="mt-1 text-xs text-slate-500">Negotiation + consolidation impact</p>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
 <DonutChartCard title="Vendor Status Mix" data={statusMix} />
 <StackedBarChart title="Purchase Order Value" data={orderValues} mode="single" />
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
 <TrendAreaChart title="Spend Forecast vs Actual" data={spendTrend} color="#1f6feb" />
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Spend Governance Notes</p>
 <p className="text-sm text-slate-600 ">
 Procurement summary is linked with finance expenses for variance checks and approval visibility.
 </p>
 <div className="space-y-2 text-sm text-slate-600 ">
 <p>Vendor renewals are routed through automated approval chains.</p>
 <p>Purchase orders sync with monthly finance closing timelines.</p>
 <p>Category-level spend anomalies trigger analytics alerts.</p>
 </div>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Vendor Directory</p>
 <SimpleTable
 rows={vendors}
 columns={[
 { key: 'vendorName', label: 'Vendor' },
 { key: 'category', label: 'Category' },
 { key: 'ownerName', label: 'Owner' },
 {
 key: 'status',
 label: 'Status',
 render: (vendor) => <StatusPill label={vendor.status} tone={vendorTone(vendor.status)} />,
 },
 {
 key: 'rating',
 label: 'Rating',
 render: (vendor) => `${vendor.rating.toFixed(1)}/5`,
 },
 ]}
 />
 </GlassCard>

 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Purchase Orders</p>
 <SimpleTable
 rows={orders}
 columns={[
 { key: 'poNumber', label: 'PO Number' },
 { key: 'vendorName', label: 'Vendor' },
 {
 key: 'amount',
 label: 'Amount',
 render: (order) => formatCurrency(order.amount),
 },
 {
 key: 'status',
 label: 'Status',
 render: (order) => <StatusPill label={order.status} tone={orderTone(order.status)} />,
 },
 { key: 'expectedDeliveryDate', label: 'Expected Delivery' },
 ]}
 />
 </GlassCard>
 </section>
 </div>
 );
}
