'use client';

import { useState, useMemo } from 'react';
import {
  Target, TrendingUp, Plus, Check, AlertTriangle,
  ChevronDown, Users, Star, BarChart3, Award, Edit2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { MetricCard } from '@/components/modules/MetricCard';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { useUIStore } from '@/store/ui-store';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalStatus = 'on-track' | 'at-risk' | 'completed' | 'not-started';
type ReviewCycle = 'Q1 2026' | 'Q2 2026' | 'Annual 2026';
type RatingLabel = 'Outstanding' | 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Unsatisfactory';

interface OKRGoal {
  id:           string;
  title:        string;
  keyResult:    string;
  progress:     number;
  status:       GoalStatus;
  owner:        string;
  dueDate:      string;
  weight:       number;    // % weight in overall score
}

interface ReviewRecord {
  id:           string;
  employee:     string;
  department:   string;
  cycle:        ReviewCycle;
  selfScore:    number;
  managerScore: number;
  rating:       RatingLabel;
  status:       'draft' | 'submitted' | 'reviewed' | 'finalized';
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const OKR_GOALS: OKRGoal[] = [
  { id: 'okr-1', title: 'Increase Monthly Revenue', keyResult: 'Achieve ₹50L MRR by June 30', progress: 78, status: 'on-track', owner: 'Sales Team', dueDate: '2026-06-30', weight: 30 },
  { id: 'okr-2', title: 'Reduce Employee Churn', keyResult: 'Churn rate < 5% in Q2', progress: 60, status: 'at-risk', owner: 'HR Department', dueDate: '2026-06-30', weight: 20 },
  { id: 'okr-3', title: 'Platform Uptime SLA', keyResult: '99.9% uptime for May-June', progress: 100, status: 'completed', owner: 'Engineering', dueDate: '2026-05-31', weight: 25 },
  { id: 'okr-4', title: 'Customer NPS Score', keyResult: 'NPS > 65 by Q2 end', progress: 35, status: 'at-risk', owner: 'CX Team', dueDate: '2026-06-30', weight: 15 },
  { id: 'okr-5', title: 'Hire Senior Engineers', keyResult: '8 senior hires this quarter', progress: 50, status: 'on-track', owner: 'Talent Acquisition', dueDate: '2026-06-30', weight: 10 },
];

const REVIEW_RECORDS: ReviewRecord[] = [
  { id: 'rev-1', employee: 'Priya Sharma', department: 'Sales', cycle: 'Q2 2026', selfScore: 88, managerScore: 85, rating: 'Exceeds Expectations', status: 'finalized' },
  { id: 'rev-2', employee: 'Arjun Patel', department: 'Engineering', cycle: 'Q2 2026', selfScore: 92, managerScore: 90, rating: 'Outstanding', status: 'reviewed' },
  { id: 'rev-3', employee: 'Neha Gupta', department: 'Marketing', cycle: 'Q2 2026', selfScore: 76, managerScore: 0, rating: 'Meets Expectations', status: 'submitted' },
  { id: 'rev-4', employee: 'Rahul Singh', department: 'Finance', cycle: 'Q2 2026', selfScore: 0, managerScore: 0, rating: 'Meets Expectations', status: 'draft' },
  { id: 'rev-5', employee: 'Anjali Nair', department: 'HR', cycle: 'Q2 2026', selfScore: 82, managerScore: 79, rating: 'Exceeds Expectations', status: 'finalized' },
];

const TREND_DATA = [
  { name: 'Q3\'25', value: 74 }, { name: 'Q4\'25', value: 78 },
  { name: 'Q1\'26', value: 81 }, { name: 'Q2\'26', value: 85 },
];

const DEPT_SCORES = [
  { name: 'Sales', value: 87 },
  { name: 'Eng', value: 91 },
  { name: 'HR', value: 82 },
  { name: 'Finance', value: 78 },
  { name: 'Mktg', value: 85 },
  { name: 'CX', value: 80 },
];

// ─── OKR Progress Bar ─────────────────────────────────────────────────────────

function OKRCard({ goal }: { goal: OKRGoal }) {
  const colors: Record<GoalStatus, string> = {
    'on-track':   'bg-emerald-500',
    'at-risk':    'bg-amber-500',
    'completed':  'bg-blue-500',
    'not-started':'bg-slate-500',
  };
  const tone: Record<GoalStatus, string> = {
    'on-track':   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'at-risk':    'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'completed':  'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'not-started':'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4 space-y-3 hover:bg-white/8 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200">{goal.title}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{goal.keyResult}</p>
        </div>
        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium ${tone[goal.status]}`}>
          {goal.status.replace('-', ' ')}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Progress</span>
          <span className="font-semibold text-slate-300">{goal.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${colors[goal.status]}`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>👤 {goal.owner}</span>
        <span>Due: {goal.dueDate}</span>
        <span className="text-indigo-400">Weight: {goal.weight}%</span>
      </div>
    </div>
  );
}

// ─── Rating Badge ─────────────────────────────────────────────────────────────

const ratingColors: Record<RatingLabel, string> = {
  'Outstanding':          'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
  'Exceeds Expectations': 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  'Meets Expectations':   'text-blue-400 bg-blue-500/15 border-blue-500/30',
  'Needs Improvement':    'text-amber-400 bg-amber-500/15 border-amber-500/30',
  'Unsatisfactory':       'text-rose-400 bg-rose-500/15 border-rose-500/30',
};

const reviewStatusTone: Record<ReviewRecord['status'], string> = {
  draft:     'text-slate-400',
  submitted: 'text-amber-400',
  reviewed:  'text-blue-400',
  finalized: 'text-emerald-400',
};

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = 'okr' | 'reviews' | 'analytics';

export function AdvancedPerformanceView() {
  const [tab, setTab] = useState<ActiveTab>('okr');
  const activeRole = useUIStore(s => s.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [scores, leaderboard] = await Promise.all([
        platformApi.getPerformanceScores(),
        platformApi.getTeamLeaderboard(),
      ]);
      return { scores, leaderboard };
    },
    fallback: { scores: [], leaderboard: [] },
  });

  const metrics = useMemo(() => {
    const avgScore  = OKR_GOALS.reduce((s, g) => s + g.progress, 0) / OKR_GOALS.length;
    const onTrack   = OKR_GOALS.filter(g => g.status === 'on-track').length;
    const atRisk    = OKR_GOALS.filter(g => g.status === 'at-risk').length;
    const completed = OKR_GOALS.filter(g => g.status === 'completed').length;
    return [
      { id: 'm1', label: 'Avg OKR Progress',   value: `${avgScore.toFixed(1)}%`,  trend: '+4.2% vs last cycle', trendDirection: 'up' as const },
      { id: 'm2', label: 'On Track',            value: String(onTrack),             trend: `${onTrack} of ${OKR_GOALS.length} goals`,  trendDirection: 'up' as const },
      { id: 'm3', label: 'At Risk',             value: String(atRisk),              trend: 'Action needed',       trendDirection: 'down' as const },
      { id: 'm4', label: 'Completed Goals',     value: String(completed),           trend: 'This quarter',        trendDirection: 'neutral' as const },
    ];
  }, []);

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'okr',      label: 'OKR Goals',     icon: <Target className="h-3.5 w-3.5" /> },
    { id: 'reviews',  label: 'Reviews',        icon: <Star className="h-3.5 w-3.5" /> },
    { id: 'analytics',label: 'Analytics',      icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-5 animate-rise">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PageTitle
          title="Performance Management"
          description="OKR tracking, performance reviews, appraisal cycles, 360° feedback, and team analytics."
        />
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all">
          <Plus className="h-4 w-4" /> Add Goal
        </button>
      </div>

      <ModuleLinksBar
        links={[
          { label: 'Employees', href: `/employees?role=${activeRole}` },
          { label: 'Attendance', href: `/attendance?role=${activeRole}` },
          { label: 'Analytics', href: `/analytics?role=${activeRole}` },
          { label: 'AI Insights', href: `/ai-hub?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      {/* KPI Row */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(m => <MetricCard key={m.id} metric={m} />)}
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === t.id
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: OKR Goals */}
      {tab === 'okr' && (
        <section className="space-y-4">
          {/* Cycle Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Cycle:</span>
            {(['Q1 2026', 'Q2 2026', 'Annual 2026'] as ReviewCycle[]).map(c => (
              <button key={c} className={`text-xs px-3 py-1 rounded-full border transition-colors
                ${c === 'Q2 2026'
                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                  : 'border-white/10 text-slate-400 hover:text-slate-200'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* OKR Grid */}
          <div className="grid gap-3 xl:grid-cols-2">
            {OKR_GOALS.map(g => <OKRCard key={g.id} goal={g} />)}
          </div>

          {/* Overall OKR Score */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-200">Overall OKR Score — Q2 2026</p>
                <p className="text-xs text-slate-500 mt-0.5">Weighted average across all goals</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {Math.round(OKR_GOALS.reduce((s, g) => s + (g.progress * g.weight) / 100, 0))}
                  <span className="text-base text-slate-400">%</span>
                </p>
                <p className="text-xs text-emerald-400">↑ On Track</p>
              </div>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Tab: Performance Reviews */}
      {tab === 'reviews' && (
        <section className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-200">Q2 2026 — Appraisal Cycle</p>
              <span className="text-xs text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">In Progress</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Employee', 'Department', 'Self Score', 'Manager Score', 'Rating', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {REVIEW_RECORDS.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 text-slate-200 font-medium">{r.employee}</td>
                      <td className="py-2.5 px-3 text-slate-400">{r.department}</td>
                      <td className="py-2.5 px-3 text-slate-300">{r.selfScore > 0 ? r.selfScore : '—'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{r.managerScore > 0 ? r.managerScore : '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${ratingColors[r.rating]}`}>
                          {r.rating}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`font-medium capitalize ${reviewStatusTone[r.status]}`}>{r.status}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <button className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-lg px-2 py-0.5 transition-colors">
                          <Edit2 className="h-2.5 w-2.5" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Tab: Analytics */}
      {tab === 'analytics' && (
        <section className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <TrendAreaChart
              title="Company Performance Trend (Quarterly)"
              data={TREND_DATA}
              color="#818cf8"
            />
            <StackedBarChart
              title="Department Score Comparison"
              data={DEPT_SCORES}
              mode="single"
            />
          </div>

          {/* Bell Curve Distribution */}
          <GlassCard className="space-y-4">
            <p className="text-sm font-semibold text-slate-200">Rating Distribution — Q2 2026</p>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Outstanding', count: 3, pct: 12, color: 'bg-yellow-500' },
                { label: 'Exceeds Exp.', count: 8, pct: 32, color: 'bg-emerald-500' },
                { label: 'Meets Exp.', count: 11, pct: 44, color: 'bg-blue-500' },
                { label: 'Needs Impr.', count: 2, pct: 8, color: 'bg-amber-500' },
                { label: 'Unsat.', count: 1, pct: 4, color: 'bg-rose-500' },
              ].map(r => (
                <div key={r.label} className="text-center space-y-2">
                  <div className="h-20 rounded-xl bg-white/5 flex items-end justify-center p-1">
                    <div
                      className={`w-full rounded-lg transition-all duration-700 ${r.color}`}
                      style={{ height: `${r.pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{r.label}</p>
                  <p className="text-sm font-bold text-white">{r.count}</p>
                  <p className="text-[10px] text-slate-500">{r.pct}%</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      )}
    </div>
  );
}
