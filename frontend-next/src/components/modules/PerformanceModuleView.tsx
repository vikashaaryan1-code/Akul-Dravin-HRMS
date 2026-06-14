'use client';

import { useMemo, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { StatusPill } from '@/components/ui/StatusPill';
import { SkeletonCard, SkeletonTable } from '@/components/system/Suspense';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';
import { performanceScoreRecords, teamLeaderboardRecords, workHourTrend } from '@/services/platform-data';
import { useUIStore } from '@/store/ui-store';
import {
  Star, Target, TrendingUp, Award, ChevronRight,
  Plus, RefreshCw, Users, CheckCircle2, AlertTriangle, BarChart3,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type ReviewStatus = 'completed' | 'in-progress' | 'pending' | 'overdue';
type ReviewCycle = {
  id: string;
  name: string;
  period: string;
  status: ReviewStatus;
  participants: number;
  completionRate: number;
  avgScore: number;
};

// ── Mock review cycles (until API is available) ───────────────────────────────
const MOCK_CYCLES: ReviewCycle[] = [
  { id: 'Q1-2026', name: 'Q1 2026 Performance Review', period: 'Jan – Mar 2026', status: 'completed',   participants: 142, completionRate: 97, avgScore: 83 },
  { id: 'Q2-2026', name: 'Q2 2026 Performance Review', period: 'Apr – Jun 2026', status: 'in-progress', participants: 148, completionRate: 61, avgScore: 79 },
  { id: 'MID-2026', name: 'Mid-Year Goals Review',     period: 'Jun 2026',       status: 'pending',     participants: 148, completionRate: 0,  avgScore: 0  },
];

const STATUS_STYLE: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  completed:   { label: 'Completed',   color: 'text-jade',  bg: 'bg-jade/10'  },
  'in-progress': { label: 'In Progress', color: 'text-gold',  bg: 'bg-gold/10'  },
  pending:     { label: 'Pending',     color: 'text-slate-400', bg: 'bg-white/5' },
  overdue:     { label: 'Overdue',     color: 'text-ember', bg: 'bg-ember/10' },
};

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ score, max = 100 }: { score: number; max?: number }) {
  const normalized = Math.round((score / max) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < normalized ? 'fill-gold text-gold' : 'text-slate-700'}`}
        />
      ))}
      <span className="ml-1.5 text-xs font-bold text-slate-300">{score}</span>
    </div>
  );
}

// ── Score Progress Bar ────────────────────────────────────────────────────────
function ScoreBar({ value, max = 100, color = 'bg-aqua' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      <span className="text-xs font-bold text-slate-300 w-8 text-right">{value}%</span>
    </div>
  );
}

// ── Review Cycle Card ─────────────────────────────────────────────────────────
function ReviewCycleCard({ cycle }: { cycle: ReviewCycle }) {
  const style = STATUS_STYLE[cycle.status];
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{cycle.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{cycle.period}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.color} ${style.bg}`}>
          {style.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Participants</p>
          <p className="text-sm font-bold text-white mt-0.5">{cycle.participants}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Completion</p>
          <p className="text-sm font-bold text-white mt-0.5">{cycle.completionRate}%</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Score</p>
          <p className={`text-sm font-bold mt-0.5 ${cycle.avgScore >= 80 ? 'text-jade' : cycle.avgScore >= 60 ? 'text-gold' : 'text-slate-400'}`}>
            {cycle.avgScore > 0 ? cycle.avgScore : '—'}
          </p>
        </div>
      </div>

      {cycle.status === 'in-progress' && (
        <div className="mt-3">
          <ScoreBar value={cycle.completionRate} color="bg-gold" />
        </div>
      )}
    </div>
  );
}

// ── Main PerformanceModuleView ─────────────────────────────────────────────────
export function PerformanceModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>('Q2-2026');

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [scores, leaderboard] = await Promise.all([
        platformApi.getPerformanceScores(),
        platformApi.getTeamLeaderboard(),
      ]);
      return { scores, leaderboard };
    },
    fallback: {
      scores: performanceScoreRecords,
      leaderboard: teamLeaderboardRecords,
    },
  });

  const metrics = useMemo(() => {
    const averageScore    = data.scores.reduce((sum, item) => sum + Number(item.performanceScore), 0) / Math.max(data.scores.length, 1);
    const averageTarget   = data.scores.reduce((sum, item) => sum + Number(item.targetAchievement), 0) / Math.max(data.scores.length, 1);
    const topAi           = data.scores.reduce((max, item) => Math.max(max, Number(item.aiScore)), 0);
    const completedCycles = MOCK_CYCLES.filter((c) => c.status === 'completed').length;

    return [
      { id: 'pf1', label: 'Avg Performance Score', value: `${averageScore.toFixed(1)}`, unit: '/ 100', trend: '+3.8', trendUp: true  },
      { id: 'pf2', label: 'Target Achievement',    value: `${averageTarget.toFixed(1)}`, unit: '%',    trend: '+4.2%', trendUp: true  },
      { id: 'pf3', label: 'Top AI Score',          value: String(topAi),               unit: 'pts',   trend: 'stable', trendUp: null  },
      { id: 'pf4', label: 'Cycles Completed',      value: `${completedCycles}`,         unit: `/ ${MOCK_CYCLES.length}`, trend: isLive ? 'Live' : 'Snapshot', trendUp: null },
    ];
  }, [data.scores, isLive]);

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
        description="Evaluate task completion, target performance, team comparison leaderboard, AI-driven scorecards, and review cycles."
      />

      <ModuleLinksBar
        links={[
          { label: 'Tracking',  href: `/tracking?role=${activeRole}`  },
          { label: 'Tasks',     href: `/tasks?role=${activeRole}`     },
          { label: 'Analytics', href: `/analytics?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      {/* KPI Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          metrics.map((metric) => (
            <GlassCard key={metric.id}>
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.13em] text-slate-500">{metric.label}</p>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-3xl font-black text-white">{metric.value}</span>
                  <span className="text-sm text-slate-400 pb-0.5">{metric.unit}</span>
                </div>
                <p className={`mt-2 text-xs font-semibold ${metric.trendUp === true ? 'text-jade' : metric.trendUp === false ? 'text-ember' : 'text-slate-500'}`}>
                  {metric.trend}
                </p>
              </div>
            </GlassCard>
          ))
        )}
      </section>

      {/* Review Cycles */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Review Cycles</h2>
          <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> New Cycle
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {MOCK_CYCLES.map((cycle) => (
            <div key={cycle.id} onClick={() => setSelectedCycleId(cycle.id)} className="cursor-pointer">
              <ReviewCycleCard cycle={cycle} />
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        {loading ? (
          <>
            <SkeletonCard className="h-56" />
            <SkeletonCard className="h-56" />
          </>
        ) : (
          <>
            <TrendAreaChart
              title="AI Performance Trend"
              data={aiTrend.length > 0 ? aiTrend : workHourTrend}
              color="#E85A2A"
            />
            <StackedBarChart
              title="Team Leaderboard Score"
              data={leaderboardBars}
              mode="single"
            />
          </>
        )}
      </section>

      {/* Score Cards + Leaderboard */}
      <section className="grid gap-4 xl:grid-cols-2">
        {/* Employee Scorecards */}
        <GlassCard className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-100">Employee Performance Scorecards</p>
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />}
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : error && data.scores.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Could not load performance scores</p>
            </div>
          ) : data.scores.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No performance data available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {data.scores.map((row, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{row.employeeName}</p>
                      <div className="mt-1.5">
                        <StarRating score={Number(row.performanceScore)} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500">Target</p>
                      <p className={`text-xs font-bold ${Number(row.targetAchievement) >= 90 ? 'text-jade' : Number(row.targetAchievement) >= 70 ? 'text-gold' : 'text-ember'}`}>
                        {row.targetAchievement}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-600 mb-1">Performance</p>
                      <ScoreBar value={Number(row.performanceScore)} color="bg-aqua" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-600 mb-1">AI Score</p>
                      <ScoreBar value={Number(row.aiScore)} color="bg-ember" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-600">
                    {row.tasksDelivered} tasks delivered
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Team Leaderboard */}
        <GlassCard className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-gold" />
            <p className="text-sm font-semibold text-slate-100">Team Comparison Leaderboard</p>
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : data.leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No leaderboard data available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.leaderboard.map((team, rank) => (
                <div
                  key={team.teamName}
                  className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                    rank === 0 ? 'border-gold/30 bg-gold/5' : 'border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black ${
                    rank === 0 ? 'bg-gold text-white' : rank === 1 ? 'bg-slate-400/20 text-slate-300' : rank === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-white/5 text-slate-500'
                  }`}>
                    {rank + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{team.teamName}</p>
                    <div className="mt-1">
                      <ScoreBar value={Number(team.score)} color={rank === 0 ? 'bg-gold' : 'bg-aqua'} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-white">{team.score}</p>
                    <p className="text-[10px] text-slate-500">{team.completedTasks} tasks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
