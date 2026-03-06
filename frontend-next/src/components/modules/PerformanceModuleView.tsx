'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/modules/MetricCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';
import { performanceScoreRecords, teamLeaderboardRecords, workHourTrend } from '@/services/platform-data';
import { useUIStore } from '@/store/ui-store';

export function PerformanceModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [scores, leaderboard] = await Promise.all([
        platformApi.getPerformanceScores(),
        platformApi.getTeamLeaderboard(),
      ]);

      return {
        scores,
        leaderboard,
      };
    },
    fallback: {
      scores: performanceScoreRecords,
      leaderboard: teamLeaderboardRecords,
    },
  });

  const metrics = useMemo(() => {
    const averageScore = data.scores.reduce((sum, item) => sum + Number(item.performanceScore), 0) / Math.max(data.scores.length, 1);
    const averageTarget = data.scores.reduce((sum, item) => sum + Number(item.targetAchievement), 0) / Math.max(data.scores.length, 1);
    const topAi = data.scores.reduce((max, item) => Math.max(max, Number(item.aiScore)), 0);

    return [
      {
        id: 'pf1',
        label: 'Average Performance',
        value: `${averageScore.toFixed(1)} / 100`,
        trend: '+3.8 points this cycle',
        trendDirection: 'up' as const,
      },
      {
        id: 'pf2',
        label: 'Target Achievement',
        value: `${averageTarget.toFixed(1)}%`,
        trend: '+4.2% month-on-month',
        trendDirection: 'up' as const,
      },
      {
        id: 'pf3',
        label: 'Top AI Score',
        value: `${topAi}`,
        trend: 'High consistency band',
        trendDirection: 'up' as const,
      },
      {
        id: 'pf4',
        label: 'Leaderboard Teams',
        value: String(data.leaderboard.length),
        trend: isLive ? 'Realtime ranking' : 'Snapshot ranking',
        trendDirection: 'neutral' as const,
      },
    ];
  }, [data.leaderboard.length, data.scores, isLive]);

  const leaderboardBars = useMemo(
    () => data.leaderboard.map((item) => ({ name: item.teamName, value: Number(item.score) })),
    [data.leaderboard],
  );

  const aiTrend = useMemo(
    () => data.scores.map((item, index) => ({ name: `P${index + 1}`, value: Number(item.aiScore) })),
    [data.scores],
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Performance Management"
        description="Evaluate task completion, target performance, team comparison leaderboard, and AI-driven workforce scorecards."
      />

      <ModuleLinksBar
        links={[
          { label: 'Tracking', href: `/tracking?role=${activeRole}` },
          { label: 'Tasks', href: `/tasks?role=${activeRole}` },
          { label: 'Sales', href: `/sales?role=${activeRole}` },
          { label: 'Analytics', href: `/analytics?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TrendAreaChart title="AI Performance Trend" data={aiTrend.length > 0 ? aiTrend : workHourTrend} color="#E85A2A" />
        <StackedBarChart title="Team Leaderboard Score" data={leaderboardBars} mode="single" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Performance Scorecards</p>
          <SimpleTable
            columns={[
              { key: 'employeeName', label: 'Employee' },
              {
                key: 'performanceScore',
                label: 'Performance',
                render: (row) => `${row.performanceScore}`,
              },
              {
                key: 'targetAchievement',
                label: 'Target %',
                render: (row) => `${row.targetAchievement}%`,
              },
              { key: 'tasksDelivered', label: 'Tasks Delivered' },
              { key: 'aiScore', label: 'AI Score' },
            ]}
            rows={data.scores}
          />
        </GlassCard>

        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Team Comparison Leaderboard</p>
          <SimpleTable
            columns={[
              { key: 'teamName', label: 'Team' },
              { key: 'score', label: 'Score' },
              { key: 'completedTasks', label: 'Completed Tasks' },
              {
                key: 'targetAchieved',
                label: 'Target %',
                render: (row) => `${row.targetAchieved}%`,
              },
            ]}
            rows={data.leaderboard}
          />
        </GlassCard>
      </section>
    </div>
  );
}
