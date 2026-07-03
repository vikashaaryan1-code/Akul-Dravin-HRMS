'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
 BarChart3, Target, Star, TrendingUp, Users,
 CheckCircle2, Clock, AlertTriangle, ArrowUpRight,
 Plus, Filter, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
 KpiStrip, AreaTrendChart, BarTrendChart, DonutChart,
 GlassCard, SuspenseDashboardBoundary,
} from '@/components/system';

/* ── DTO-shaped mock data ────────────────────────────────────────────────────── */ const PERF_KPIS = [
 { label: 'OKRs On Track', value: '71%', trend: 4.2, icon: Target, iconColor: 'text-jade' },
 { label: 'Reviews Completed', value: '84%', trend: 12.1, icon: CheckCircle2,iconColor: 'text-aqua' },
 { label: 'Avg Performance Score',value: '3.8/5', trend: 0.8, icon: Star, iconColor: 'text-gold' },
 { label: 'Goals At Risk', value: '14', trend: -18, icon: AlertTriangle,iconColor: 'text-ember' },
];

const SCORE_TREND = [
 { month: 'Nov', avgScore: 3.4, topPerformers: 18 },
 { month: 'Dec', avgScore: 3.5, topPerformers: 21 },
 { month: 'Jan', avgScore: 3.6, topPerformers: 24 },
 { month: 'Feb', avgScore: 3.7, topPerformers: 28 },
 { month: 'Mar', avgScore: 3.7, topPerformers: 31 },
 { month: 'Apr', avgScore: 3.8, topPerformers: 34 },
];

const OKR_STATUS_MIX = [
 { name: 'On Track', value: 71, color: 'jade' },
 { name: 'At Risk', value: 18, color: 'gold' },
 { name: 'Off Track', value: 11, color: 'ember' },
] as const;

const DEPT_SCORES = [
 { dept: 'Eng', score: 4.1 },
 { dept: 'Sales', score: 3.9 },
 { dept: 'Ops', score: 3.7 },
 { dept: 'Finance', score: 3.8 },
 { dept: 'People', score: 4.2 },
 { dept: 'Legal', score: 3.5 },
];

type OkrStatus = 'on-track' | 'at-risk' | 'off-track' | 'completed';
const OKR_STATUS_STYLE: Record<OkrStatus, { badge: string; dot: string }> = {
 'on-track': { badge: 'bg-jade/15 text-jade border-jade/20', dot: 'bg-jade' },
 'at-risk': { badge: 'bg-gold/15 text-gold border-gold/20', dot: 'bg-gold' },
 'off-track': { badge: 'bg-ember/15 text-ember border-ember/20', dot: 'bg-ember' },
 'completed': { badge: 'bg-aqua/15 text-aqua border-aqua/20', dot: 'bg-aqua' },
};

type OkrItem = {
 id: string;
 objective: string;
 owner: string;
 dept: string;
 progress: number;
 status: OkrStatus;
 quarter: string;
 keyResults: { label: string; done: boolean }[];
};

const OKRS: OkrItem[] = [
 {
 id: 'OKR-001', quarter: 'Q2 2026',
 objective: 'Achieve 95% customer satisfaction across all deployments',
 owner: 'Priya N.', dept: 'Customer Success', progress: 82, status: 'on-track',
 keyResults: [
 { label: 'NPS > 70 for Q2', done: true },
 { label: '< 2hr P1 response SLA', done: true },
 { label: '100% onboarding audits', done: false },
 ],
 },
 {
 id: 'OKR-002', quarter: 'Q2 2026',
 objective: 'Grow ARR by 40% through new enterprise accounts',
 owner: 'Rahul S.', dept: 'Sales', progress: 61, status: 'at-risk',
 keyResults: [
 { label: '8 new enterprise logos', done: false },
 { label: '₹2Cr incremental ARR', done: false },
 { label: '< 30d sales cycle', done: true },
 ],
 },
 {
 id: 'OKR-003', quarter: 'Q2 2026',
 objective: 'Launch AI Copilot v2 with streaming inference',
 owner: 'Aarav M.', dept: 'Engineering', progress: 91, status: 'on-track',
 keyResults: [
 { label: 'Streaming API live', done: true },
 { label: '< 2s P95 latency', done: true },
 { label: '94%+ model accuracy', done: true },
 ],
 },
 {
 id: 'OKR-004', quarter: 'Q2 2026',
 objective: 'Reduce employee attrition to below 8%',
 owner: 'Sneha R.', dept: 'People', progress: 44, status: 'off-track',
 keyResults: [
 { label: 'Attrition < 8% (Apr)', done: false },
 { label: '100% stay interviews', done: false },
 { label: 'Revised comp bands', done: true },
 ],
 },
];

const TOP_PERFORMERS = [
 { name: 'Ananya Das', dept: 'Engineering', score: 4.9, rank: 1, badge: 'bg-gradient-to-br from-gold to-ember' },
 { name: 'Vikram Singh', dept: 'Sales', score: 4.7, rank: 2, badge: 'bg-gradient-to-br from-slate-400 to-slate-600' },
 { name: 'Meera Pillai', dept: 'Product', score: 4.6, rank: 3, badge: 'bg-gradient-to-br from-amber-700 to-amber-900' },
 { name: 'Arjun Verma', dept: 'Ops', score: 4.4, rank: 4, badge: 'bg-white/10' },
 { name: 'Divya K.', dept: 'Finance', score: 4.3, rank: 5, badge: 'bg-white/10' },
];

/* ── OKR Card ────────────────────────────────────────────────────────────────── */ function OkrCard({ okr }: { okr: OkrItem }) {
 const [expanded, setExpanded] = useState(false);
 const s = OKR_STATUS_STYLE[okr.status];

 return (
 <div className="border border-white/[0.05] rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
 <button
 onClick={() => setExpanded((e) => !e)}
 className="w-full text-left p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
 aria-expanded={expanded}
 aria-controls={`okr-${okr.id}-kr`}
 >
 <span className={`h-2 w-2 rounded-full shrink-0 mt-2 ${s.dot}`} aria-hidden="true" />
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-3 flex-wrap">
 <p className="text-sm font-bold text-navy leading-snug">{okr.objective}</p>
 <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black capitalize ${s.badge}`}>
 {okr.status.replace('-', ' ')}
 </span>
 </div>
 <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
 <span>{okr.id} · {okr.quarter}</span>
 <span>Owner: {okr.owner}</span>
 <span className="text-slate-700">|</span>
 <span>{okr.dept}</span>
 </div>
 <div className="mt-3 flex items-center gap-3">
 <div className="flex-1 h-1.5 rounded-full bg-white/5">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${okr.progress}%` }}
 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 className={`h-full rounded-full ${okr.progress > 80 ? 'bg-jade' : okr.progress > 50 ? 'bg-gold' : 'bg-ember'}`}
 role="progressbar" aria-valuenow={okr.progress} aria-valuemin={0} aria-valuemax={100}
 />
 </div>
 <span className="text-xs font-black text-white">{okr.progress}%</span>
 </div>
 </div>
 {expanded
 ? <ChevronDown className="h-4 w-4 text-slate-600 shrink-0 mt-1" aria-hidden="true" />
 : <ChevronRight className="h-4 w-4 text-slate-600 shrink-0 mt-1" aria-hidden="true" />
 }
 </button>

 {expanded && (
 <div id={`okr-${okr.id}-kr`} className="border-t border-white/[0.04] px-5 pb-5 pt-4">
 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Key Results</p>
 <div className="space-y-2">
 {okr.keyResults.map((kr, i) => (
 <div key={i} className="flex items-center gap-2.5">
 {kr.done
 ? <CheckCircle2 className="h-3.5 w-3.5 text-jade shrink-0" aria-label="Completed" />
 : <Clock className="h-3.5 w-3.5 text-slate-600 shrink-0" aria-label="Pending" />
 }
 <span className={`text-xs ${kr.done ? 'text-slate-500 line-through' : 'text-white'}`}>{kr.label}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}

/* ── Top Performers Panel ────────────────────────────────────────────────────── */ function TopPerformersPanel() {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center gap-2">
 <Star className="h-4 w-4 text-gold" aria-hidden="true" />
 <p className="text-sm font-black text-white">Top Performers</p>
 </div>
 <div className="space-y-3" role="list" aria-label="Top performers">
 {TOP_PERFORMERS.map((p) => (
 <div key={p.name} role="listitem" className="flex items-center gap-3 group cursor-pointer">
 <div className={`h-8 w-8 rounded-full ${p.badge} flex items-center justify-center text-xs font-black text-void shrink-0`}>
 {p.rank <= 3 ? p.rank : p.name[0]}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-navy">{p.name}</p>
 <p className="text-[10px] text-slate-600">{p.dept}</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <div className="h-1 w-14 rounded-full bg-white/5">
 <div className="h-full rounded-full bg-gold/60" style={{ width: `${(p.score / 5) * 100}%` }} />
 </div>
 <span className="text-xs font-black text-gold w-8">{p.score}</span>
 </div>
 <ArrowUpRight className="h-3.5 w-3.5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
 </div>
 ))}
 </div>
 </GlassCard>
 );
}

// ── PerformanceDashboard ──────────────────────────────────────────────────────
/**
 * PerformanceDashboard — Phase 3B Priority 7
 * OKR Performance Hub: score trend, status mix, dept breakdown,
 * expandable OKR cards with key results, and top performer leaderboard.
 *
 * Data: DTO-shaped mock — Phase 3C wires to /api/performance endpoints.
 */
export function PerformanceDashboard() {
 const [filter, setFilter] = useState<OkrStatus | 'all'>('all');
 const filtered = filter === 'all' ? OKRS : OKRS.filter((o) => o.status === filter);

 return (
 <section aria-labelledby="performance-heading">
 <h1 id="performance-heading" className="sr-only">Performance & OKR Hub</h1>

 {/* Header */}
 <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
 <div>
 <p className="section-label text-gold mb-2">Performance Intelligence</p>
 <h2 className="text-3xl font-black tracking-tighter text-white">OKR Command Hub</h2>
 <p className="text-sm text-slate-500 mt-1">Q2 2026 · 4 objectives · 12 key results tracked</p>
 </div>
 <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-ember text-void text-xs font-black hover:scale-105 transition-transform">
 <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New Objective
 </button>
 </div>

 {/* KPIs */}
 <SuspenseDashboardBoundary context="Performance KPIs" skeletonType="card" skeletonRows={4}>
 <KpiStrip tiles={PERF_KPIS as unknown as Parameters<typeof KpiStrip>[0]['tiles']} columns={4} />
 </SuspenseDashboardBoundary>

 {/* Charts */}
 <div className="mt-6 grid lg:grid-cols-3 gap-5">
 <div className="lg:col-span-2">
 <AreaTrendChart
 data={SCORE_TREND} xKey="month"
 series={[
 { key: 'avgScore', label: 'Avg Score (/ 5)', color: 'gold' },
 { key: 'topPerformers', label: 'Top Performers', color: 'jade' },
 ]}
 title="Performance Score Trend"
 subtitle="Last 6 months · average score + top performers"
 height={240}
 />
 </div>
 <DonutChart
 data={OKR_STATUS_MIX as unknown as Parameters<typeof DonutChart>[0]['data']}
 title="OKR Status Distribution"
 subtitle="Q2 2026 · all objectives"
 height={240}
 />
 </div>

 <div className="mt-5">
 <BarTrendChart
 data={DEPT_SCORES} xKey="dept"
 series={[{ key: 'score', label: 'Avg Score (/ 5)', color: 'gold' }]}
 title="Performance by Department"
 subtitle="Q2 2026 · average review score"
 height={200}
 />
 </div>

 {/* OKR list + top performers */}
 <div className="mt-6 grid lg:grid-cols-3 gap-5">
 {/* OKR Cards */}
 <div className="lg:col-span-2 flex flex-col gap-4">
 <div className="flex items-center justify-between flex-wrap gap-3">
 <p className="text-sm font-black text-white">Active OKRs</p>
 <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter OKRs by status">
 {(['all', 'on-track', 'at-risk', 'off-track'] as const).map((f) => (
 <button
 key={f}
 onClick={() => setFilter(f)}
 aria-pressed={filter === f}
 className={`px-3 py-1.5 rounded-full text-[10px] font-black capitalize transition-all duration-200 ${
 filter === f
 ? 'bg-gold/15 border border-gold/20 text-gold'
 : 'bg-white/5 border border-white/8 text-slate-500 hover:text-white'
 }`}
 >
 {f === 'all' ? 'All' : f.replace('-', ' ')}
 </button>
 ))}
 </div>
 </div>
 <div className="space-y-3">
 {filtered.map((okr) => <OkrCard key={okr.id} okr={okr} />)}
 {filtered.length === 0 && (
 <p className="text-sm text-slate-600 text-center py-8">No OKRs match this filter.</p>
 )}
 </div>
 </div>

 {/* Top performers */}
 <div className="flex flex-col gap-4">
 <TopPerformersPanel />
 {/* Quick stats */}
 <GlassCard className="p-5 flex flex-col gap-3">
 <p className="text-xs font-black text-white">Cycle Health</p>
 {[
 { label: 'Reviews submitted', value: '84%', color: 'text-jade' },
 { label: 'Calibration done', value: '61%', color: 'text-gold' },
 { label: 'Promotions flagged',value: '12', color: 'text-aqua' },
 { label: 'PIPs active', value: '3', color: 'text-ember' },
 ].map((stat) => (
 <div key={stat.label} className="flex justify-between items-center text-xs">
 <span className="text-slate-500">{stat.label}</span>
 <span className={`font-black ${stat.color}`}>{stat.value}</span>
 </div>
 ))}
 </GlassCard>
 </div>
 </div>
 </section>
 );
}
