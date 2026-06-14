'use client';

import { useState } from 'react';
import {
  UserCheck, DollarSign, Star, Briefcase, Plus, Award,
  Trophy, TrendingUp, Crown,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { FormModal, FieldGroup, ModalInput, ModalSelect, PrimaryButton, SecondaryButton } from '@/components/ui/FormModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { useRecruitmentJobs, useRecruitmentApplications } from '@/hooks/useDomainData';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type CommissionTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';

interface RecruiterRow {
  id: string;
  rank: number;
  name: string;
  specialization: string;
  hiresMade: number;
  openJobs: number;
  grossRevenue: number;   // in INR
  commission: number;     // in INR
  tier: CommissionTier;
  rating: number;
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<CommissionTier, { label: string; color: string; bg: string; rate: string; icon: React.ReactNode }> = {
  PLATINUM: { label: 'Platinum', color: 'text-violet-300', bg: 'bg-violet-500/20 border border-violet-500/40', rate: '22% + ₹15K bonus', icon: <Crown className="h-3 w-3" /> },
  GOLD:     { label: 'Gold',     color: 'text-yellow-300', bg: 'bg-yellow-500/20 border border-yellow-500/40', rate: '18% + ₹5K bonus',  icon: <Trophy className="h-3 w-3" /> },
  SILVER:   { label: 'Silver',   color: 'text-slate-300',  bg: 'bg-slate-500/20 border border-slate-500/40',   rate: '15%',              icon: <Award  className="h-3 w-3" /> },
  BRONZE:   { label: 'Bronze',   color: 'text-amber-600',  bg: 'bg-amber-800/20 border border-amber-700/40',   rate: '10%',              icon: <Star   className="h-3 w-3" /> },
};

function TierBadge({ tier }: { tier: CommissionTier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return <span className="text-xs text-slate-500 font-mono w-5 text-center">#{rank}</span>;
}

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K`
  : `₹${n}`;

// ─────────────────────────────────────────────────────────────────────────────
// DATA (commission-tier structured)
// ─────────────────────────────────────────────────────────────────────────────

const RECRUITERS: RecruiterRow[] = [
  { id: '1', rank: 1, name: 'Priya Sharma',    specialization: 'Engineering',      hiresMade: 19, openJobs: 3, grossRevenue: 1140000, commission: 265800, tier: 'PLATINUM', rating: 4.9, status: 'Active' },
  { id: '2', rank: 2, name: 'Rahul Mehta',     specialization: 'Sales & Marketing', hiresMade: 15, openJobs: 5, grossRevenue: 900000,  commission: 167000, tier: 'GOLD',     rating: 4.7, status: 'Active' },
  { id: '3', rank: 3, name: 'Kavya Nair',      specialization: 'Product & Design',  hiresMade: 11, openJobs: 2, grossRevenue: 660000,  commission: 99000,  tier: 'SILVER',   rating: 4.6, status: 'Active' },
  { id: '4', rank: 4, name: 'Arjun Singh',     specialization: 'Finance & HR',      hiresMade: 8,  openJobs: 4, grossRevenue: 480000,  commission: 48000,  tier: 'BRONZE',   rating: 4.4, status: 'Busy'   },
  { id: '5', rank: 5, name: 'Deepa Krishnan',  specialization: 'Tech Leadership',   hiresMade: 6,  openJobs: 1, grossRevenue: 360000,  commission: 36000,  tier: 'BRONZE',   rating: 4.2, status: 'Active' },
];

const PERIOD_OPTIONS = ['May 2026', 'Apr 2026', 'Mar 2026', 'Q1 2026'];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function RecruiterHubModuleView() {
  const { applications, loading } = useRecruitmentApplications();
  const { jobs } = useRecruitmentJobs();
  const [modalOpen, setModalOpen] = useState(false);
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]);

  const openJobs          = jobs.filter((j: any) => j.status === 'Open' || j.status === 'Active').length;
  const totalCommission   = RECRUITERS.reduce((s, r) => s + r.commission, 0);
  const totalRevenue      = RECRUITERS.reduce((s, r) => s + r.grossRevenue, 0);
  const totalHires        = RECRUITERS.reduce((s, r) => s + r.hiresMade, 0);

  const columns: ColumnDef<RecruiterRow>[] = [
    { key: 'rank', label: '#', render: (_, row) => <RankMedal rank={(row as RecruiterRow).rank} /> },
    { key: 'name', label: 'Recruiter', sortable: true, render: (v, row) => (
      <div>
        <p className="font-semibold text-slate-200 text-sm">{v as string}</p>
        <p className="text-xs text-slate-500">{(row as RecruiterRow).specialization}</p>
      </div>
    )},
    { key: 'tier', label: 'Tier', sortable: true, render: (v) => <TierBadge tier={v as CommissionTier} /> },
    { key: 'hiresMade', label: 'Hires', sortable: true, render: (v) => (
      <span className="font-bold text-indigo-400">{v as number}</span>
    )},
    { key: 'grossRevenue', label: 'Gross Rev.', sortable: true, render: (v) => (
      <span className="font-semibold text-slate-300">{fmt(v as number)}</span>
    )},
    { key: 'commission', label: 'Commission', sortable: true, render: (v) => (
      <span className="font-bold text-emerald-400">{fmt(v as number)}</span>
    )},
    { key: 'rating', label: 'Rating', sortable: true, render: (v) => (
      <span className="flex items-center gap-1 text-amber-400 font-medium text-sm">
        <Star className="h-3.5 w-3.5 fill-current" />{v as number}
      </span>
    )},
    { key: 'status', label: 'Status', render: (v) => <StatusPill label={v as string} /> },
  ];

  return (
    <div className="space-y-5">
      <PageTitle title="Recruiter Hub" description="Commission leaderboard, tier rankings, and placement performance for the current period." />

      {/* ── Period Picker ──────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-slate-400 font-medium">Period:</p>
        {PERIOD_OPTIONS.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >{p}</button>
        ))}
      </div>

      {/* ── KPI Summary ────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active Recruiters', value: RECRUITERS.length,     icon: <UserCheck className="h-4 w-4 text-indigo-400" />,  accent: '#6366F1' },
          { label: 'Total Hires',       value: totalHires,            icon: <Award     className="h-4 w-4 text-emerald-400" />, accent: '#10B981' },
          { label: 'Gross Revenue',     value: fmt(totalRevenue),     icon: <TrendingUp className="h-4 w-4 text-blue-400" />,   accent: '#6366F1' },
          { label: 'Commission Paid',   value: fmt(totalCommission),  icon: <DollarSign className="h-4 w-4 text-amber-400" />, accent: '#F59E0B' },
        ].map(s => (
          <GlassCard key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.13em] text-slate-400">{s.label}</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: s.accent }}>{s.value}</p>
              </div>
              <span className="p-2 rounded-xl bg-slate-800/80">{s.icon}</span>
            </div>
          </GlassCard>
        ))}
      </section>

      {/* ── Tier Distribution ──────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
          const count = RECRUITERS.filter(r => r.tier === tier).length;
          const tierComm = RECRUITERS.filter(r => r.tier === tier).reduce((s, r) => s + r.commission, 0);
          return (
            <GlassCard key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-200">{count} recruiter{count !== 1 ? 's' : ''}</p>
              <p className="text-xs text-slate-500 mt-0.5">{fmt(tierComm)} commission • {cfg.rate}</p>
            </GlassCard>
          );
        })}
      </section>

      {/* ── Leaderboard Table ──────────────────────────────────── */}
      <DataTable
        title={`Commission Leaderboard — ${period}`}
        columns={columns as any}
        data={RECRUITERS as any}
        loading={loading}
        searchPlaceholder="Search recruiter..."
        exportFileName={`recruiters-${period.replace(' ', '-').toLowerCase()}`}
        emptyMessage="No recruiters found."
        actions={
          <PrimaryButton onClick={() => setModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Recruiter
          </PrimaryButton>
        }
      />

      {/* ── Add Recruiter Modal ────────────────────────────────── */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Recruiter Profile"
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={() => setModalOpen(false)}>Add Recruiter</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <FieldGroup label="Full Name" required><ModalInput placeholder="Recruiter name..." /></FieldGroup>
          <FieldGroup label="Email" required><ModalInput type="email" placeholder="recruiter@company.com" /></FieldGroup>
          <FieldGroup label="Specialization">
            <ModalSelect>
              <option>Engineering</option>
              <option>Sales & Marketing</option>
              <option>Product & Design</option>
              <option>Finance & HR</option>
              <option>Tech Leadership</option>
            </ModalSelect>
          </FieldGroup>
          <FieldGroup label="Starting Tier">
            <ModalSelect>
              <option value="BRONZE">Bronze (10%)</option>
              <option value="SILVER">Silver (15%)</option>
              <option value="GOLD">Gold (18% + ₹5K bonus)</option>
              <option value="PLATINUM">Platinum (22% + ₹15K bonus)</option>
            </ModalSelect>
          </FieldGroup>
          <FieldGroup label="Target Hires / Month"><ModalInput type="number" placeholder="8" /></FieldGroup>
        </div>
      </FormModal>
    </div>
  );
}
