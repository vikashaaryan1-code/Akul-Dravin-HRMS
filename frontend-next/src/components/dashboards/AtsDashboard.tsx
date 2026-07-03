'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
 Briefcase, Users, Clock, Star, ArrowUpRight,
 Plus, Search, Filter, CheckCircle2, XCircle,
 MessageSquare, Calendar, TrendingUp, Zap,
} from 'lucide-react';
import {
 KpiStrip, AreaTrendChart, BarTrendChart, DonutChart,
 GlassCard, SuspenseDashboardBoundary,
} from '@/components/system';

/* ── DTO-shaped mock data ────────────────────────────────────────────────────── */ const ATS_KPIS = [
 { label: 'Open Positions', value: '38', trend: 5.5, icon: Briefcase, iconColor: 'text-gold' },
 { label: 'Total Applicants', value: '1,482', trend: 18.3, icon: Users, iconColor: 'text-aqua' },
 { label: 'Avg Time-to-Hire', value: '22d', trend: -8.3, icon: Clock, iconColor: 'text-jade' },
 { label: 'Offer Accept Rate',value: '84%', trend: 3.1, icon: Star, iconColor: 'text-ember' },
];

const PIPELINE_FUNNEL_DATA = [
 { stage: 'Applied', count: 1482, color: 'bg-slate-600' },
 { stage: 'Screened', count: 612, color: 'bg-aqua' },
 { stage: 'Interviewed', count: 187, color: 'bg-gold' },
 { stage: 'Offered', count: 54, color: 'bg-jade' },
 { stage: 'Hired', count: 38, color: 'bg-ember' },
];

const HIRE_TREND = [
 { month: 'Nov', applied: 210, hired: 12 },
 { month: 'Dec', applied: 185, hired: 8 },
 { month: 'Jan', applied: 310, hired: 18 },
 { month: 'Feb', applied: 274, hired: 15 },
 { month: 'Mar', applied: 398, hired: 22 },
 { month: 'Apr', applied: 482, hired: 38 },
];

const SOURCE_MIX = [
 { name: 'Job Board', value: 38, color: 'gold' },
 { name: 'Referrals', value: 27, color: 'jade' },
 { name: 'LinkedIn', value: 21, color: 'aqua' },
 { name: 'Agency', value: 14, color: 'ember' },
] as const;

type CandidateStage = 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
const STAGE_STYLE: Record<CandidateStage, string> = {
 screening: 'bg-aqua/15 text-aqua border-aqua/20',
 interview: 'bg-gold/15 text-gold border-gold/20',
 offer: 'bg-jade/15 text-jade border-jade/20',
 hired: 'bg-jade/25 text-jade border-jade/30',
 rejected: 'bg-ember/15 text-ember border-ember/20',
};

const CANDIDATES = [
 { id: 'C-001', name: 'Arjun Verma', role: 'SDE-III', score: 92, stage: 'offer' as CandidateStage, source: 'LinkedIn', days: 14 },
 { id: 'C-002', name: 'Meera Pillai', role: 'Product Manager', score: 88, stage: 'interview' as CandidateStage, source: 'Referral', days: 8 },
 { id: 'C-003', name: 'Rahul Saxena', role: 'Data Engineer', score: 85, stage: 'screening' as CandidateStage, source: 'Job Board', days: 3 },
 { id: 'C-004', name: 'Ananya Das', role: 'UX Designer', score: 79, stage: 'interview' as CandidateStage, source: 'Agency', days: 11 },
 { id: 'C-005', name: 'Vikram Singh', role: 'DevOps Engineer', score: 91, stage: 'hired' as CandidateStage, source: 'Referral', days: 22 },
 { id: 'C-006', name: 'Pooja Iyer', role: 'Finance Analyst', score: 74, stage: 'rejected' as CandidateStage, source: 'Job Board', days: 9 },
];

const OPEN_ROLES = [
 { title: 'Senior SDE', dept: 'Engineering', applicants: 218, priority: 'urgent' as const },
 { title: 'Growth PM', dept: 'Product', applicants: 142, priority: 'high' as const },
 { title: 'Data Scientist', dept: 'Analytics', applicants: 87, priority: 'high' as const },
 { title: 'Sales Lead', dept: 'Sales', applicants: 64, priority: 'medium' as const },
 { title: 'Legal Counsel', dept: 'Legal', applicants: 31, priority: 'low' as const },
];

const PRIORITY_STYLE = {
 urgent: 'bg-ember/15 text-ember border-ember/20',
 high: 'bg-gold/15 text-gold border-gold/20',
 medium: 'bg-aqua/15 text-aqua border-aqua/20',
 low: 'bg-slate-50 text-slate-500 border-white/8',
};

/* ── Pipeline Funnel ─────────────────────────────────────────────────────────── */ function PipelineFunnel() {
 const total = PIPELINE_FUNNEL_DATA[0].count;
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center gap-2">
 <TrendingUp className="h-4 w-4 text-gold" aria-hidden="true" />
 <p className="text-sm font-black text-white">Hiring Pipeline Funnel</p>
 </div>
 <div className="space-y-3">
 {PIPELINE_FUNNEL_DATA.map((stage, i) => {
 const pct = (stage.count / total) * 100;
 return (
 <div key={stage.stage}>
 <div className="flex justify-between mb-1.5 text-xs">
 <span className="text-slate-500 font-semibold">{stage.stage}</span>
 <span className="font-black text-white">{stage.count.toLocaleString()} <span className="text-slate-600 font-normal">({pct.toFixed(0)}%)</span></span>
 </div>
 <div className="h-5 bg-white/[0.03] rounded-lg overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 whileInView={{ width: `${pct}%` }}
 viewport={{ once: true }}
 transition={{ duration: 0.8, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
 className={`h-full rounded-lg ${stage.color}/40`}
 role="progressbar" aria-valuenow={stage.count} aria-valuemin={0} aria-valuemax={total} aria-label={stage.stage}
 />
 </div>
 </div>
 );
 })}
 </div>
 <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
 <span className="text-slate-500">Conversion: Applied → Hired</span>
 <span className="font-black text-jade">2.56%</span>
 </div>
 </GlassCard>
 );
}

/* ── Open Roles Panel ────────────────────────────────────────────────────────── */ function OpenRolesPanel() {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Briefcase className="h-4 w-4 text-aqua" aria-hidden="true" />
 <p className="text-sm font-black text-white">Open Positions</p>
 </div>
 <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/20 text-[10px] font-black text-gold hover:bg-gold/20 transition-colors">
 <Plus className="h-3 w-3" aria-hidden="true" /> Post Role
 </button>
 </div>
 <div className="space-y-2" role="list" aria-label="Open positions">
 {OPEN_ROLES.map((role) => (
 <div key={role.title} role="listitem" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
 <div className="flex-1 min-w-0">
 <p className="text-xs font-bold text-navy">{role.title}</p>
 <p className="text-[10px] text-slate-500">{role.dept} · {role.applicants} applicants</p>
 </div>
 <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black capitalize ${PRIORITY_STYLE[role.priority]}`}>
 {role.priority}
 </span>
 <ArrowUpRight className="h-3.5 w-3.5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
 </div>
 ))}
 </div>
 </GlassCard>
 );
}

/* ── Candidate Leaderboard ───────────────────────────────────────────────────── */ function CandidateBoard() {
 const [query, setQuery] = useState('');
 const filtered = CANDIDATES.filter(
 (c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.role.toLowerCase().includes(query.toLowerCase()),
 );

 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <Zap className="h-4 w-4 text-ember" aria-hidden="true" />
 <p className="text-sm font-black text-white">AI Candidate Scoring</p>
 </div>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
 <input
 type="search" value={query} onChange={(e) => setQuery(e.target.value)}
 placeholder="Search candidates…" aria-label="Search candidates"
 className="pl-8 pr-4 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-white placeholder:text-slate-600 outline-none focus:border-gold/30 transition-colors w-44"
 />
 </div>
 </div>
 <div className="overflow-x-auto -mx-6 px-6">
 <table className="w-full text-xs" aria-label="Candidate scoring board">
 <thead>
 <tr className="border-b border-white/5">
 {['Candidate', 'Role', 'AI Score', 'Stage', 'Source', 'Days', ''].map((h) => (
 <th key={h} className="text-left text-[10px] font-black text-slate-600 uppercase tracking-wide pb-3 pr-3">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filtered.map((c) => (
 <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
 <td className="py-3 pr-3">
 <div className="flex items-center gap-2">
 <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gold/30 to-ember/20 flex items-center justify-center text-[10px] font-black text-white">
 {c.name.split(' ').map((n) => n[0]).join('')}
 </div>
 <span className="font-bold text-navy">{c.name}</span>
 </div>
 </td>
 <td className="py-3 pr-3 text-slate-500">{c.role}</td>
 <td className="py-3 pr-3">
 <div className="flex items-center gap-2">
 <span className={`font-black ${c.score >= 90 ? 'text-jade' : c.score >= 80 ? 'text-gold' : 'text-slate-500'}`}>{c.score}</span>
 <div className="h-1 w-12 rounded-full bg-white/5">
 <div className="h-full rounded-full bg-gradient-to-r from-gold to-jade" style={{ width: `${c.score}%` }} />
 </div>
 </div>
 </td>
 <td className="py-3 pr-3">
 <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black capitalize ${STAGE_STYLE[c.stage]}`}>{c.stage}</span>
 </td>
 <td className="py-3 pr-3 text-slate-500">{c.source}</td>
 <td className="py-3 pr-3 text-slate-500">{c.days}d</td>
 <td className="py-3">
 <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
 <button aria-label={`Message ${c.name}`} className="text-slate-500 hover:text-white transition-colors">
 <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 <button aria-label={`Schedule ${c.name}`} className="text-slate-500 hover:text-white transition-colors">
 <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </GlassCard>
 );
}

// ── AtsDashboard ──────────────────────────────────────────────────────────────
/**
 * AtsDashboard — Phase 3B Priority 4
 * ATS & Recruitment Marketplace: pipeline funnel, source mix, time-to-hire
 * trend, AI candidate scoring board, and open role management.
 *
 * Data: DTO-shaped mock — Phase 3C wires to /api/recruitment endpoints.
 */
export function AtsDashboard() {
 return (
 <section aria-labelledby="ats-heading">
 <h1 id="ats-heading" className="sr-only">ATS & Recruitment Dashboard</h1>

 {/* Header */}
 <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
 <div>
 <p className="section-label text-gold mb-2">Recruitment Marketplace</p>
 <h2 className="text-3xl font-black tracking-tighter text-white">ATS Pipeline</h2>
 <p className="text-sm text-slate-500 mt-1">38 open roles · 1,482 active applicants · 22d avg time-to-hire</p>
 </div>
 <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-ember text-void text-xs font-black hover:scale-105 transition-transform">
 <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Post New Role
 </button>
 </div>

 {/* KPIs */}
 <SuspenseDashboardBoundary context="ATS KPIs" skeletonType="card" skeletonRows={4}>
 <KpiStrip tiles={ATS_KPIS as unknown as Parameters<typeof KpiStrip>[0]['tiles']} columns={4} />
 </SuspenseDashboardBoundary>

 {/* Trend + source */}
 <div className="mt-6 grid lg:grid-cols-3 gap-5">
 <div className="lg:col-span-2">
 <AreaTrendChart
 data={HIRE_TREND} xKey="month"
 series={[
 { key: 'applied', label: 'Applied', color: 'aqua' },
 { key: 'hired', label: 'Hired', color: 'jade' },
 ]}
 title="Application vs Hire Trend"
 subtitle="Last 6 months · applied vs hired"
 height={240}
 />
 </div>
 <DonutChart
 data={SOURCE_MIX as unknown as Parameters<typeof DonutChart>[0]['data']}
 title="Hire Source Mix"
 subtitle="Where candidates come from"
 height={240}
 />
 </div>

 {/* Funnel + open roles */}
 <div className="mt-5 grid lg:grid-cols-2 gap-5">
 <PipelineFunnel />
 <OpenRolesPanel />
 </div>

 {/* Candidate scoring board */}
 <div className="mt-5">
 <CandidateBoard />
 </div>
 </section>
 );
}
