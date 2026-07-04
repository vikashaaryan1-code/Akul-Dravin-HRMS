'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
 Users, DollarSign, ShieldCheck, BarChart3, BrainCircuit,
 Clock, TrendingUp, AlertTriangle, CheckCircle2, ArrowUpRight,
 Zap, Building2, Briefcase, RefreshCw, Sparkles, Globe, Fingerprint, Calendar, MapPin, CreditCard, ArrowRight, Lock, Landmark,
} from 'lucide-react';
import {
 KpiStrip,
 AreaTrendChart,
 BarTrendChart,
 DonutChart,
 GlassCard,
 SuspenseDashboardBoundary,
 SkeletonCard,
 SkeletonTable,
} from '@/components/system';
import {
 useDashboardKpis,
 useHeadcountTrend,
 useDeptBreakdown,
 useAiInsights,
 usePendingApprovals,
 type DashboardKpiDto,
 type AiInsightDto,
 type PendingApprovalDto,
} from '@/hooks/api';
import { PredictiveInsightsWidget } from './PredictiveInsightsWidget';

/* ── Fallback data (used when API is unavailable) ────────────────────────────── */ const FALLBACK_KPIS: DashboardKpiDto = {
 totalHeadcount: 1247,
 monthlyPayroll: 48000000,
 complianceScore: 94,
 activePositions: 38,
 headcountTrend: 3.2,
 payrollTrend: 1.8,
 complianceTrend: 2.1,
 positionsTrend: -4.5,
};

const FALLBACK_HEADCOUNT = [
 { month: 'Nov', headcount: 1180, exits: 12 },
 { month: 'Dec', headcount: 1195, exits: 8 },
 { month: 'Jan', headcount: 1210, exits: 14 },
 { month: 'Feb', headcount: 1218, exits: 9 },
 { month: 'Mar', headcount: 1231, exits: 11 },
 { month: 'Apr', headcount: 1247, exits: 7 },
];

const FALLBACK_DEPT_SPLIT = [
 { name: 'Engineering', value: 38, color: 'aqua' as const },
 { name: 'Sales', value: 19, color: 'gold' as const },
 { name: 'Operations', value: 15, color: 'jade' as const },
 { name: 'Finance', value: 11, color: 'ember' as const },
 { name: 'Others', value: 17, color: 'mist' as const },
];

const FALLBACK_AI_INSIGHTS: AiInsightDto[] = [
 { id: '1', severity: 'warning', title: 'Attrition Risk Elevated',
 body: 'Engineering team shows 72% attrition risk index. 3 senior ICs flagged.', action: 'View Report' },
 { id: '2', severity: 'ai', title: 'Payroll Forecast',
 body: 'Q3 payroll projected at ₹5.2Cr (+8.3%) if 20-hire plan executes. Breakeven: month 4.', action: 'Open Forecast' },
 { id: '3', severity: 'success', title: 'ISO Audit Passed',
 body: 'ISO 27001 annual audit completed with zero critical findings.', action: 'View Certificate' },
];

const FALLBACK_APPROVALS: PendingApprovalDto[] = [
 { id: 'a1', type: 'Leave Request', name: 'Rahul Mehta', dept: 'Engineering', time: '2h ago', urgency: 'low', href: '/leave' },
 { id: 'a2', type: 'Expense Claim', name: 'Priya Sharma', dept: 'Sales', time: '4h ago', urgency: 'medium', href: '/expense' },
 { id: 'a3', type: 'Offer Letter', name: 'Karan Joshi', dept: 'Recruitment', time: '6h ago', urgency: 'high', href: '/recruitment' },
 { id: 'a4', type: 'Policy Exception', name: 'Sneha Reddy', dept: 'Operations', time: '1d ago', urgency: 'medium', href: '/compliance' },
 { id: 'a5', type: 'Salary Revision', name: 'Amit Kulkarni', dept: 'Finance', time: '2d ago', urgency: 'high', href: '/payroll' },
];

const DEPT_COST = [
 { dept: 'Eng', cost: 1820 },
 { dept: 'Sales', cost: 940 },
 { dept: 'Ops', cost: 730 },
 { dept: 'Finance', cost: 510 },
 { dept: 'People', cost: 380 },
 { dept: 'Legal', cost: 180 },
];

const ORG_HEALTH = [
 { label: 'Engagement Score', value: 78, max: 100, color: 'bg-gold' },
 { label: 'Retention Rate', value: 91, max: 100, color: 'bg-jade' },
 { label: 'NPS (eNPS)', value: 62, max: 100, color: 'bg-aqua' },
 { label: 'Diversity Index', value: 55, max: 100, color: 'bg-ember' },
];

const URGENCY_STYLE: Record<string, { dot: string; label: string }> = {
 low: { dot: 'bg-jade', label: 'text-jade' },
 medium: { dot: 'bg-gold', label: 'text-gold' },
 high: { dot: 'bg-ember', label: 'text-ember' },
};

const SEVERITY_STYLE: Record<string, { icon: any; color: string; border: string; bg: string }> = {
 warning: { icon: AlertTriangle, color: 'text-gold', border: 'border-gold/20', bg: 'bg-gold/5' },
 info: { icon: BrainCircuit, color: 'text-aqua', border: 'border-aqua/20', bg: 'bg-aqua/5' },
 success: { icon: CheckCircle2, color: 'text-jade', border: 'border-jade/20', bg: 'bg-jade/5' },
 ai: { icon: Sparkles, color: 'text-ember', border: 'border-ember/20', bg: 'bg-ember/5' },
};

/* ── Format helpers ───────────────────────────────────────────────────────────── */ function formatCrore(rupees: number): string {
 const cr = rupees / 10_000_000;
 return `₹${cr.toFixed(1)}Cr`;
}

/* ── KPI Strip wired to API ──────────────────────────────────────────────────── */ function LiveKpiStrip() {
 const { data, isLoading, isError } = useDashboardKpis();
 const kpi = data ?? FALLBACK_KPIS;

 if (isLoading) {
 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
 </div>
 );
 }

 const tiles = [
 { label: 'Total Headcount', value: kpi.totalHeadcount.toLocaleString(), trend: kpi.headcountTrend, icon: Users, iconColor: 'text-aqua' },
 { label: 'Monthly Payroll', value: formatCrore(kpi.monthlyPayroll), trend: kpi.payrollTrend, icon: DollarSign, iconColor: 'text-gold' },
 { label: 'Compliance Score', value: `${kpi.complianceScore}%`, trend: kpi.complianceTrend, icon: ShieldCheck,iconColor: 'text-jade' },
 { label: 'Active Positions', value: String(kpi.activePositions), trend: kpi.positionsTrend, icon: Briefcase, iconColor: 'text-ember' },
 ];

 return (
 <div>
 {isError && (
 <p className="mb-3 text-[10px] text-amber-400/70">⚠ Live KPIs unavailable — showing last known values</p>
 )}
 <KpiStrip tiles={tiles as any} columns={4} />
 </div>
 );
}

/* ── Headcount Trend Chart wired to API ─────────────────────────────────────── */ function LiveHeadcountChart() {
 const { data, isLoading } = useHeadcountTrend(6);
 const chartData = (data && data.length > 0) ? data : FALLBACK_HEADCOUNT;

 if (isLoading) return <SkeletonCard className="h-64" />;

 return (
 <AreaTrendChart
 data={chartData}
 xKey="month"
 series={[
 { key: 'headcount', label: 'Headcount', color: 'aqua' },
 { key: 'exits', label: 'Exits', color: 'ember' },
 ]}
 title="Headcount Trend"
 subtitle="Last 6 months · hired vs exited"
 height={260}
 />
 );
}

/* ── Dept Breakdown Donut wired to API ───────────────────────────────────────── */ function LiveDeptDonut() {
 const { data, isLoading } = useDeptBreakdown();
 const donutData = (data && data.length > 0) ? data : FALLBACK_DEPT_SPLIT;

 if (isLoading) return <SkeletonCard className="h-64" />;

 return (
 <DonutChart
 data={donutData as any}
 title="Headcount by Dept"
 subtitle="Live org distribution"
 height={260}
 />
 );
}

/* ── AI Insight Feed wired to API ────────────────────────────────────────────── */ function LiveAiInsightFeed() {
 const { data, isLoading, isError } = useAiInsights();
 const insights = (data && data.length > 0) ? data : FALLBACK_AI_INSIGHTS;

 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Zap className="h-4 w-4 text-ember" aria-hidden="true" />
 <p className="text-sm font-black text-navy">AI Intelligence Feed</p>
 </div>
 <span className={`section-label ${isLoading ? 'text-slate-500' : isError ? 'text-amber-400' : 'text-ember'}`}>
 {isLoading ? 'Loading…' : isError ? 'Fallback' : 'Live'}
 </span>
 </div>

 {isLoading ? (
 <div className="space-y-3">
 {Array.from({ length: 3 }).map((_, i) => (
 <div key={i} className="h-20 rounded-xl bg-white/60 animate-pulse" />
 ))}
 </div>
 ) : (
 <div className="space-y-3" role="feed" aria-label="AI insights">
 {insights.map((insight) => {
 const style = SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.info;
 const InsightIcon = style.icon;
 return (
 <div key={insight.id} className={`rounded-xl border ${style.border} ${style.bg} p-4`} role="article">
 <div className="flex items-start gap-3">
 <InsightIcon className={`h-4 w-4 ${style.color} shrink-0 mt-0.5`} aria-hidden="true" />
 <div className="flex-1 min-w-0">
 <p className="text-xs font-black text-navy">{insight.title}</p>
 <p className="text-xs text-slate-500 mt-1 leading-relaxed">{insight.body}</p>
 </div>
 </div>
 <button
 className={`mt-3 text-[10px] font-black uppercase tracking-wide ${style.color} hover:underline`}
 aria-label={`${insight.action} for ${insight.title}`}
 >
 {insight.action} →
 </button>
 </div>
 );
 })}

 {insights.length === 0 && (
 <div className="text-center py-8">
 <Sparkles className="h-8 w-8 text-slate-700 mx-auto mb-2" />
 <p className="text-xs text-slate-500">No AI insights at this time</p>
 </div>
 )}
 </div>
 )}
 </GlassCard>
 );
}

/* ── Org Health Panel ────────────────────────────────────────────────────────── */ function OrgHealthPanel() {
 return (
 <GlassCard className="p-6 flex flex-col gap-5">
 <div className="flex items-center gap-2">
 <TrendingUp className="h-4 w-4 text-jade" aria-hidden="true" />
 <p className="text-sm font-black text-navy">Org Health</p>
 </div>
 <dl className="space-y-4">
 {ORG_HEALTH.map((m) => (
 <div key={m.label}>
 <div className="flex justify-between mb-1.5">
 <dt className="text-xs text-slate-500">{m.label}</dt>
 <dd className="text-xs font-black text-navy">{m.value}%</dd>
 </div>
 <div className="h-1.5 rounded-full bg-white/60" role="progressbar" aria-valuenow={m.value} aria-valuemin={0} aria-valuemax={m.max} aria-label={m.label}>
 <motion.div
 initial={{ width: 0 }}
 whileInView={{ width: `${m.value}%` }}
 viewport={{ once: true }}
 transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
 className={`h-full rounded-full ${m.color}`}
 />
 </div>
 </div>
 ))}
 </dl>
 <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
 <CheckCircle2 className="h-3.5 w-3.5 text-jade" aria-hidden="true" />
 <p className="text-xs text-slate-500">Org health index: <span className="text-jade font-black">91/100</span></p>
 </div>
 </GlassCard>
 );
}

/* ── Pending Approvals Panel wired to API ───────────────────────────────────── */ function LivePendingApprovalsPanel() {
 const { data, isLoading, isError, refetch } = usePendingApprovals();
 const approvals = (data && data.length > 0) ? data : FALLBACK_APPROVALS;

 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4 text-gold" aria-hidden="true" />
 <p className="text-sm font-black text-navy">Pending Approvals</p>
 </div>
 <div className="flex items-center gap-2">
 {!isLoading && (
 <span className="text-xs font-black text-gold">{approvals.length} items</span>
 )}
 <button
 onClick={() => void refetch()}
 disabled={isLoading}
 className="h-6 w-6 rounded-lg bg-white/60 flex items-center justify-center text-slate-500 hover:text-navy transition-colors disabled:opacity-40"
 aria-label="Refresh approvals"
 >
 <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

 {isLoading ? (
 <SkeletonTable rows={5} />
 ) : isError ? (
 <div className="text-center py-6">
 <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-2" />
 <p className="text-xs text-slate-500">Could not load approvals</p>
 <button onClick={() => void refetch()} className="mt-2 text-xs text-amber-400 hover:underline">Retry</button>
 </div>
 ) : (
 <SuspenseDashboardBoundary context="Approvals" skeletonType="table" skeletonRows={5}>
 <div className="space-y-2" role="list" aria-label="Pending approvals">
 {approvals.map((item) => {
 const urg = URGENCY_STYLE[item.urgency] ?? URGENCY_STYLE.low;
 return (
 <div
 key={item.id}
 role="listitem"
 className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/60 transition-colors duration-150 group cursor-pointer"
 >
 <span className={`h-2 w-2 rounded-full shrink-0 ${urg.dot}`} aria-hidden="true" />
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-navy truncate">{item.type}</p>
 <p className="text-[10px] text-slate-500">{item.name} · {item.dept}</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-[10px] text-slate-600">{item.time}</span>
 <ArrowUpRight className={`h-3 w-3 ${urg.label} opacity-0 group-hover:opacity-100 transition-opacity`} aria-hidden="true" />
 </div>
 </div>
 );
 })}
 {approvals.length === 0 && (
 <div className="text-center py-8">
 <CheckCircle2 className="h-8 w-8 text-jade mx-auto mb-2" />
 <p className="text-xs text-slate-500">All caught up — no pending approvals</p>
 </div>
 )}
 </div>
 </SuspenseDashboardBoundary>
 )}
 </GlassCard>
 );
}

/* ── CommandCenterHeader ─────────────────────────────────────────────────────── */ function CommandCenterHeader() {
 const hour = new Date().getHours();
 const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

 return (
 <div className="flex items-start justify-between gap-4 mb-8">
 <div>
 <p className="section-label text-gold mb-2">Executive Command Center</p>
 <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-navy">
 {greeting}, Commander
 </h1>
 <p className="text-sm text-slate-500 mt-1">
 Platform overview · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
 </p>
 </div>
 <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full border border-jade/20 bg-jade/5">
 <span className="h-1.5 w-1.5 rounded-full bg-jade animate-pulse-live" aria-hidden="true" />
 <span className="text-xs font-bold text-jade">All Systems Operational</span>
 </div>
 </div>
 );
}

// ── ExecutiveCommandCenter ────────────────────────────────────────────────────
/**
 * ExecutiveCommandCenter — Phase 3C
 * Board-level intelligence dashboard wired to live React Query hooks.
 * Falls back gracefully when API is unavailable.
 */
export function ExecutiveCommandCenter() {
 const [activeTab, setActiveTab] = React.useState<'cockpit' | 'deel' | 'keka' | 'razorpay'>('cockpit');
 
 /* Keka Interactive State */ const [isPunchedIn, setIsPunchedIn] = React.useState(false);
 const [punchMessage, setPunchMessage] = React.useState<string | null>(null);

 /* Razorpay Interactive State */ const [payoutStatus, setPayoutStatus] = React.useState<'idle' | 'processing' | 'completed'>('idle');
 const [payoutProgress, setPayoutProgress] = React.useState(0);

 const triggerKekaPunch = () => {
 setIsPunchedIn(!isPunchedIn);
 const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
 setPunchMessage(`GPS Verified! Punched ${!isPunchedIn ? 'IN' : 'OUT'} successfully at ${now} (Geofence: Bengaluru HQ Gateway)`);
 setTimeout(() => setPunchMessage(null), 5000);
 };

 const triggerRazorpayPayout = () => {
 if (payoutStatus !== 'idle') return;
 setPayoutStatus('processing');
 setPayoutProgress(0);
 
 const interval = setInterval(() => {
 setPayoutProgress((prev) => {
 if (prev >= 100) {
 clearInterval(interval);
 setPayoutStatus('completed');
 return 100;
 }
 return prev + 20;
 });
 }, 400);
 };

 const resetRazorpayPayout = () => {
 setPayoutStatus('idle');
 setPayoutProgress(0);
 };

 return (
 <section aria-labelledby="command-center-heading">
 <h1 id="command-center-heading" className="sr-only">Executive Command Center</h1>

 <CommandCenterHeader />

 {/* 3D Glass Tab Bar Selector */}
 <div className="mb-8 p-1.5 rounded-2xl bg-[#091a30]/60 border border-slate-200 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-wrap gap-2">
 <button
 id="tab-cockpit"
 type="button"
 onClick={() => setActiveTab('cockpit')}
 className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
 activeTab === 'cockpit'
 ? 'bg-gradient-to-r from-amber to-ember text-navy shadow-[0_0_20px_rgba(242,170,59,0.3)] scale-[1.02]'
 : 'text-slate-500 hover:text-navy hover:bg-white/60'
 }`}
 >
 <BrainCircuit className="h-4 w-4" />
 Executive Cockpit
 </button>
 <button
 id="tab-deel"
 type="button"
 onClick={() => setActiveTab('deel')}
 className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
 activeTab === 'deel'
 ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-navy shadow-[0_0_20px_rgba(14,165,233,0.3)] scale-[1.02]'
 : 'text-slate-500 hover:text-navy hover:bg-white/60'
 }`}
 >
 <Globe className="h-4 w-4" />
 Deel Mesh
 </button>
 <button
 id="tab-keka"
 type="button"
 onClick={() => setActiveTab('keka')}
 className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
 activeTab === 'keka'
 ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-navy shadow-[0_0_20px_rgba(20,184,166,0.3)] scale-[1.02]'
 : 'text-slate-500 hover:text-navy hover:bg-white/60'
 }`}
 >
 <Fingerprint className="h-4 w-4" />
 Keka Core
 </button>
 <button
 id="tab-razorpay"
 type="button"
 onClick={() => setActiveTab('razorpay')}
 className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
 activeTab === 'razorpay'
 ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-navy shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-[1.02]'
 : 'text-slate-500 hover:text-navy hover:bg-white/60'
 }`}
 >
 <CreditCard className="h-4 w-4" />
 Razorpay Ledger
 </button>
 </div>

 {/* Tab Contents */}
 {activeTab === 'cockpit' && (
 <div className="space-y-6 animate-rise">
 {/* KPI strip — live data */}
 <LiveKpiStrip />

 {/* Charts row — live data */}
 <div className="grid lg:grid-cols-3 gap-5">
 <div className="lg:col-span-2">
 <LiveHeadcountChart />
 </div>
 <LiveDeptDonut />
 </div>

 {/* Cost breakdown — static */}
 <div>
 <BarTrendChart
 data={DEPT_COST}
 xKey="dept"
 series={[{ key: 'cost', label: 'Cost (₹L)', color: 'gold' }]}
 title="Department Cost Distribution"
 subtitle="April payroll cycle · in ₹ Lakhs"
 height={220}
 />
 </div>

 {/* Intelligence + ops row */}
 <div className="grid lg:grid-cols-4 gap-5">
 <div className="lg:col-span-1">
 <OrgHealthPanel />
 </div>
 <div className="lg:col-span-1">
 <PredictiveInsightsWidget />
 </div>
 <div className="lg:col-span-1">
 <LiveAiInsightFeed />
 </div>
 <div className="lg:col-span-1">
 <LivePendingApprovalsPanel />
 </div>
 </div>
 </div>
 )}

 {activeTab === 'deel' && (
 <div className="space-y-6 animate-rise">
 {/* Deel Global EOR Panel */}
 <div className="grid lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <GlassCard className="p-8 backdrop-blur-3xl bg-[#091a30]/40 border-white/[0.08] hover:border-sky-500/20 transition-all duration-300">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-xl font-bold text-navy flex items-center gap-2">
 <Globe className="text-sky-400" />
 Global Expansion & EOR Mesh
 </h3>
 <p className="text-slate-500 text-xs mt-1">Multi-country contractor management & compliant onboarding</p>
 </div>
 <button id="btn-create-contract" className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-navy font-bold text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-1">
 Create Global Contract <ArrowUpRight className="h-3.5 w-3.5" />
 </button>
 </div>

 {/* Active Global Contractors */}
 <div className="space-y-3">
 {[
 { name: 'John Doe', role: 'Lead Architect', country: 'United States', rate: '$8,500/mo', status: 'Active (USD)', compliance: '100% Compliant', color: 'text-emerald-400 bg-emerald-500/10' },
 { name: 'Elena Rostova', role: 'UI/UX Specialist', country: 'Germany', rate: '€5,200/mo', status: 'Pending Review', compliance: 'Missing W-8BEN', color: 'text-amber-400 bg-amber-500/10' },
 { name: 'David Smith', role: 'Product Manager', country: 'United Kingdom', rate: '£6,800/mo', status: 'Active (GBP)', compliance: '100% Compliant', color: 'text-emerald-400 bg-emerald-500/10' },
 { name: 'Rajesh Kumar', role: 'Senior Developer', country: 'India', rate: '₹1,80,000/mo', status: 'Active (INR)', compliance: '100% Compliant', color: 'text-emerald-400 bg-emerald-500/10' }
 ].map((contractor, i) => (
 <div key={i} className="p-4 rounded-2xl bg-white/60 border border-slate-200/60 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-100 transition-colors">
 <div>
 <p className="text-sm font-bold text-navy">{contractor.name}</p>
 <p className="text-xs text-slate-500 mt-0.5">{contractor.role} · <span className="text-sky-300">{contractor.country}</span></p>
 </div>
 <div className="text-right">
 <p className="text-sm font-black text-navy">{contractor.rate}</p>
 <p className="text-[10px] text-slate-500 mt-0.5">{contractor.status}</p>
 </div>
 <div>
 <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${contractor.color}`}>
 {contractor.compliance}
 </span>
 </div>
 </div>
 ))}
 </div>
 </GlassCard>
 </div>

 <div className="space-y-6">
 <GlassCard className="p-6">
 <h4 className="text-sm font-black text-navy flex items-center gap-2 mb-4">
 <ShieldCheck className="text-sky-400" />
 Global Compliance Check
 </h4>
 <div className="space-y-4">
 {[
 { label: 'W-8BEN / W-9 Forms Collection', status: 'Automated on sign-up', done: true },
 { label: 'Local Labor Law Alignment', status: 'Verified in 150+ countries', done: true },
 { label: 'EOR Entity Setup Routing', status: 'Akul Dravin Sovereign Node', done: true },
 { label: 'IP Assignment Compliant contracts', status: 'Guaranteed transfer clauses', done: true }
 ].map((check, i) => (
 <div key={i} className="flex gap-3">
 <CheckCircle2 className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
 <div>
 <p className="text-xs font-bold text-navy">{check.label}</p>
 <p className="text-[10px] text-slate-500 mt-0.5">{check.status}</p>
 </div>
 </div>
 ))}
 </div>
 </GlassCard>

 <GlassCard className="p-6 bg-gradient-to-br from-indigo-900/20 to-slate-900 border-indigo-500/20">
 <h4 className="text-sm font-black text-sky-400 flex items-center gap-2 mb-2">
 <Sparkles className="h-4 w-4 animate-pulse" />
 Deel EOR Coverage
 </h4>
 <p className="text-xs text-slate-600 leading-relaxed">
 Hire anyone, anywhere, in minutes. Akul Dravin combines legal local entities with autonomous contract templates.
 </p>
 <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
 <span>Countries Supported</span>
 <span className="font-bold text-navy">150+</span>
 </div>
 <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
 <span>Standard Setup ETA</span>
 <span className="font-bold text-navy">&lt; 48 hours</span>
 </div>
 </GlassCard>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'keka' && (
 <div className="space-y-6 animate-rise">
 {/* Keka Core Panel */}
 <div className="grid lg:grid-cols-3 gap-6">
 <div className="lg:col-span-1 space-y-6">
 {/* Punch-In Self Service Card */}
 <GlassCard className="p-8 backdrop-blur-3xl bg-[#091a30]/40 border-white/[0.08] text-center hover:border-emerald-500/20 transition-all duration-300">
 <Fingerprint className="h-16 w-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
 <h3 className="text-lg font-black text-navy">Interactive Shift Portal</h3>
 <p className="text-slate-500 text-xs mt-1">General Shift: 09:00 AM - 06:00 PM</p>
 
 <div className="my-6">
 <span className="text-3xl font-mono text-navy block">10:36 AM</span>
 <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 block">GPS: Bengaluru, Karnataka</span>
 </div>

 <button
 id="btn-keka-punch"
 type="button"
 onClick={triggerKekaPunch}
 className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 ${
 isPunchedIn
 ? 'bg-gradient-to-r from-rose-500 to-red-600 text-navy shadow-[0_0_20px_rgba(239,68,68,0.3)]'
 : 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.3)]'
 }`}
 >
 {isPunchedIn ? 'Punch Out Workday' : 'Punch In Workday'}
 </button>

 {punchMessage && (
 <div className="mt-4 p-3 rounded-xl bg-white/60 border border-slate-200 text-emerald-300 text-xs font-semibold animate-rise leading-relaxed">
 {punchMessage}
 </div>
 )}
 </GlassCard>
 </div>

 <div className="lg:col-span-2 space-y-6">
 <GlassCard className="p-8 backdrop-blur-3xl bg-[#091a30]/40 border-white/[0.08]">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-xl font-bold text-navy flex items-center gap-2">
 <Calendar className="text-emerald-400" />
 Keka Core Workday Summary
 </h3>
 <p className="text-slate-500 text-xs mt-1">Shift logs, leaves ledger, and compliance dashboard</p>
 </div>
 </div>

 <div className="grid sm:grid-cols-3 gap-4 mb-6">
 <div className="p-4 rounded-2xl bg-white/60 border border-slate-200/60">
 <p className="text-slate-500 text-[10px] uppercase font-black">Present Today</p>
 <p className="text-2xl font-bold text-emerald-400 mt-1">942 <span className="text-xs text-slate-500">/ 1247</span></p>
 </div>
 <div className="p-4 rounded-2xl bg-white/60 border border-slate-200/60">
 <p className="text-slate-500 text-[10px] uppercase font-black">Late Arrivals</p>
 <p className="text-2xl font-bold text-amber-400 mt-1">18 <span className="text-xs text-slate-500">within 15m</span></p>
 </div>
 <div className="p-4 rounded-2xl bg-white/60 border border-slate-200/60">
 <p className="text-slate-500 text-[10px] uppercase font-black">On Paid Leave</p>
 <p className="text-2xl font-bold text-sky-400 mt-1">5 <span className="text-xs text-slate-500">approved</span></p>
 </div>
 </div>

 {/* Shift Schedule Table */}
 <h4 className="text-sm font-bold text-navy mb-3">Shift & Geofencing Matrix</h4>
 <div className="overflow-x-auto">
 <table className="w-full text-xs text-slate-600">
 <thead>
 <tr className="border-b border-slate-200/60">
 <th className="text-left font-black pb-2 text-slate-500">DEPARTMENT</th>
 <th className="text-left font-black pb-2 text-slate-500">SHIFT RULE</th>
 <th className="text-left font-black pb-2 text-slate-500">GEOFENCE RADIUS</th>
 <th className="text-left font-black pb-2 text-slate-500">COMPLIANCE STATUS</th>
 </tr>
 </thead>
 <tbody>
 {[
 { dept: 'Engineering', shift: 'Flex Shift (9h)', geofence: 'Bengaluru HQ (500m)', status: 'Optimal' },
 { dept: 'Sales & Marketing', shift: 'Field Shift (9h)', geofence: 'GPS Tracking Active', status: 'Optimal' },
 { dept: 'Operations', shift: 'Shift Rotation A/B', geofence: 'Kiosk Geofenced', status: 'Optimal' }
 ].map((item, i) => (
 <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
 <td className="py-3 font-bold text-navy">{item.dept}</td>
 <td className="py-3">{item.shift}</td>
 <td className="py-3 text-emerald-400 font-bold">{item.geofence}</td>
 <td className="py-3 text-emerald-400 font-black">{item.status}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </GlassCard>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'razorpay' && (
 <div className="space-y-6 animate-rise">
 {/* Razorpay Fintech Payout Panel */}
 <div className="grid lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <GlassCard className="p-8 backdrop-blur-3xl bg-[#091a30]/40 border-white/[0.08] hover:border-blue-500/20 transition-all duration-300">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h3 className="text-xl font-bold text-navy flex items-center gap-2">
 <CreditCard className="text-blue-400" />
 Razorpay Direct Fintech Ledger
 </h3>
 <p className="text-slate-500 text-xs mt-1">One-click auto-disbursements & Indian tax slab compliance</p>
 </div>
 <div className="flex gap-2">
 {payoutStatus === 'completed' && (
 <button
 type="button"
 onClick={resetRazorpayPayout}
 className="px-4 py-2 rounded-full border border-slate-200 hover:bg-white/60 text-xs text-slate-600 font-bold transition-colors"
 >
 Reset Status
 </button>
 )}
 <button
 id="btn-razorpay-payout"
 type="button"
 disabled={payoutStatus === 'processing'}
 onClick={triggerRazorpayPayout}
 className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-navy font-bold text-xs shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 {payoutStatus === 'processing' ? 'Processing Payouts...' : payoutStatus === 'completed' ? 'Disbursed ✓' : 'Trigger Auto-Payout Cycle'}
 <ArrowRight className="h-3.5 w-3.5" />
 </button>
 </div>
 </div>

 {/* Progress bar for payout */}
 {payoutStatus === 'processing' && (
 <div className="mb-6 p-4 rounded-xl bg-white/60 border border-slate-200/60 space-y-2 animate-rise">
 <div className="flex justify-between text-xs text-blue-300">
 <span>Executing direct HDFC/ICICI bank gateway transfer...</span>
 <span className="font-bold">{payoutProgress}%</span>
 </div>
 <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden">
 <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${payoutProgress}%` }} />
 </div>
 </div>
 )}

 {payoutStatus === 'completed' && (
 <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold animate-rise leading-relaxed">
 Success! Direct bank transfer of ₹3.91 Cr disbursed successfully to 1,247 salary accounts. SMS/Payslips dispatched.
 </div>
 )}

 {/* Fintech Payout Queue */}
 <h4 className="text-sm font-bold text-navy mb-3">Instant Disbursement Queue</h4>
 <div className="space-y-3">
 {[
 { item: 'Salary Batch (HDFC Corporate Route)', amount: '₹3,10,42,800', type: 'Instant Bank Payout', status: payoutStatus === 'completed' ? 'Disbursed' : payoutStatus === 'processing' ? 'Processing' : 'Approved', color: payoutStatus === 'completed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : payoutStatus === 'processing' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5 animate-pulse' : 'text-slate-500 border-slate-200/60 bg-white/60' },
 { item: 'Contractor Invoices (ICICI Bank Direct)', amount: '₹81,20,000', type: 'Fast Settlement', status: payoutStatus === 'completed' ? 'Disbursed' : payoutStatus === 'processing' ? 'Processing' : 'Approved', color: payoutStatus === 'completed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : payoutStatus === 'processing' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5 animate-pulse' : 'text-slate-500 border-slate-200/60 bg-white/60' },
 { item: 'Statutory Taxes (PF / ESI / TDS Pool)', amount: '₹42,65,400', type: 'Compliance Escrow', status: payoutStatus === 'completed' ? 'Deposited' : 'Pending Approval', color: payoutStatus === 'completed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5' }
 ].map((queue, i) => (
 <div key={i} className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${queue.color}`}>
 <div>
 <p className="text-xs font-bold text-navy">{queue.item}</p>
 <p className="text-[10px] text-slate-500 mt-0.5">{queue.type}</p>
 </div>
 <div className="text-right">
 <p className="text-sm font-black text-navy">{queue.amount}</p>
 <span className="text-[10px] uppercase tracking-wider font-bold block mt-0.5">{queue.status}</span>
 </div>
 </div>
 ))}
 </div>
 </GlassCard>
 </div>

 <div className="space-y-6">
 <GlassCard className="p-6">
 <h4 className="text-sm font-black text-navy flex items-center gap-2 mb-4">
 <Landmark className="text-blue-400" />
 Indian statutory pool
 </h4>
 <div className="space-y-3">
 {[
 { label: 'Employee Provident Fund (EPF)', rule: '12% of Basic capped at ₹15,000/mo' },
 { label: 'Employee State Insurance (ESIC)', rule: '0.75% of Gross if &lt; ₹21,000/mo' },
 { label: 'Professional Tax (PT)', rule: '₹200/mo slab auto-applied' },
 { label: 'Tax Deducted at Source (TDS)', rule: 'New slab regime annual apportionment' }
 ].map((rule, i) => (
 <div key={i} className="p-3 rounded-xl bg-white/60 border border-slate-200/60">
 <p className="text-xs font-bold text-navy">{rule.label}</p>
 <p className="text-[10px] text-slate-500 mt-1">{rule.rule}</p>
 </div>
 ))}
 </div>
 </GlassCard>

 <GlassCard className="p-6 bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/20">
 <h4 className="text-sm font-black text-blue-400 flex items-center gap-2 mb-2">
 <Sparkles className="h-4 w-4 animate-pulse" />
 Fintech Autopilot
 </h4>
 <p className="text-xs text-slate-600 leading-relaxed">
 Autopilot mode reconciles attendance with payroll hourly, calculating tax deductions live so payouts are immediate.
 </p>
 <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
 <span>Connected Bank status</span>
 <span className="font-bold text-emerald-400">CONNECTED</span>
 </div>
 <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
 <span>Available Funds</span>
 <span className="font-bold text-navy">₹6.20 Cr</span>
 </div>
 </GlassCard>
 </div>
 </div>
 </div>
 )}

 {/* Platform status footer */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: 0.2 }}
 className="mt-6 surface-raised border-subtle rounded-2xl px-6 py-4 flex flex-wrap justify-between gap-4 bg-[#091a30]/40 border-white/[0.08]"
 role="status"
 aria-label="Platform status"
 >
 {[
 { icon: Building2, label: '47 Modules Active', color: 'text-slate-500' },
 { icon: ShieldCheck, label: 'SOC 2 Compliant', color: 'text-jade' },
 { icon: BarChart3, label: '99.99% Uptime (30d)', color: 'text-aqua' },
 { icon: Zap, label: 'AI Copilot Online', color: 'text-ember' },
 ].map((item) => (
 <div key={item.label} className="flex items-center gap-2">
 <item.icon className={`h-4 w-4 ${item.color}`} aria-hidden="true" />
 <span className="text-xs font-semibold text-slate-500">{item.label}</span>
 </div>
 ))}
 </motion.div>
 </section>
 );
}
