'use client';

import { useEffect, useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
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
import { canPerformAction } from '@/utils/action-permissions';
import { ROLE_DESCRIPTION, toRoleLabel, toSafePlatformRole } from '@/utils/platform-config';

export function RoleDashboardView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const setActiveRole = useUIStore((state) => state.setActiveRole);
  const safeRole = toSafePlatformRole(activeRole);
  const model = roleDashboardData[safeRole];

  const canBookDemo = canPerformAction(safeRole, 'dashboard.book-demo');
  const canExportDashboard = canPerformAction(safeRole, 'dashboard.export');

  const { data, isLive, loading, error } = useApiResource({
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

  return (
    <div className="space-y-5">
      <PageTitle
        title={model.heading}
        description={`${toRoleLabel(safeRole)} view: ${ROLE_DESCRIPTION[safeRole]}`}
        actions={
          <div className="flex flex-col items-start gap-2">
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
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                title={canExportDashboard ? 'Export Dashboard' : 'Your role cannot export dashboard data.'}
              >
                Export Dashboard
              </button>
            </div>
            {!canBookDemo || !canExportDashboard ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">Some actions are restricted by your current role policy.</p>
            ) : null}
          </div>
        }
      />

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
        error={error}
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

      <InsightListCard title="AI Insights" items={liveInsights} />
    </div>
  );
}
