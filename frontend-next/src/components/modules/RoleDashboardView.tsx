'use client';

import { useEffect, useMemo } from 'react';
import {
 Activity,
 ArrowUpRight,
 Bell,
 Radar,
 RefreshCw,
 Server,
 ShieldCheck,
 Sparkles,
 Workflow,
} from 'lucide-react';
import { MetricCard } from '@/components/modules/MetricCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { PipelineCard } from '@/components/modules/PipelineCard';
import { InsightListCard } from '@/components/modules/InsightListCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { roleDashboardData } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { canPerformAction } from '@/utils/action-permissions';
import { ROLE_DESCRIPTION, toRoleLabel, toSafePlatformRole } from '@/utils/platform-config';

const fallbackRecentModules = ['attendance', 'tasks', 'location', 'payroll', 'approvals'];

export function RoleDashboardView() {
 const activeRole = useUIStore((state) => state.activeRole);
 const setActiveRole = useUIStore((state) => state.setActiveRole);
 const user = useAuthStore((state) => state.user);
 const safeRole = toSafePlatformRole(activeRole);
 const model = roleDashboardData[safeRole];

 const canBookDemo = canPerformAction(safeRole, 'dashboard.book-demo');
 const canExportDashboard = canPerformAction(safeRole, 'dashboard.export');

 const { data, isLive, loading, error, refresh } = useApiResource({
 loader: async () => {
 const [analytics, notifications, salesSummary] = await Promise.all([
 platformApi.getAnalyticsDashboard(),
 platformApi.getNotifications(),
 platformApi.getSalesSummary(),
 ]);

 return {
 analytics,
 notificationCount: notifications.length,
 salesSummary,
 };
 },
 fallback: {
 analytics: {
 totalEvents: 0,
 recentModules: [],
 },
 notificationCount: 0,
 salesSummary: {
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
 },
 });

 useEffect(() => {
 if (safeRole !== activeRole) {
 setActiveRole(safeRole);
 }
 }, [activeRole, safeRole, setActiveRole]);

 const recentModules = useMemo(
 () => (isLive && data.analytics.recentModules.length ? data.analytics.recentModules.slice(0, 5) : fallbackRecentModules),
 [data.analytics.recentModules, isLive],
 );

 const pipelineTotal = useMemo(
 () => model.pipeline.reduce((sum, item) => sum + item.count, 0),
 [model.pipeline],
 );

 const topPipelineStages = useMemo(
 () => [...model.pipeline].sort((left, right) => right.count - left.count).slice(0, 4),
 [model.pipeline],
 );

 const statusMessage = useMemo(() => {
 if (isLive) {
 return 'Realtime analytics, notification, and sales telemetry are synced under deterministic governance attestation.';
 }

 if (error) {
 return 'Live analytics endpoint is unavailable; protected fallback intelligence is active under bounded assumptions.';
 }

 return 'Protected fallback intelligence is active until live services reconnect.';
 }, [error, isLive]);

 const liveInsights = useMemo(() => {
 if (!isLive) {
 return model.aiInsights;
 }

 const topModules = data.analytics.recentModules.slice(0, 3).join(', ') || 'No recent modules';
 return [
 `Analytics events recorded: ${data.analytics.totalEvents}`,
 `Notification queue size: ${data.notificationCount}`,
 `Sales pipeline: ${data.salesSummary.dealCount} deals and ${data.salesSummary.leadCount} leads active`,
 `Recent modules: ${topModules}`,
 ...model.aiInsights,
 ];
 }, [data, isLive, model.aiInsights]);

 const commandTiles = [
 {
 label: 'Data source',
 value: isLive ? 'API Connected' : 'Fallback Mesh',
 note: isLive ? 'Realtime sync online' : 'Protected demo data active',
 icon: isLive ? Activity : Server,
 className:
 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 ',
 },
 {
 label: 'Notification queue',
 value: `${data.notificationCount}`,
 note: 'Live approvals and broadcast tasks awaiting review',
 icon: Bell,
 className: 'from-amber-500/15 to-amber-500/5 text-amber-700 ',
 },
 {
 label: 'Sales pressure',
 value: `${data.salesSummary.dealCount} deals`,
 note: `${data.salesSummary.leadCount} active leads in motion`,
 icon: Radar,
 className: 'from-sky-500/15 to-sky-500/5 text-sky-700 ',
 },
 {
 label: 'Automation rail',
 value: '200+ workflows',
 note: 'Attendance, tasks, payroll, location and approvals monitored',
 icon: Workflow,
 className: 'from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-700 ',
 },
 {
 label: 'Governance secure',
 value: 'Forensic Lock',
 note: 'Every mutation is forensically anchored to a sovereign epoch',
 icon: ShieldCheck,
 className: 'from-pink-500/15 to-pink-500/5 text-pink-700 ',
 },
 ] as const;

 return (
 <div className="space-y-5">
 <section className="relative overflow-hidden rounded-[30px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.16),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.16),_transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,255,255,0.84))] p-5 shadow-panel backdrop-blur [radial-gradient(circle_at_top_left,_rgba(15,139,141,0.3),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.22),_transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.82))] sm:p-6 lg:p-7">
 <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_50%)] [radial-gradient(circle_at_top_right,_rgba(148,163,184,0.18),_transparent_50%)]" />
 <div className="relative grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
 <div className="space-y-5">
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex rounded-full bg-aqua/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-aqua">
 Live Operations
 </span>
 <span className="inline-flex rounded-full border border-slate-300/80 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 ">
 Active Role: {toRoleLabel(safeRole)}
 </span>
 <span
 className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
 isLive
 ? 'bg-emerald-100 text-emerald-700 '
 : 'bg-amber-100 text-amber-700 '
 }`}
 >
 {isLive ? 'Realtime command mesh' : 'Fallback intelligence'}
 </span>
 <span className="inline-flex rounded-full bg-pink-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-pink-700 ">
 Forensic Lock Active
 </span>
 </div>

 <div className="space-y-3">
 <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
 {model.heading}
 </h1>
 <p className="max-w-3xl text-sm leading-7 text-slate-600 ">
 {model.summary} {toRoleLabel(safeRole)} view: {ROLE_DESCRIPTION[safeRole]}
 {user && (
 <span className="ml-2 inline-block rounded-lg bg-white/10 px-2 py-0.5 text-xs text-white">
 Logged in as: <span className="font-bold">{user.email}</span> ({user.role})
 </span>
 )}
 </p>
 </div>

 <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur ">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <ShieldCheck size={18} className="text-aqua" />
 <p className="text-sm font-semibold text-slate-800 ">
 Command posture stable
 </p>
 </div>
 <p className="text-sm leading-6 text-slate-600 ">
 {statusMessage}
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 disabled={!canBookDemo}
 className="rounded-full bg-gradient-to-r from-ember to-amber px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
 title={canBookDemo ? 'Book Executive Demo' : 'Your role cannot trigger demo bookings.'}
 >
 Book Executive Demo
 </button>
 <button
 type="button"
 disabled={!canExportDashboard}
 className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45 "
 title={canExportDashboard ? 'Export Dashboard' : 'Your role cannot export dashboard data.'}
 >
 Export Dashboard
 </button>
 <button
 type="button"
 onClick={() => void refresh()}
 disabled={loading}
 className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-45 "
 title="Refresh live dashboard data"
 >
 <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
 {loading ? 'Syncing...' : 'Sync Live Data'}
 </button>
 </div>
 </div>

 {!canBookDemo || !canExportDashboard ? (
 <p className="mt-3 text-[11px] text-amber-700 ">
 Some executive actions are restricted by your current role policy.
 </p>
 ) : null}
 </div>

 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ">
 Active route pulse
 </p>
 <div className="mt-3 flex flex-wrap gap-2">
 {recentModules.map((moduleName) => (
 <span
 key={moduleName}
 className="rounded-full border border-slate-300/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-slate-700 "
 >
 {moduleName}
 </span>
 ))}
 </div>
 </div>
 </div>

 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
 {commandTiles.map((tile) => {
 const Icon = tile.icon;

 return (
 <div
 key={tile.label}
 className={`rounded-3xl border border-white/70 bg-gradient-to-br ${tile.className} p-4 shadow-sm backdrop-blur `}
 >
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 ">
 {tile.label}
 </p>
 <p className="mt-3 text-2xl font-semibold text-slate-900 ">
 {tile.value}
 </p>
 </div>
 <div className="rounded-2xl border border-white/70 bg-white/60 p-2.5 ">
 <Icon size={18} />
 </div>
 </div>
 <p className="mt-3 text-xs leading-5 text-slate-600 ">
 {tile.note}
 </p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 <ModuleLinksBar
 links={[
 { label: 'Employees', href: `/employees?role=${safeRole}` },
 { label: 'Payroll', href: `/payroll?role=${safeRole}` },
 { label: 'Recruitment', href: `/recruitment?role=${safeRole}` },
 { label: 'Sales CRM', href: `/sales?role=${safeRole}` },
 { label: 'Automation', href: `/automation?role=${safeRole}` },
 { label: 'Analytics', href: `/analytics?role=${safeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={!isLive ? statusMessage : null}
 />

 {isLive ? (
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Analytics Events</p>
 <p className="mt-2 text-2xl font-semibold">{data.analytics.totalEvents}</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Live Notifications</p>
 <p className="mt-2 text-2xl font-semibold">{data.notificationCount}</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Sales Leads</p>
 <p className="mt-2 text-2xl font-semibold">{data.salesSummary.leadCount}</p>
 </GlassCard>
 <GlassCard>
 <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Open Deals</p>
 <p className="mt-2 text-2xl font-semibold">{data.salesSummary.dealCount}</p>
 </GlassCard>
 </section>
 ) : null}

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {model.kpis.map((metric) => (
 <MetricCard key={metric.id} metric={metric} />
 ))}
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
 <GlassCard className="overflow-hidden">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ">
 Operational focus
 </p>
 <h2 className="mt-2 text-xl font-semibold text-slate-900 ">
 Workflow pressure points
 </h2>
 </div>
 <div className="rounded-full bg-aqua/10 px-3 py-1 text-xs font-semibold text-aqua">
 {pipelineTotal} total actions
 </div>
 </div>

 <div className="mt-5 space-y-4">
 {topPipelineStages.map((item) => {
 const progress = pipelineTotal > 0 ? Math.max(12, Math.round((item.count / pipelineTotal) * 100)) : 0;

 return (
 <div
 key={item.stage}
 className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 "
 >
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-sm font-semibold text-slate-800 ">{item.stage}</p>
 <p className="mt-1 text-xs text-slate-500 ">
 {progress}% of the current operational stage load
 </p>
 </div>
 <div className="text-right">
 <p className="text-lg font-semibold text-slate-900 ">{item.count}</p>
 <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 ">
 Active items
 </p>
 </div>
 </div>
 <div className="mt-3 h-2 rounded-full bg-slate-200 ">
 <div
 className="h-full rounded-full bg-gradient-to-r from-aqua to-emerald-400"
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </GlassCard>

 <GlassCard className="overflow-hidden">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 ">
 Signal stack
 </p>
 <h2 className="mt-2 text-xl font-semibold text-slate-900 ">
 Executive command notes
 </h2>
 </div>
 <Sparkles size={18} className="text-amber-500" />
 </div>

 <div className="mt-5 grid gap-3 sm:grid-cols-2">
 <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 ">
 <div className="flex items-center gap-2">
 <Server size={16} className="text-aqua" />
 <p className="text-sm font-semibold text-slate-800 ">
 System channel
 </p>
 </div>
 <p className="mt-3 text-2xl font-semibold text-slate-900 ">
 {isLive ? 'Realtime' : 'Protected'}
 </p>
 <p className="mt-2 text-xs leading-5 text-slate-500 ">
 {statusMessage}
 </p>
 </div>

 <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 ">
 <div className="flex items-center gap-2">
 <Activity size={16} className="text-emerald-500" />
 <p className="text-sm font-semibold text-slate-800 ">
 Pipeline velocity
 </p>
 </div>
 <p className="mt-3 text-2xl font-semibold text-slate-900 ">
 {data.salesSummary.targetAchievementPercent || 0}%
 </p>
 <p className="mt-2 text-xs leading-5 text-slate-500 ">
 Target achievement tracked against live sales summary sync.
 </p>
 </div>
 </div>

 <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4 ">
 <div className="mb-3 flex items-center gap-2">
 <ArrowUpRight size={16} className="text-amber-500" />
 <p className="text-sm font-semibold text-slate-800 ">
 Highest-priority insights
 </p>
 </div>
 <div className="space-y-3">
 {liveInsights.slice(0, 4).map((item) => (
 <div key={item} className="flex gap-3">
 <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500" />
 <p className="text-sm leading-6 text-slate-600 ">{item}</p>
 </div>
 ))}
 </div>
 </div>
 </GlassCard>
 </section>

 <section className="grid gap-4 xl:grid-cols-2">
 <TrendAreaChart title="Attendance & Workforce Stability" data={model.attendanceTrend} color="#0F8B8D" />
 <TrendAreaChart title="Performance & Target Achievement" data={model.performanceTrend} color="#E85A2A" />
 </section>

 <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
 <StackedBarChart
 title="Recruitment Pipeline / Workflow Throughput"
 data={model.pipeline.map((item) => ({ name: item.stage, value: item.count }))}
 mode="single"
 />
 <PipelineCard title="Operational Stages" items={model.pipeline} />
 </section>

 <InsightListCard title="AI Insights & Live Telemetry" items={liveInsights} />
 </div>
 );
}
