'use client';

import { useMemo } from 'react';
import { BarChart3, Building2, Handshake, UsersRound } from 'lucide-react';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { crmCustomerRecords, crmInteractionRecords, crmLeadRecords } from '@/services/platform-data';
import type { CrmCustomerApiRecord, CrmInteractionApiRecord, CrmLeadApiRecord } from '@/services/api/platform-api';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatCurrency, formatDateTime, formatPercent } from '@/utils/formatters';

const stageTone = (stage: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = stage.toLowerCase();

 if (normalized.includes('won') || normalized.includes('closed')) return 'success';
 if (normalized.includes('lost')) return 'danger';
 if (normalized.includes('negoti') || normalized.includes('proposal') || normalized.includes('qual')) return 'warning';
 return 'default';
};

const healthTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
 const normalized = status.toLowerCase();

 if (normalized.includes('healthy')) return 'success';
 if (normalized.includes('risk')) return 'danger';
 return 'default';
};

export function CrmModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);

 const { data, isLive, loading, error } = useApiResource({
 loader: async () => {
 const [leads, customers, interactions] = await Promise.all([
 platformApi.getCrmLeads(),
 platformApi.getCrmCustomers(),
 platformApi.getCrmInteractions(),
 ]);

 return {
 leads,
 customers,
 interactions,
 };
 },
 fallback: {
 leads: crmLeadRecords,
 customers: crmCustomerRecords,
 interactions: crmInteractionRecords,
 },
 });

 const averageLeadScore = useMemo(() => {
 if (data.leads.length === 0) {
 return 0;
 }

 const total = data.leads.reduce((sum, item) => sum + item.score, 0);
 return total / data.leads.length;
 }, [data.leads]);

 const healthyAccounts = useMemo(
 () => data.customers.filter((customer) => customer.healthStatus.toLowerCase().includes('healthy')).length,
 [data.customers],
 );

 const stageDistribution = useMemo(() => {
 const grouped = new Map<string, number>();

 data.leads.forEach((lead) => {
 grouped.set(lead.stage, (grouped.get(lead.stage) ?? 0) + 1);
 });

 return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
 }, [data.leads]);

 const interactionMix = useMemo(() => {
 const grouped = new Map<string, number>();

 data.interactions.forEach((interaction) => {
 grouped.set(interaction.channel, (grouped.get(interaction.channel) ?? 0) + 1);
 });

 return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
 }, [data.interactions]);

 const engagementRate = useMemo(() => {
 if (data.customers.length === 0) {
 return 0;
 }

 return (data.interactions.length / data.customers.length) * 100;
 }, [data.customers.length, data.interactions.length]);

 const leads = data.leads as CrmLeadApiRecord[];
 const customers = data.customers as CrmCustomerApiRecord[];
 const interactions = data.interactions as CrmInteractionApiRecord[];

 return (
 <div className="space-y-5">
 <PageTitle
 title="CRM Workspace"
 description="Manage leads, customer accounts, and interaction histories in a unified relationship command center."
 />

 <ModuleLinksBar
 links={[
 { label: 'Sales', href: `/sales?role=${activeRole}` },
 { label: 'Marketing', href: `/marketing?role=${activeRole}` },
 { label: 'Finance', href: `/finance?role=${activeRole}` },
 { label: 'Analytics', href: `/analytics?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Total Leads</p>
 <UsersRound size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{leads.length}</p>
 <p className="mt-1 text-xs text-slate-500">Qualification + scoring automation enabled</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Avg Lead Score</p>
 <BarChart3 size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{averageLeadScore.toFixed(1)}</p>
 <p className="mt-1 text-xs text-slate-500">High-intent lead prioritization active</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Healthy Accounts</p>
 <Building2 size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{healthyAccounts}</p>
 <p className="mt-1 text-xs text-slate-500">Account health signals synced to analytics</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Engagement Density</p>
 <Handshake size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatPercent(engagementRate)}</p>
 <p className="mt-1 text-xs text-slate-500">Interactions per customer relationship</p>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
 <DonutChartCard title="Lead Stage Distribution" data={stageDistribution} />
 <StackedBarChart title="Interaction Channel Mix" data={interactionMix} mode="single" />
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Lead Management</p>
 <SimpleTable
 rows={leads}
 columns={[
 { key: 'leadName', label: 'Lead' },
 { key: 'organization', label: 'Organization' },
 { key: 'ownerName', label: 'Owner' },
 {
 key: 'score',
 label: 'Score',
 render: (lead) => <StatusPill label={`${lead.score}/100`} tone={lead.score >= 85 ? 'success' : 'warning'} />,
 },
 {
 key: 'stage',
 label: 'Stage',
 render: (lead) => <StatusPill label={lead.stage} tone={stageTone(lead.stage)} />,
 },
 {
 key: 'lastTouch',
 label: 'Last Touch',
 render: (lead) => formatDateTime(lead.lastTouch),
 },
 ]}
 />
 </GlassCard>

 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Customer Accounts</p>
 <div className="space-y-3">
 {customers.map((account) => (
 <div
 key={account.id}
 className="rounded-xl border border-slate-200/70 bg-white/80 p-3 "
 >
 <div className="flex items-center justify-between gap-2">
 <p className="text-sm font-semibold text-slate-800 ">{account.accountName}</p>
 <StatusPill label={account.healthStatus} tone={healthTone(account.healthStatus)} />
 </div>
 <p className="mt-1 text-xs text-slate-500">{account.industry} - Owner: {account.ownerName}</p>
 <p className="mt-2 text-sm font-semibold text-slate-700 ">{formatCurrency(account.annualValue)} ARR</p>
 </div>
 ))}
 </div>
 </GlassCard>
 </section>

 <section>
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Interaction Timeline</p>
 <SimpleTable
 rows={interactions}
 columns={[
 { key: 'customerName', label: 'Customer' },
 {
 key: 'channel',
 label: 'Channel',
 render: (row) => <StatusPill label={row.channel} tone="default" />,
 },
 { key: 'interactionType', label: 'Interaction Type' },
 {
 key: 'happenedAt',
 label: 'When',
 render: (row) => formatDateTime(row.happenedAt),
 },
 { key: 'summary', label: 'Summary' },
 ]}
 />
 </GlassCard>
 </section>
 </div>
 );
}
