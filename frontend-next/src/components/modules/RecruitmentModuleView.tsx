'use client';

import { useMemo, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { SkeletonCard, SkeletonTable } from '@/components/system/Suspense';
import { useUIStore } from '@/store/ui-store';
import {
  useAtsKpis,
  usePipelineFunnel,
  useCandidates,
  useOpenRoles,
  useAdvanceCandidate,
  type CandidateDto,
  type CandidateStage,
  type OpenRoleDto,
  type AtsKpiDto,
  type PipelineFunnelItem,
} from '@/hooks/api';
import {
  Briefcase, Users, Clock, TrendingUp, Search,
  ChevronRight, Plus, RefreshCw, AlertTriangle, Star,
  CheckCircle2, XCircle, ArrowRight,
} from 'lucide-react';

// ── Fallback data ─────────────────────────────────────────────────────────────
const FALLBACK_KPIS: AtsKpiDto = {
  openPositions:      24,
  totalApplicants:    187,
  avgTimeToHire:      18,
  offerAcceptRate:    84,
  openPositionsTrend: 12,
  applicantsTrend:    8.4,
  timeToHireTrend:    -3.2,
  acceptRateTrend:    2.1,
};

const FALLBACK_FUNNEL: PipelineFunnelItem[] = [
  { stage: 'Applied',     count: 187, color: '#0F8B8D' },
  { stage: 'Screening',   count: 92,  color: '#F2AA3B' },
  { stage: 'Interview',   count: 38,  color: '#10B981' },
  { stage: 'Offer',       count: 12,  color: '#E85A2A' },
  { stage: 'Hired',       count: 8,   color: '#8B5CF6' },
];

const FALLBACK_CANDIDATES: CandidateDto[] = [
  { id: 'C-001', name: 'Aryan Kapoor',    role: 'SDE-II',           score: 92, stage: 'interview', source: 'LinkedIn',   days: 12 },
  { id: 'C-002', name: 'Meera Reddy',     role: 'Product Manager',  score: 88, stage: 'offer',     source: 'Referral',   days: 21 },
  { id: 'C-003', name: 'Rohan Sharma',    role: 'Data Analyst',     score: 74, stage: 'screening', source: 'Naukri',     days: 5  },
  { id: 'C-004', name: 'Priya Joshi',     role: 'UX Designer',      score: 85, stage: 'interview', source: 'AngelList',  days: 9  },
  { id: 'C-005', name: 'Karan Singh',     role: 'DevOps Engineer',  score: 91, stage: 'hired',     source: 'Referral',   days: 28 },
];

const FALLBACK_ROLES: OpenRoleDto[] = [
  { id: 'JR-101', title: 'Senior Software Engineer', dept: 'Engineering', applicants: 42, priority: 'urgent', postedAt: '2026-04-01' },
  { id: 'JR-102', title: 'Product Manager',          dept: 'Product',     applicants: 28, priority: 'high',   postedAt: '2026-04-10' },
  { id: 'JR-103', title: 'Data Scientist',           dept: 'Analytics',   applicants: 19, priority: 'medium', postedAt: '2026-04-15' },
  { id: 'JR-104', title: 'Sales Executive',          dept: 'Sales',       applicants: 33, priority: 'high',   postedAt: '2026-04-20' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const STAGE_ORDER: CandidateStage[] = ['screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS: Record<CandidateStage, string> = {
  screening: 'bg-gold/20 text-gold border-gold/20',
  interview: 'bg-aqua/20 text-aqua border-aqua/20',
  offer:     'bg-jade/20 text-jade border-jade/20',
  hired:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  rejected:  'bg-ember/20 text-ember border-ember/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-ember bg-ember/10 border-ember/20',
  high:   'text-gold bg-gold/10 border-gold/20',
  medium: 'text-aqua bg-aqua/10 border-aqua/20',
  low:    'text-slate-400 bg-white/5 border-white/10',
};

// ── KPI Strip ─────────────────────────────────────────────────────────────────
function AtsKpiStrip({ kpis, loading }: { kpis: AtsKpiDto; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const tiles = [
    { label: 'Open Positions',    value: kpis.openPositions,   trend: kpis.openPositionsTrend, icon: Briefcase,   color: 'text-aqua' },
    { label: 'Total Applicants',  value: kpis.totalApplicants, trend: kpis.applicantsTrend,    icon: Users,       color: 'text-jade' },
    { label: 'Avg Days to Hire',  value: kpis.avgTimeToHire,   trend: kpis.timeToHireTrend,    icon: Clock,       color: 'text-gold' },
    { label: 'Offer Accept Rate', value: `${kpis.offerAcceptRate}%`, trend: kpis.acceptRateTrend, icon: TrendingUp, color: 'text-ember' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <GlassCard key={tile.label}>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className={`h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center ${tile.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] font-bold ${tile.trend > 0 ? 'text-jade' : tile.trend < 0 ? 'text-ember' : 'text-slate-500'}`}>
                  {tile.trend > 0 ? '+' : ''}{tile.trend}%
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-white">{tile.value}</p>
              <p className="mt-1 text-xs text-slate-500 uppercase tracking-[0.1em]">{tile.label}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

// ── Pipeline Funnel ───────────────────────────────────────────────────────────
function PipelineVisual({ funnel, loading }: { funnel: PipelineFunnelItem[]; loading: boolean }) {
  if (loading) return <SkeletonCard className="h-44" />;

  const maxCount = funnel[0]?.count ?? 1;

  return (
    <GlassCard className="p-5">
      <p className="text-sm font-semibold text-slate-100 mb-4">Recruitment Pipeline Funnel</p>
      <div className="space-y-2">
        {funnel.map((stage, i) => {
          const pct = (stage.count / maxCount) * 100;
          const nextCount = funnel[i + 1]?.count;
          const dropRate = nextCount != null ? Math.round(((stage.count - nextCount) / stage.count) * 100) : null;
          return (
            <div key={stage.stage}>
              <div className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-right">
                  <span className="text-xs font-semibold text-slate-400">{stage.stage}</span>
                </div>
                <div className="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-3"
                    style={{ width: `${pct}%`, backgroundColor: `${stage.color}30` }}
                  >
                    <span className="text-[10px] font-black text-white">{stage.count}</span>
                  </div>
                </div>
                {dropRate != null && (
                  <span className="w-12 text-[10px] text-ember shrink-0">-{dropRate}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ── Candidate Card for Pipeline Kanban ────────────────────────────────────────
function CandidateCard({ candidate, onAdvance, isAdvancing }: {
  candidate: CandidateDto;
  onAdvance: (candidateId: string, toStage: CandidateStage) => void;
  isAdvancing: boolean;
}) {
  const currentStageIndex = STAGE_ORDER.indexOf(candidate.stage);
  const nextStage = STAGE_ORDER[currentStageIndex + 1];

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{candidate.name}</p>
          <p className="text-[10px] text-slate-500 truncate">{candidate.role}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-2.5 w-2.5 ${i < Math.round(candidate.score / 20) ? 'fill-gold text-gold' : 'text-slate-700'}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{candidate.source} · {candidate.days}d</span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${STAGE_COLORS[candidate.stage] ?? ''}`}>
          {candidate.stage}
        </span>
      </div>
      {nextStage && candidate.stage !== 'hired' && candidate.stage !== 'rejected' && (
        <button
          onClick={() => onAdvance(candidate.id, nextStage)}
          disabled={isAdvancing}
          className="mt-2 w-full flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
        >
          {isAdvancing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
          Move to {nextStage}
        </button>
      )}
    </div>
  );
}

// ── Main RecruitmentModuleView ────────────────────────────────────────────────
export function RecruitmentModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<CandidateStage | ''>('');

  const kpisQuery    = useAtsKpis();
  const funnelQuery  = usePipelineFunnel();
  const candidatesQ  = useCandidates({ search: search || undefined, stage: stageFilter || undefined, limit: 20 });
  const rolesQuery   = useOpenRoles();
  const advanceMut   = useAdvanceCandidate();

  const kpis     = kpisQuery.data    ?? FALLBACK_KPIS;
  const funnel   = funnelQuery.data  ?? FALLBACK_FUNNEL;
  const candidateList = candidatesQ.data?.data ?? FALLBACK_CANDIDATES;
  const roles    = rolesQuery.data   ?? FALLBACK_ROLES;

  const isLoading = kpisQuery.isLoading || funnelQuery.isLoading;
  const isError   = kpisQuery.isError   || funnelQuery.isError;

  const handleAdvance = (candidateId: string, toStage: CandidateStage) => {
    advanceMut.mutate({ candidateId, toStage });
  };

  // Role table data
  const roleTableRows = roles.map((role) => ({
    id:         role.id,
    title:      role.title,
    dept:       role.dept,
    applicants: role.applicants,
    priority:   role.priority,
    postedAt:   new Date(role.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  }));

  return (
    <div className="space-y-5">
      <PageTitle
        title="Recruitment Pipeline"
        description="Manage job postings, track candidates through your hiring funnel, and make data-driven hiring decisions."
      />

      <ModuleLinksBar
        links={[
          { label: 'Candidates',  href: `/candidates?role=${activeRole}`  },
          { label: 'Interviews',  href: `/interviews?role=${activeRole}`  },
          { label: 'Employees',   href: `/employees?role=${activeRole}`   },
          { label: 'Job Board',   href: `/job-board?role=${activeRole}`   },
        ]}
        isLive={!isLoading && !isError}
        loading={isLoading}
        error={isError ? 'Could not connect to ATS — showing cached data' : null}
      />

      {/* KPI Cards */}
      <AtsKpiStrip kpis={kpis} loading={kpisQuery.isLoading} />

      {/* Pipeline Funnel + Candidates */}
      <section className="grid gap-4 xl:grid-cols-2">
        <PipelineVisual funnel={funnel} loading={funnelQuery.isLoading} />

        {/* Candidate Pipeline */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-100">Active Candidates</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-7 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-600 outline-none focus:border-aqua/40 w-28"
                />
              </div>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as CandidateStage | '')}
                className="rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 px-2 py-1.5 outline-none focus:border-aqua/40"
              >
                <option value="">All Stages</option>
                {STAGE_ORDER.map((s) => (
                  <option key={s} value={s} className="bg-[#0d1a30] capitalize">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {candidatesQ.isLoading ? (
            <SkeletonTable rows={5} />
          ) : candidateList.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No candidates match your criteria</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {candidateList.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onAdvance={handleAdvance}
                  isAdvancing={advanceMut.isPending && (advanceMut.variables as any)?.candidateId === candidate.id}
                />
              ))}
            </div>
          )}
        </GlassCard>
      </section>

      {/* Open Roles Table */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Open Positions</h2>
          <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" /> Post Role
          </button>
        </div>

        {rolesQuery.isLoading ? (
          <SkeletonTable rows={5} />
        ) : rolesQuery.isError ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
            <p className="text-sm text-slate-500">Could not load open roles</p>
          </div>
        ) : (
          <SimpleTable
            rows={roleTableRows}
            columns={[
              { key: 'id',         label: 'Role ID'     },
              { key: 'title',      label: 'Position'    },
              { key: 'dept',       label: 'Department'  },
              { key: 'applicants', label: 'Applicants'  },
              {
                key: 'priority',
                label: 'Priority',
                render: (row) => (
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize ${PRIORITY_COLORS[row.priority] ?? ''}`}>
                    {row.priority}
                  </span>
                ),
              },
              { key: 'postedAt',   label: 'Posted'      },
              {
                key: 'id',
                label: '',
                render: () => (
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
          />
        )}
      </section>
    </div>
  );
}
