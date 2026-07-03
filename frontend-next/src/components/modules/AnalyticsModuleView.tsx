'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { platformApi, WorkforceKpiApiRecord, RecruitmentKpiApiRecord, RevenueKpiApiRecord } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';

/* ── Fallbacks ────────────────────────────────────────────────────────────── */ const WORKFORCE_FALLBACK: WorkforceKpiApiRecord = {
 headcount: { total: 284, active: 261, onLeave: 14, inactive: 9, byDepartment: [], byEmploymentType: [] },
 attrition: { attritionRate: 12.4, exits: 35, avgHeadcount: 282, turnoverRisk: 'MEDIUM', voluntaryExits: 28, involuntaryExits: 7 },
 tenure: { lessThan90Days: 22, threeToTwelveMonths: 51, oneToThreeYears: 112, threeToFiveYears: 74, moreThanFiveYears: 25, avgTenureDays: 712 },
 newHiresThisMonth: 8,
 offboardingsThisMonth: 3,
 openPositions: 17,
 avgSalary: 68500,
 salaryBudget: 19502000,
};

const RECRUITMENT_FALLBACK: RecruitmentKpiApiRecord = {
 funnel: { totalApplications: 940, totalHired: 56, totalOffered: 87, totalInterviewed: 192, conversionRates: { overallConversion: 5.9, offerToHire: 64.4 } },
 timeToHire: { avgDaysToHire: 28, medianDaysToHire: 24, p90DaysToHire: 48 },
 pipeline: { bottleneckStage: 'interview', stageBreakdown: [
 { stage: 'applied', count: 940, dropoffRate: 0 },
 { stage: 'screened', count: 560, dropoffRate: 40.4 },
 { stage: 'shortlisted', count: 280, dropoffRate: 50 },
 { stage: 'interview', count: 192, dropoffRate: 31.4 },
 { stage: 'offer', count: 87, dropoffRate: 54.7 },
 { stage: 'hired', count: 56, dropoffRate: 35.6 },
 ]},
};

const REVENUE_FALLBACK: RevenueKpiApiRecord = {
 snapshot: { mrr: 3420000, arr: 41040000, arpu: 85500, totalPaidTenants: 40, trialTenants: 7 },
 churn: { churnRate: 2.8, churned: 3, netRevenueRetentionRate: 97.2 },
 planDistribution: [
 { planName: 'enterprise', count: 12, mrr: 1980000, percentage: 30 },
 { planName: 'professional', count: 22, mrr: 1100000, percentage: 55 },
 { planName: 'starter', count: 6, mrr: 340000, percentage: 15 },
 ],
 growthTrend: [],
};

/* ── KPI Card ─────────────────────────────────────────────────────────────── */ function KpiCard({
 label, value, sub, accent = '#6366F1',
}: { label: string; value: string | number; sub?: string; accent?: string }) {
 return (
 <GlassCard>
 <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-1">{label}</p>
 <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
 {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
 </GlassCard>
 );
}

/* ── Risk Badge ───────────────────────────────────────────────────────────── */ function RiskBadge({ risk }: { risk: string }) {
 const map: Record<string, string> = {
 LOW: 'bg-emerald-500/15 text-emerald-400',
 MEDIUM: 'bg-slate-50mber-500/15 text-amber-400',
 HIGH: 'bg-orange-500/15 text-orange-400',
 CRITICAL: 'bg-red-500/15 text-red-400',
 };
 return (
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${map[risk] ?? map.LOW}`}>
 {risk}
 </span>
 );
}

/* ── Section Header ───────────────────────────────────────────────────────── */ function SectionHeader({ title, badge }: { title: string; badge?: string }) {
 return (
 <div className="flex items-center gap-3 mb-3">
 <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h2>
 {badge && (
 <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-full font-medium">
 {badge}
 </span>
 )}
 </div>
 );
}

/* ── Funnel Bar ───────────────────────────────────────────────────────────── */ function FunnelBar({ label, count, max }: { label: string; count: number; max: number }) {
 const pct = max === 0 ? 0 : Math.round((count / max) * 100);
 return (
 <div className="flex items-center gap-3">
 <span className="w-24 text-xs text-slate-500 capitalize">{label}</span>
 <div className="flex-1 h-2 bg-slate-700/60 rounded-full overflow-hidden">
 <div
 className="h-full rounded-full transition-all duration-700"
 style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }}
 />
 </div>
 <span className="w-10 text-right text-xs font-semibold text-slate-600">{count}</span>
 </div>
 );
}

/* ── Main View ────────────────────────────────────────────────────────────── */ export function AnalyticsModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);

 /* ── Workforce KPIs */ const { data: workforce, isLive: wLive, loading: wLoading } = useApiResource({
 loader: () => platformApi.getWorkforceKpi(),
 fallback: WORKFORCE_FALLBACK,
 });

 /* ── Recruitment KPIs */ const { data: recruitment, isLive: rLive, loading: rLoading } = useApiResource({
 loader: () => platformApi.getRecruitmentKpi(),
 fallback: RECRUITMENT_FALLBACK,
 });

 /* ── Revenue KPIs */ const { data: revenue, isLive: revLive, loading: revLoading } = useApiResource({
 loader: () => platformApi.getRevenueKpi(),
 fallback: REVENUE_FALLBACK,
 });

 const isLive = wLive || rLive || revLive;
 const loading = wLoading || rLoading || revLoading;

 /* ── Tenure distribution chart data */ const tenureData = useMemo(() => [
 { name: '<90d', value: workforce.tenure.lessThan90Days },
 { name: '3-12m', value: workforce.tenure.threeToTwelveMonths },
 { name: '1-3y', value: workforce.tenure.oneToThreeYears },
 { name: '3-5y', value: workforce.tenure.threeToFiveYears },
 { name: '5y+', value: workforce.tenure.moreThanFiveYears },
 ], [workforce.tenure]);

 /* ── Revenue growth trend chart data */ const revenueGrowthData = useMemo(() => {
 if (revenue.growthTrend.length > 0) {
 return revenue.growthTrend.map((r) => ({ name: r.month, value: r.netMrr }));
 }
 /* Simulated 12-month MRR trend */ return [
 { name: 'Jun', value: 2800000 }, { name: 'Jul', value: 2940000 },
 { name: 'Aug', value: 3050000 }, { name: 'Sep', value: 3120000 },
 { name: 'Oct', value: 3200000 }, { name: 'Nov', value: 3310000 },
 { name: 'Dec', value: 3290000 }, { name: 'Jan', value: 3380000 },
 { name: 'Feb', value: 3420000 }, { name: 'Mar', value: 3510000 },
 { name: 'Apr', value: 3490000 }, { name: 'May', value: 3420000 },
 ];
 }, [revenue.growthTrend]);

 /* ── Plan distribution donut data */ const planDonutData = useMemo(
 () => revenue.planDistribution.map((p) => ({ name: p.planName, value: p.count })),
 [revenue.planDistribution],
 );

 // ── Headcount by employment type donut
 const empTypeData = useMemo(
 () => workforce.headcount.byEmploymentType.length > 0
 ? workforce.headcount.byEmploymentType.map((e) => ({ name: e.type, value: e.count }))
 : [
 { name: 'full_time', value: 218 },
 { name: 'part_time', value: 34 },
 { name: 'contractor', value: 22 },
 { name: 'intern', value: 10 },
 ],
 [workforce.headcount.byEmploymentType],
 );

 const fmt = (n: number) =>
 n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(1)}Cr`
 : n >= 100_000 ? `₹${(n / 100_000).toFixed(1)}L`
 : n >= 1_000 ? `₹${(n / 1_000).toFixed(0)}K`
 : `₹${n}`;

 return (
 <div className="space-y-6">
 <PageTitle
 title="Analytics Intelligence"
 description="Real-time workforce, recruitment pipeline, and revenue analytics — powered by the Akul Dravin analytics engine."
 />

 <ModuleLinksBar
 links={[
 { label: 'Dashboard', href: `/dashboard?role=${activeRole}` },
 { label: 'Employees', href: `/employees?role=${activeRole}` },
 { label: 'Recruitment', href: `/recruitment?role=${activeRole}` },
 { label: 'Billing', href: `/billing?role=${activeRole}` },
 { label: 'AI Hub', href: `/ai-hub?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 />

 {/* ── WORKFORCE ANALYTICS ───────────────────────────── */}
 <section>
 <SectionHeader title="Workforce Analytics" badge={`${workforce.headcount.active} Active`} />
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
 <KpiCard label="Total Headcount" value={workforce.headcount.total} sub={`${workforce.headcount.active} active`} accent="#6366F1" />
 <KpiCard label="On Leave" value={workforce.headcount.onLeave} sub="Currently away" accent="#8B5CF6" />
 <KpiCard label="New Hires (Month)" value={workforce.newHiresThisMonth} sub={`${workforce.offboardingsThisMonth} exits`} accent="#10B981" />
 <KpiCard label="Open Positions" value={workforce.openPositions} sub="Published JDs" accent="#F59E0B" />
 </div>

 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
 <KpiCard label="Attrition Rate" value={`${workforce.attrition.attritionRate}%`} sub={<RiskBadge risk={workforce.attrition.turnoverRisk} /> as any} accent="#EF4444" />
 <KpiCard label="Voluntary Exits" value={workforce.attrition.voluntaryExits} sub="Last 12 months" accent="#F97316" />
 <KpiCard label="Avg Salary" value={fmt(workforce.avgSalary)} sub="Monthly CTC" accent="#06B6D4" />
 <KpiCard label="Salary Budget" value={fmt(workforce.salaryBudget)} sub="Total payroll/mo" accent="#A855F7" />
 </div>

 <div className="grid gap-4 xl:grid-cols-2">
 <StackedBarChart title="Tenure Distribution" data={tenureData} mode="single" />
 <DonutChartCard title="Employment Type Mix" data={empTypeData} />
 </div>
 </section>

 {/* ── RECRUITMENT ANALYTICS ────────────────────────── */}
 <section>
 <SectionHeader title="Recruitment Pipeline" badge={`Avg ${recruitment.timeToHire.avgDaysToHire}d to hire`} />
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
 <KpiCard label="Total Applications" value={recruitment.funnel.totalApplications} sub="Last 90 days" accent="#6366F1" />
 <KpiCard label="Hired" value={recruitment.funnel.totalHired} sub={`${recruitment.funnel.conversionRates.overallConversion}% conversion`} accent="#10B981" />
 <KpiCard label="Avg Time to Hire" value={`${recruitment.timeToHire.avgDaysToHire}d`} sub={`Median ${recruitment.timeToHire.medianDaysToHire}d`} accent="#F59E0B" />
 <KpiCard label="Offer Accept Rate" value={`${recruitment.funnel.conversionRates.offerToHire}%`} sub="Offer → Hire" accent="#8B5CF6" />
 </div>

 <GlassCard>
 <p className="text-xs uppercase tracking-[0.13em] text-slate-500 mb-4">
 Pipeline Funnel
 <span className="ml-2 text-[10px] text-orange-400 font-medium">
 Bottleneck: {recruitment.pipeline.bottleneckStage}
 </span>
 </p>
 <div className="space-y-2.5">
 {recruitment.pipeline.stageBreakdown.map((s) => (
 <FunnelBar
 key={s.stage}
 label={s.stage}
 count={s.count}
 max={recruitment.funnel.totalApplications}
 />
 ))}
 </div>
 </GlassCard>
 </section>

 {/* ── REVENUE ANALYTICS ────────────────────────────── */}
 <section>
 <SectionHeader title="Revenue Intelligence" badge="Platform-wide" />
 <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
 <KpiCard label="MRR" value={fmt(revenue.snapshot.mrr)} sub="Monthly Recurring" accent="#10B981" />
 <KpiCard label="ARR" value={fmt(revenue.snapshot.arr)} sub="Annual Run Rate" accent="#6366F1" />
 <KpiCard label="ARPU" value={fmt(revenue.snapshot.arpu)} sub="Per tenant/month" accent="#8B5CF6" />
 <KpiCard label="Paid Tenants" value={revenue.snapshot.totalPaidTenants} sub={`+ ${revenue.snapshot.trialTenants} trials`} accent="#F59E0B" />
 </div>
 <div className="grid gap-3 sm:grid-cols-3 mb-4">
 <KpiCard label="Churn Rate" value={`${revenue.churn.churnRate}%`} sub="Last 30 days" accent="#EF4444" />
 <KpiCard label="NRR" value={`${revenue.churn.netRevenueRetentionRate.toFixed(1)}%`} sub="Net Revenue Retention" accent="#10B981" />
 <KpiCard label="Churned" value={revenue.churn.churned} sub="Subscriptions" accent="#F97316" />
 </div>

 <div className="grid gap-4 xl:grid-cols-2">
 <TrendAreaChart title="MRR Growth Trend" data={revenueGrowthData} color="#10B981" />
 <DonutChartCard title="Plan Distribution" data={planDonutData} />
 </div>
 </section>
 </div>
 );
}
