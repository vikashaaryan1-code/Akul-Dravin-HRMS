'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { analyticsBreakdown, monthlyPayrollTrend } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';

const employeeAnalytics = [
  { name: 'Q1', value: 71 },
  { name: 'Q2', value: 76 },
  { name: 'Q3', value: 84 },
  { name: 'Q4', value: 89 },
];

const recruitmentAnalytics = [
  { name: 'Applied', value: 940 },
  { name: 'Shortlisted', value: 380 },
  { name: 'Interviewed', value: 192 },
  { name: 'Offers', value: 87 },
  { name: 'Hired', value: 56 },
];

export function AnalyticsModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [dashboard, events, salesSummary] = await Promise.all([
        platformApi.getAnalyticsDashboard(),
        platformApi.getAnalyticsEvents(),
        platformApi.getSalesSummary(),
      ]);

      return {
        dashboard,
        events,
        salesSummary,
      };
    },
    fallback: {
      dashboard: {
        totalEvents: 0,
        recentModules: [],
      },
      events: [],
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

  const aiPredictions = useMemo(
    () => [
      { name: 'Retention', value: 91 },
      { name: 'Hiring Success', value: 87 },
      { name: 'Payroll Accuracy', value: 96 },
      { name: 'Performance Growth', value: 84 },
      { name: 'Sales Target', value: Number(data.salesSummary.targetAchievementPercent.toFixed(0)) || 82 },
    ],
    [data.salesSummary.targetAchievementPercent],
  );

  const moduleMix = useMemo(() => {
    if (!isLive || data.dashboard.recentModules.length === 0) {
      return analyticsBreakdown;
    }

    const counts = new Map<string, number>();
    data.events.forEach((event) => {
      counts.set(event.module, (counts.get(event.module) ?? 0) + 1);
    });

    const rows = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    return rows.length > 0 ? rows : analyticsBreakdown;
  }, [data.dashboard.recentModules.length, data.events, isLive]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Analytics Dashboard"
        description="Employee analytics, payroll analytics, recruitment analytics, and AI prediction intelligence."
      />

      <ModuleLinksBar
        links={[
          { label: 'Dashboard', href: `/dashboard?role=${activeRole}` },
          { label: 'Sales', href: `/sales?role=${activeRole}` },
          { label: 'Recruitment', href: `/recruitment?role=${activeRole}` },
          { label: 'Automation', href: `/automation?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <TrendAreaChart title="Employee Analytics" data={employeeAnalytics} color="#0F8B8D" />
        <TrendAreaChart title="Payroll Analytics" data={monthlyPayrollTrend} color="#E85A2A" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StackedBarChart title="Recruitment Analytics Funnel" data={recruitmentAnalytics} mode="single" />
        <DonutChartCard title="Analytics Category Mix" data={moduleMix} />
      </section>

      <section>
        <StackedBarChart title="AI Prediction Scores" data={aiPredictions} mode="single" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Analytics Events</p>
          <p className="mt-2 text-2xl font-semibold">{data.dashboard.totalEvents || 89}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Recent Modules</p>
          <p className="mt-2 text-2xl font-semibold">{data.dashboard.recentModules.length || 6}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Sales Deal Value</p>
          <p className="mt-2 text-2xl font-semibold">{(data.salesSummary.totalDealValue / 1000).toFixed(0)}K</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">AI Predictions</p>
          <p className="mt-2 text-2xl font-semibold">{isLive ? 'Live' : 'Simulated'}</p>
        </GlassCard>
      </section>
    </div>
  );
}
