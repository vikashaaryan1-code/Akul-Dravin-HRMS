'use client';

import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { BarChart3, BriefcaseBusiness, Building2, Handshake, Rocket, Target, UsersRound, Wallet, Sparkles } from 'lucide-react';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import {
 salesCommissionRecords,
 salesCustomerAccounts,
 salesIntegrationPulse,
 salesPipelineStages,
 salesRevenueTrend,
 salesTargetRecords,
 salesTeamPerformance,
} from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useSalesStore } from '@/store/sales-store';
import { useUIStore } from '@/store/ui-store';
import { canPerformAction } from '@/utils/action-permissions';
import type {
 SalesDealRecord,
 SalesLeadRecord,
 SalesPipelineStageCode,
 SalesTargetRecord,
 SalesTeamPerformanceRecord,
 SalesCommissionRecord,
} from '@/types/platform';
import { formatCurrency, formatDateTime, formatPercent } from '@/utils/formatters';

const stageLabelByCode = Object.fromEntries(
 salesPipelineStages.map((stage) => [stage.code, stage.label]),
) as Record<SalesPipelineStageCode, string>;

const leadStatusTone: Record<SalesLeadRecord['status'], 'default' | 'success' | 'warning' | 'danger'> = {
 open: 'default',
 nurturing: 'warning',
 converted: 'success',
 lost: 'danger',
};

const dealStatusTone: Record<SalesDealRecord['status'], 'default' | 'success' | 'warning' | 'danger'> = {
 open: 'warning',
 'closed-won': 'success',
 'closed-lost': 'danger',
};

const commissionTone = {
 planned: 'warning',
 approved: 'default',
 paid: 'success',
} as const;

const toStageCode = (value: string | null | undefined): SalesPipelineStageCode => {
 const normalized = (value ?? '').toLowerCase();

 if (normalized.includes('contact')) return 'contacted';
 if (normalized.includes('qual')) return 'qualified';
 if (normalized.includes('proposal')) return 'proposal-sent';
 if (normalized.includes('negoti')) return 'negotiation';
 if (normalized.includes('won')) return 'closed-won';
 if (normalized.includes('lost')) return 'closed-lost';
 return 'new-lead';
};

const toLeadStatus = (value: string | null | undefined, stage: SalesPipelineStageCode): SalesLeadRecord['status'] => {
 const normalized = (value ?? '').toLowerCase();
 if (normalized.includes('convert') || stage === 'closed-won') return 'converted';
 if (normalized.includes('lost') || stage === 'closed-lost') return 'lost';
 if (normalized.includes('nurtur') || stage === 'qualified' || stage === 'proposal-sent' || stage === 'negotiation') return 'nurturing';
 return 'open';
};

const toDealStatus = (value: string | null | undefined, stage: SalesPipelineStageCode): SalesDealRecord['status'] => {
 const normalized = (value ?? '').toLowerCase();
 if (normalized.includes('won') || stage === 'closed-won') return 'closed-won';
 if (normalized.includes('lost') || stage === 'closed-lost') return 'closed-lost';
 return 'open';
};

const toPayoutStatus = (value: string | null | undefined): SalesCommissionRecord['payoutStatus'] => {
 const normalized = (value ?? '').toLowerCase();
 if (normalized.includes('paid')) return 'paid';
 if (normalized.includes('approve')) return 'approved';
 return 'planned';
};

export function SalesModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);
 const leads = useSalesStore((state) => state.leads);
 const deals = useSalesStore((state) => state.deals);
 const setSnapshot = useSalesStore((state) => state.setSnapshot);
 const moveLeadToStage = useSalesStore((state) => state.moveLeadToStage);

 const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [stageFilter, setStageFilter] = useState<'all' | SalesPipelineStageCode>('all');

 const canImportLeads = canPerformAction(activeRole, 'sales.import-leads');
 const canCreateDeal = canPerformAction(activeRole, 'sales.create-deal');
 const canMovePipeline = canPerformAction(activeRole, 'sales.move-pipeline');

 const { data: liveData, isLive, loading, error } = useApiResource({
 loader: async () => {
 const [summary, team, apiLeads, apiDeals, apiTargets, apiCommissions, aiSuggestions] = await Promise.all([
 platformApi.getSalesSummary(),
 platformApi.getSalesTeamPerformance(),
 platformApi.getSalesLeads(),
 platformApi.getSalesDeals(),
 platformApi.getSalesTargets(),
 platformApi.getSalesCommissions(),
 platformApi.getSalesAiSuggestions(),
 ]);

 const dealByLeadId = new Map<string, number>();
 apiDeals.forEach((deal) => {
 if (deal.leadId) {
 dealByLeadId.set(deal.leadId, Number(deal.dealValue || '0'));
 }
 });

 const mappedLeads: SalesLeadRecord[] = apiLeads.map((lead) => {
 const stage = toStageCode(lead.pipelineStage);
 return {
 id: lead.id,
 name: `${lead.firstName} ${lead.lastName ?? ''}`.trim() || lead.email,
 company: lead.organization || 'Prospect Account',
 source: lead.source,
 email: lead.email,
 assignedTo: lead.assignedTo ? `Rep ${lead.assignedTo.slice(0, 6)}` : 'Unassigned',
 score: Number(lead.score || '0'),
 pipelineStage: stage,
 status: toLeadStatus(lead.status, stage),
 expectedValue: dealByLeadId.get(lead.id) ?? 0,
 lastActivity: lead.createdAt,
 };
 });

 const mappedDeals: SalesDealRecord[] = apiDeals.map((deal) => {
 const stage = toStageCode(deal.stage);
 return {
 id: deal.id,
 leadId: deal.leadId ?? deal.id,
 dealName: deal.dealName,
 salesRepresentative: deal.salesRepresentativeId ? `Rep ${deal.salesRepresentativeId.slice(0, 6)}` : 'Unassigned',
 value: Number(deal.dealValue || '0'),
 stage,
 status: toDealStatus(deal.status, stage),
 probability: Number(deal.probability || '0'),
 expectedCloseDate: deal.expectedCloseDate ?? new Date().toISOString(),
 };
 });

 const mappedTargets: SalesTargetRecord[] = apiTargets.map((target) => {
 const targetValue = Number(target.targetValue || '0');
 const achievedValue = Number(target.achievedValue || '0');
 let ownerName = 'Sales Team';
 if (target.employee) {
 ownerName = `${target.employee.firstName} ${target.employee.lastName ?? ''}`.trim();
 } else if (target.employeeId) {
 ownerName = `Rep ${target.employeeId.slice(0, 6)}`;
 }

 return {
 id: target.id,
 ownerName,
 periodLabel: `${target.targetPeriod} - ${target.periodKey}`,
 targetValue,
 achievedValue,
 achievementPercent: targetValue > 0 ? (achievedValue / targetValue) * 100 : 0,
 };
 });

 const mappedCommissions: SalesCommissionRecord[] = apiCommissions.map((commission) => ({
 id: commission.id,
 employeeName: commission.employee ? `${commission.employee.firstName} ${commission.employee.lastName ?? ''}`.trim() : `Rep ${commission.employeeId.slice(0, 6)}`,
 calculatedCommission: Number(commission.calculatedCommission || '0'),
 payoutStatus: toPayoutStatus(commission.payoutStatus),
 }));

 const commissionByEmployee = new Map<string, number>();
 mappedCommissions.forEach((commission) => {
 commissionByEmployee.set(commission.employeeName, (commissionByEmployee.get(commission.employeeName) ?? 0) + commission.calculatedCommission);
 });

 const employeeLookup = new Map<string, string>();
 apiCommissions.forEach(c => {
 if (c.employee) {
 employeeLookup.set(c.employeeId, `${c.employee.firstName} ${c.employee.lastName ?? ''}`.trim());
 }
 });
 apiTargets.forEach(t => {
 if (t.employee && t.employeeId) {
 employeeLookup.set(t.employeeId, `${t.employee.firstName} ${t.employee.lastName ?? ''}`.trim());
 }
 });

 const mappedTeam: SalesTeamPerformanceRecord[] = team.map((item) => {
 const employeeName = employeeLookup.get(item.employeeId) ?? `Rep ${item.employeeId.slice(0, 6)}`;
 return {
 id: item.employeeId,
 employeeName,
 wonValue: Number(item.dealValue || 0),
 winRate: Number(item.winRate || 0),
 commissionEarned: commissionByEmployee.get(employeeName) ?? 0,
 };
 });

 return {
 summary,
 leads: mappedLeads,
 deals: mappedDeals,
 targets: mappedTargets,
 commissions: mappedCommissions,
 teamPerformance: mappedTeam,
 aiSuggestions,
 };
 },
 fallback: {
 summary: {
 leadCount: 0,
 customerCount: 0,
 dealCount: 0,
 totalDealValue: 0,
 wonDealValue: 0,
 closedWonCount: 0,
 closedLostCount: 0,
 targetAchievementPercent: 0,
 totalCommission: 0,
 pipelineCounts: [],
 },
 leads: [],
 deals: [],
 targets: salesTargetRecords,
 commissions: salesCommissionRecords,
 teamPerformance: salesTeamPerformance,
 aiSuggestions: [],
 },
 });

 useEffect(() => {
 if (isLive) {
 setSnapshot({ leads: liveData.leads, deals: liveData.deals });
 }
 }, [isLive, liveData.deals, liveData.leads, setSnapshot]);

 const pipelineColumns = useMemo(
 () =>
 salesPipelineStages.map((stage) => ({
 ...stage,
 leads: leads.filter((lead) => lead.pipelineStage === stage.code),
 })),
 [leads],
 );

 const filteredLeads = useMemo(() => {
 const query = searchQuery.trim().toLowerCase();

 return leads.filter((lead) => {
 const queryMatch =
 !query ||
 lead.name.toLowerCase().includes(query) ||
 lead.company.toLowerCase().includes(query) ||
 lead.assignedTo.toLowerCase().includes(query) ||
 lead.source.toLowerCase().includes(query);

 const stageMatch = stageFilter === 'all' || lead.pipelineStage === stageFilter;
 return queryMatch && stageMatch;
 });
 }, [leads, searchQuery, stageFilter]);

 const openPipelineValue = useMemo(
 () => deals.filter((deal) => deal.status === 'open').reduce((sum, deal) => sum + deal.value, 0),
 [deals],
 );

 const activeCommissions = isLive ? liveData.commissions : salesCommissionRecords;
 const activeTargets = isLive ? liveData.targets : salesTargetRecords;
 const activeTeamPerformance = isLive ? liveData.teamPerformance : salesTeamPerformance;

 const pendingCommissionValue = useMemo(
 () =>
 activeCommissions
 .filter((commission) => commission.payoutStatus !== 'paid')
 .reduce((sum, commission) => sum + commission.calculatedCommission, 0),
 [activeCommissions],
 );

 const targetProgress = useMemo(() => {
 const totalTarget = activeTargets.reduce((sum, item) => sum + item.targetValue, 0);
 const totalAchieved = activeTargets.reduce((sum, item) => sum + item.achievedValue, 0);
 return totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
 }, [activeTargets]);

 const stageDistribution = useMemo(
 () =>
 pipelineColumns.map((column) => ({
 name: column.label,
 value: column.leads.length,
 })),
 [pipelineColumns],
 );

 const commissionDistribution = useMemo(() => {
 const grouped = activeCommissions.reduce(
 (accumulator, record) => {
 accumulator[record.payoutStatus] += record.calculatedCommission;
 return accumulator;
 },
 {
 planned: 0,
 approved: 0,
 paid: 0,
 } as Record<'planned' | 'approved' | 'paid', number>,
 );

 return [
 { name: 'Planned', value: grouped.planned },
 { name: 'Approved', value: grouped.approved },
 { name: 'Paid', value: grouped.paid },
 ];
 }, [activeCommissions]);

 const onLeadDrop = (stage: SalesPipelineStageCode, event: DragEvent<HTMLDivElement>) => {
 event.preventDefault();

 if (!canMovePipeline) {
 return;
 }
 const fromTransfer = event.dataTransfer.getData('text/sales-lead-id');
 const leadId = fromTransfer || draggedLeadId;

 if (!leadId) {
 return;
 }

 moveLeadToStage(leadId, stage);
 setDraggedLeadId(null);
 };

 const integrationPulse = isLive
 ? {
 hrmsMappedAgents: Math.max(1, activeTeamPerformance.length),
 payrollBonusReady: activeCommissions.filter((item) => item.payoutStatus !== 'paid').length,
 recruitmentReferrals: liveData.summary.leadCount,
 analyticsModels: 22,
 }
 : salesIntegrationPulse;

 return (
 <div className="space-y-5">
 <PageTitle
 title="Sales Automation & CRM"
 description="Run lead management, customer CRM, pipeline execution, targets, commission automation, and revenue analytics from one operating console."
 actions={
 <div className="flex flex-col items-start gap-2">
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 disabled={!canImportLeads}
 className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-45 "
 title={canImportLeads ? 'Import Leads' : 'Your role cannot import leads.'}
 >
 Import Leads
 </button>
 <button
 type="button"
 disabled={!canCreateDeal}
 className="rounded-xl bg-gradient-to-r from-ink to-aqua px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-aqua/25 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
 title={canCreateDeal ? 'Create Deal' : 'Your role cannot create deals.'}
 >
 Create Deal
 </button>
 </div>
 {!canImportLeads || !canCreateDeal ? (
 <p className="text-[11px] text-amber-700 ">Sales actions are restricted by active role policy.</p>
 ) : null}
 </div>
 }
 />

 <ModuleLinksBar
 links={[
 { label: 'Payroll', href: `/payroll?role=${activeRole}` },
 { label: 'Recruitment', href: `/recruitment?role=${activeRole}` },
 { label: 'Analytics', href: `/analytics?role=${activeRole}` },
 { label: 'Automation', href: `/automation?role=${activeRole}` },
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
 <p className="mt-2 text-2xl font-semibold">{liveData.summary.leadCount || leads.length}</p>
 <p className="mt-1 text-xs text-slate-500">Live lead scoring and assignment enabled</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Open Pipeline Value</p>
 <BriefcaseBusiness size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatCurrency(openPipelineValue)}</p>
 <p className="mt-1 text-xs text-slate-500">Deals synced with stage movement</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Target Achievement</p>
 <Target size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatPercent(targetProgress)}</p>
 <p className="mt-1 text-xs text-slate-500">Monthly, quarterly, annual target rollup</p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Pending Commission</p>
 <Wallet size={16} className="text-slate-500" />
 </div>
 <p className="mt-2 text-2xl font-semibold">{formatCurrency(pendingCommissionValue)}</p>
 <p className="mt-1 text-xs text-slate-500">Payroll bonus sync queue active</p>
 </GlassCard>
 </section>

 <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">HRMS Integration</p>
 <p className="mt-2 text-lg font-semibold">{integrationPulse.hrmsMappedAgents} mapped reps</p>
 <p className="mt-1 text-sm text-slate-600 ">Lead ownership synced with employee master and role access.</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Payroll Integration</p>
 <p className="mt-2 text-lg font-semibold">{integrationPulse.payrollBonusReady} payouts ready</p>
 <p className="mt-1 text-sm text-slate-600 ">Commission automation feeds bonus-ready payroll batches.</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Recruitment Integration</p>
 <p className="mt-2 text-lg font-semibold">{integrationPulse.recruitmentReferrals} referrals</p>
 <p className="mt-1 text-sm text-slate-600 ">Hiring pipeline contributes pre-qualified BDR and AE candidates.</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Analytics Integration</p>
 <p className="mt-2 text-lg font-semibold">{integrationPulse.analyticsModels} AI forecasts</p>
 <p className="mt-1 text-sm text-slate-600 ">Revenue and win-rate projections flow into enterprise analytics.</p>
 </GlassCard>
 </section>

 {liveData.aiSuggestions && liveData.aiSuggestions.length > 0 && (
 <section className="mb-4">
 <GlassCard className="border-ember/20 bg-ember/5 relative overflow-hidden">
 <div className="absolute -top-10 -right-10 w-32 h-32 bg-ember/20 rounded-full blur-3xl" />
 <div className="flex items-center gap-2 mb-3 relative z-10">
 <Sparkles className="h-5 w-5 text-ember animate-pulse" />
 <p className="text-sm font-bold text-navy">AI Sales Intelligence</p>
 </div>
 <div className="grid sm:grid-cols-2 gap-4 relative z-10">
 {liveData.aiSuggestions.map((suggestion: any) => (
 <div key={suggestion.id} className="p-3 rounded-xl border border-ember/30 bg-ember/10 flex items-start gap-3">
 <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${suggestion.type === 'opportunity' ? 'bg-jade' : 'bg-gold'}`} />
 <p className="text-xs text-slate-600 leading-relaxed">{suggestion.text}</p>
 </div>
 ))}
 </div>
 </GlassCard>
 </section>
 )}

 <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
 <GlassCard className="space-y-3 p-4 sm:p-5">
 <div className="flex items-center justify-between">
 <p className="text-sm font-semibold text-slate-800 ">Drag-and-Drop Sales Pipeline</p>
 <StatusPill label="Realtime board" tone="success" />
 </div>
 <p className="text-xs text-slate-500">Drag lead cards across stages to update lifecycle status and linked deal stage.</p>
 {!canMovePipeline ? (
 <p className="text-xs text-amber-700 ">Your role has view-only pipeline access.</p>
 ) : null}
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
 {pipelineColumns.map((column) => (
 <div
 key={column.code}
 onDragOver={(event) => event.preventDefault()}
 onDrop={(event) => onLeadDrop(column.code, event)}
 className="min-h-36 rounded-2xl border border-slate-200/70 bg-white/80 p-3 "
 >
 <div className="mb-2 flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-[0.09em] text-slate-500">{column.label}</p>
 <StatusPill label={String(column.leads.length)} />
 </div>
 <div className="space-y-2">
 {column.leads.map((lead) => (
 <article
 key={lead.id}
 draggable={canMovePipeline}
 onDragStart={(event) => {
 if (!canMovePipeline) {
 event.preventDefault();
 return;
 }

 event.dataTransfer.setData('text/sales-lead-id', lead.id);
 setDraggedLeadId(lead.id);
 }}
 onDragEnd={() => setDraggedLeadId(null)}
 className={`rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition ${
 canMovePipeline ? 'cursor-move hover:border-aqua/60' : 'cursor-not-allowed opacity-80'
 }`}
 >
 <p className="text-sm font-semibold text-slate-800 ">{lead.name}</p>
 <p className="text-xs text-slate-500">{lead.company}</p>
 <div className="mt-2 flex items-center justify-between text-xs">
 <StatusPill label={`Score ${lead.score}`} tone={lead.score >= 80 ? 'success' : 'warning'} />
 <span className="font-semibold text-slate-700 ">{formatCurrency(lead.expectedValue)}</span>
 </div>
 </article>
 ))}
 </div>
 </div>
 ))}
 </div>
 </GlassCard>

 <div className="space-y-4">
 <StackedBarChart title="Stage Distribution" data={stageDistribution} mode="single" />
 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 ">Lead Nurturing Automation</p>
 <div className="mt-3 space-y-2 text-sm text-slate-600 ">
 <p>Website leads trigger instant qualification workflow and task assignment.</p>
 <p>Proposal reminders auto-schedule follow-ups after 48 hours of inactivity.</p>
 <p>Closed-lost reasons sync to analytics model retraining queues.</p>
 </div>
 </GlassCard>
 </div>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
 <GlassCard className="space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <p className="text-sm font-semibold text-slate-800 ">Lead Management</p>
 <div className="flex flex-wrap gap-2">
 <input
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 placeholder="Search lead, company, owner"
 className="h-9 w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-aqua "
 />
 <select
 value={stageFilter}
 onChange={(event) => setStageFilter(event.target.value as typeof stageFilter)}
 className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none transition focus:border-aqua "
 >
 <option value="all">All stages</option>
 {salesPipelineStages.map((stage) => (
 <option key={stage.code} value={stage.code}>
 {stage.label}
 </option>
 ))}
 </select>
 </div>
 </div>
 <SimpleTable
 rows={filteredLeads}
 columns={[
 { key: 'name', label: 'Lead' },
 { key: 'company', label: 'Company' },
 { key: 'assignedTo', label: 'Owner' },
 {
 key: 'score',
 label: 'Score',
 render: (lead) => <StatusPill label={`${lead.score}/100`} tone={lead.score >= 80 ? 'success' : 'warning'} />,
 },
 {
 key: 'pipelineStage',
 label: 'Stage',
 render: (lead) => <StatusPill label={stageLabelByCode[lead.pipelineStage]} tone={leadStatusTone[lead.status]} />,
 },
 ]}
 />
 </GlassCard>

 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Customer CRM</p>
 <div className="space-y-3">
 {salesCustomerAccounts.map((account) => (
 <div
 key={account.id}
 className="rounded-xl border border-slate-200/70 bg-white/80 p-3 "
 >
 <div className="flex items-center justify-between">
 <p className="text-sm font-semibold text-slate-800 ">{account.accountName}</p>
 <StatusPill label={account.accountStatus} tone={account.accountStatus === 'active' ? 'success' : 'warning'} />
 </div>
 <p className="mt-1 text-xs text-slate-500">{account.industry} - Owner: {account.ownerName}</p>
 <div className="mt-2 flex items-center justify-between text-xs text-slate-600 ">
 <span>{account.contactCount} contacts</span>
 <span>{formatCurrency(account.annualRecurringValue)} ARR</span>
 </div>
 </div>
 ))}
 </div>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Deal Management</p>
 <SimpleTable
 rows={deals}
 columns={[
 { key: 'dealName', label: 'Deal' },
 { key: 'salesRepresentative', label: 'Sales Rep' },
 {
 key: 'value',
 label: 'Value',
 render: (deal) => <span className="font-semibold text-slate-700 ">{formatCurrency(deal.value)}</span>,
 },
 {
 key: 'stage',
 label: 'Stage',
 render: (deal) => <StatusPill label={stageLabelByCode[deal.stage]} tone={dealStatusTone[deal.status]} />,
 },
 {
 key: 'probability',
 label: 'Win Probability',
 render: (deal) => `${deal.probability}%`,
 },
 {
 key: 'expectedCloseDate',
 label: 'Expected Close',
 render: (deal) => formatDateTime(deal.expectedCloseDate),
 },
 ]}
 />
 </GlassCard>

 <div className="space-y-4">
 <TrendAreaChart title="Sales Revenue Trend" data={salesRevenueTrend} color="#1f6feb" />
 <DonutChartCard title="Commission Payout Mix" data={commissionDistribution} />
 </div>
 </section>

 <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
 <GlassCard className="space-y-3">
 <div className="flex items-center justify-between">
 <p className="text-sm font-semibold text-slate-800 ">Sales Target Management</p>
 <Rocket size={15} className="text-slate-500" />
 </div>
 <SimpleTable
 rows={activeTargets}
 columns={[
 { key: 'ownerName', label: 'Owner' },
 { key: 'periodLabel', label: 'Period' },
 {
 key: 'targetValue',
 label: 'Target',
 render: (target) => formatCurrency(target.targetValue),
 },
 {
 key: 'achievedValue',
 label: 'Achieved',
 render: (target) => formatCurrency(target.achievedValue),
 },
 {
 key: 'achievementPercent',
 label: 'Progress',
 render: (target) => <StatusPill label={formatPercent(target.achievementPercent)} tone={target.achievementPercent >= 85 ? 'success' : 'warning'} />,
 },
 ]}
 />
 </GlassCard>

 <GlassCard className="space-y-3">
 <div className="flex items-center justify-between">
 <p className="text-sm font-semibold text-slate-800 ">Sales Team Performance</p>
 <BarChart3 size={15} className="text-slate-500" />
 </div>
 <SimpleTable
 rows={activeTeamPerformance}
 columns={[
 { key: 'employeeName', label: 'Employee' },
 {
 key: 'wonValue',
 label: 'Won Value',
 render: (row) => formatCurrency(row.wonValue),
 },
 {
 key: 'winRate',
 label: 'Win Rate',
 render: (row) => <StatusPill label={formatPercent(row.winRate)} tone={row.winRate >= 40 ? 'success' : 'warning'} />,
 },
 {
 key: 'commissionEarned',
 label: 'Commission',
 render: (row) => formatCurrency(row.commissionEarned),
 },
 ]}
 />
 </GlassCard>
 </section>

 <section className="grid gap-3 md:grid-cols-3">
 <GlassCard>
 <div className="flex items-center gap-2">
 <Building2 size={15} className="text-slate-500" />
 <p className="text-sm font-semibold text-slate-800 ">Customer Interaction History</p>
 </div>
 <p className="mt-2 text-sm text-slate-600 ">
 Calls, meetings, emails, and notes are captured in CRM timeline and attached to account-level context.
 </p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center gap-2">
 <Handshake size={15} className="text-slate-500" />
 <p className="text-sm font-semibold text-slate-800 ">Deal Tracking Automation</p>
 </div>
 <p className="mt-2 text-sm text-slate-600 ">
 Expected close dates trigger reminders, overdue alerts, and stage health checks for managers.
 </p>
 </GlassCard>
 <GlassCard>
 <div className="flex items-center gap-2">
 <Wallet size={15} className="text-slate-500" />
 <p className="text-sm font-semibold text-slate-800 ">Commission Automation</p>
 </div>
 <div className="mt-2 space-y-1 text-sm text-slate-600 ">
 {activeCommissions.map((item) => (
 <div key={item.id} className="flex items-center justify-between">
 <span>{item.employeeName}</span>
 <StatusPill label={item.payoutStatus} tone={commissionTone[item.payoutStatus]} />
 </div>
 ))}
 </div>
 </GlassCard>
 </section>
 </div>
 );
}


