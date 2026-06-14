'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign,
  Activity, Zap, Globe, Download, Calendar,
} from 'lucide-react';
import {
  KpiStrip, AreaTrendChart, BarTrendChart, DonutChart,
  GlassCard, SuspenseDashboardBoundary,
} from '@/components/system';

// ── DTO-shaped mock data ──────────────────────────────────────────────────────
const ANALYTICS_KPIS = [
  { label: 'Revenue per Employee', value: '₹18.4L', trend: 6.2,  icon: DollarSign,  iconColor: 'text-jade' },
  { label: 'Workforce Efficiency', value: '87%',    trend: 3.1,  icon: Zap,         iconColor: 'text-gold' },
  { label: 'Attrition Rate',       value: '9.2%',   trend: -12,  icon: TrendingDown, iconColor: 'text-aqua' },
  { label: 'Time-to-Productivity', value: '41 days', trend: -8.4, icon: Activity,    iconColor: 'text-ember' },
];

type Period = '3m' | '6m' | '12m';

const HEADCOUNT_DATA: Record<Period, { month: string; total: number; joined: number; exits: number }[]> = {
  '3m': [
    { month: 'Feb', total: 418, joined: 12, exits: 6 },
    { month: 'Mar', total: 424, joined: 14, exits: 8 },
    { month: 'Apr', total: 430, joined: 18, exits: 12 },
  ],
  '6m': [
    { month: 'Nov', total: 392, joined: 8,  exits: 5  },
    { month: 'Dec', total: 395, joined: 10, exits: 7  },
    { month: 'Jan', total: 402, joined: 14, exits: 7  },
    { month: 'Feb', total: 418, joined: 12, exits: 6  },
    { month: 'Mar', total: 424, joined: 14, exits: 8  },
    { month: 'Apr', total: 430, joined: 18, exits: 12 },
  ],
  '12m': [
    { month: 'May',  total: 341, joined: 6,  exits: 4  },
    { month: 'Jun',  total: 351, joined: 12, exits: 2  },
    { month: 'Jul',  total: 362, joined: 14, exits: 3  },
    { month: 'Aug',  total: 371, joined: 12, exits: 3  },
    { month: 'Sep',  total: 378, joined: 9,  exits: 2  },
    { month: 'Oct',  total: 388, joined: 14, exits: 4  },
    { month: 'Nov',  total: 392, joined: 8,  exits: 4  },
    { month: 'Dec',  total: 395, joined: 10, exits: 7  },
    { month: 'Jan',  total: 402, joined: 14, exits: 7  },
    { month: 'Feb',  total: 418, joined: 12, exits: 6  },
    { month: 'Mar',  total: 424, joined: 14, exits: 8  },
    { month: 'Apr',  total: 430, joined: 18, exits: 12 },
  ],
};

const COST_TREND = [
  { month: 'Nov', people: 2.1, overhead: 0.8, tech: 0.4 },
  { month: 'Dec', people: 2.2, overhead: 0.9, tech: 0.4 },
  { month: 'Jan', people: 2.3, overhead: 0.8, tech: 0.5 },
  { month: 'Feb', people: 2.4, overhead: 0.9, tech: 0.5 },
  { month: 'Mar', people: 2.5, overhead: 1.0, tech: 0.6 },
  { month: 'Apr', people: 2.6, overhead: 1.0, tech: 0.6 },
];

const ATTRITION_BY_DEPT = [
  { dept: 'Sales',     rate: 14.2 },
  { dept: 'Eng',       rate: 7.1  },
  { dept: 'Ops',       rate: 9.3  },
  { dept: 'Finance',   rate: 5.4  },
  { dept: 'Marketing', rate: 11.8 },
  { dept: 'People',    rate: 4.2  },
];

const WORKFORCE_MIX = [
  { name: 'Full-Time',  value: 68, color: 'jade'  },
  { name: 'Contract',   value: 19, color: 'gold'  },
  { name: 'Intern',     value: 8,  color: 'aqua'  },
  { name: 'Part-Time',  value: 5,  color: 'ember' },
] as const;

const GEO_BREAKDOWN = [
  { location: 'Bengaluru',  headcount: 182, pct: 42 },
  { location: 'Mumbai',     headcount: 94,  pct: 22 },
  { location: 'Delhi NCR',  headcount: 77,  pct: 18 },
  { location: 'Hyderabad',  headcount: 52,  pct: 12 },
  { location: 'Remote',     headcount: 25,  pct: 6  },
];

const DEPT_PRODUCTIVITY = [
  { dept: 'Engineering', revPerHead: 28.4, efficiency: 91 },
  { dept: 'Sales',       revPerHead: 42.1, efficiency: 84 },
  { dept: 'Operations',  revPerHead: 14.2, efficiency: 88 },
  { dept: 'Finance',     revPerHead: 11.8, efficiency: 92 },
  { dept: 'Marketing',   revPerHead: 18.6, efficiency: 79 },
];

// ── Period Selector ───────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1" role="group" aria-label="Time period selector">
      {(['3m', '6m', '12m'] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-pressed={value === p}
          className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
            value === p ? 'bg-white/10 text-white' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ── Geo Breakdown Panel ───────────────────────────────────────────────────────
function GeoBreakdown() {
  return (
    <GlassCard className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-aqua" aria-hidden="true" />
        <p className="text-sm font-black text-white">Geo Distribution</p>
      </div>
      <div className="space-y-3" role="list" aria-label="Headcount by location">
        {GEO_BREAKDOWN.map((loc) => (
          <div key={loc.location} role="listitem" className="flex items-center gap-3">
            <p className="text-xs font-semibold text-slate-400 w-24 shrink-0">{loc.location}</p>
            <div className="flex-1 h-1.5 rounded-full bg-white/5" aria-hidden="true">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${loc.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-aqua/60"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-black text-white">{loc.headcount}</span>
              <span className="text-[10px] text-slate-600">({loc.pct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── Department Productivity Table ─────────────────────────────────────────────
function ProductivityTable() {
  return (
    <GlassCard className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-ember" aria-hidden="true" />
          <p className="text-sm font-black text-white">Dept Productivity</p>
        </div>
        <button aria-label="Export productivity report" className="h-7 w-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-xs" aria-label="Department productivity metrics">
          <thead>
            <tr className="border-b border-white/5">
              {['Department', 'Rev / Head (₹L)', 'Efficiency'].map((h) => (
                <th key={h} className="text-left text-[10px] font-black text-slate-600 uppercase tracking-wide pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEPT_PRODUCTIVITY.map((row) => (
              <tr key={row.dept} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-4 font-bold text-white">{row.dept}</td>
                <td className="py-2.5 pr-4">
                  <span className={`font-black ${row.revPerHead > 30 ? 'text-jade' : row.revPerHead > 20 ? 'text-gold' : 'text-slate-300'}`}>
                    {row.revPerHead}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${row.efficiency >= 90 ? 'bg-jade' : row.efficiency >= 80 ? 'bg-gold' : 'bg-ember'}`}
                        style={{ width: `${row.efficiency}%` }}
                        role="progressbar" aria-valuenow={row.efficiency} aria-valuemin={0} aria-valuemax={100}
                      />
                    </div>
                    <span className="font-black text-slate-300">{row.efficiency}%</span>
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

// ── AnalyticsDashboard ────────────────────────────────────────────────────────
/**
 * AnalyticsDashboard — Phase 3B Priority 8
 * Workforce Intelligence: headcount trends (3m/6m/12m), cost breakdown,
 * attrition by dept, workforce mix, geo distribution, productivity table.
 *
 * Data: DTO-shaped mock — Phase 3C wires to /api/analytics endpoints.
 */
export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('6m');

  return (
    <section aria-labelledby="analytics-heading">
      <h1 id="analytics-heading" className="sr-only">Analytics Intelligence</h1>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label text-aqua mb-2">Workforce Intelligence</p>
          <h2 className="text-3xl font-black tracking-tighter text-white">Analytics Command Center</h2>
          <p className="text-sm text-slate-400 mt-1">430 employees · ₹18.4L revenue / head · 9.2% attrition</p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button aria-label="Export analytics report" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 bg-white/5 text-xs font-black text-slate-400 hover:text-white transition-colors">
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <SuspenseDashboardBoundary context="Analytics KPIs" skeletonType="card" skeletonRows={4}>
        <KpiStrip tiles={ANALYTICS_KPIS as unknown as Parameters<typeof KpiStrip>[0]['tiles']} columns={4} />
      </SuspenseDashboardBoundary>

      {/* Headcount trend */}
      <div className="mt-6">
        <AreaTrendChart
          data={HEADCOUNT_DATA[period]} xKey="month"
          series={[
            { key: 'total',  label: 'Total Headcount', color: 'aqua'  },
            { key: 'joined', label: 'New Joiners',      color: 'jade'  },
            { key: 'exits',  label: 'Exits',            color: 'ember' },
          ]}
          title="Headcount Trend"
          subtitle={`Last ${period} · total, joiners, exits`}
          height={260}
        />
      </div>

      {/* Cost breakdown + workforce mix */}
      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <BarTrendChart
            data={COST_TREND} xKey="month"
            series={[
              { key: 'people',   label: 'People Cost (₹Cr)',  color: 'jade' },
              { key: 'overhead', label: 'Overhead (₹Cr)',      color: 'gold' },
              { key: 'tech',     label: 'Tech & Tools (₹Cr)', color: 'aqua' },
            ]}
            title="Cost Breakdown"
            subtitle="Last 6 months · people, overhead, tech (₹Cr)"
            height={240}
            stacked={true}
          />
        </div>
        <DonutChart
          data={WORKFORCE_MIX as unknown as Parameters<typeof DonutChart>[0]['data']}
          title="Workforce Mix"
          subtitle="Full-time, contract, intern"
          height={240}
        />
      </div>

      {/* Attrition by dept + geo */}
      <div className="mt-5 grid lg:grid-cols-2 gap-5">
        <BarTrendChart
          data={ATTRITION_BY_DEPT} xKey="dept"
          series={[{ key: 'rate', label: 'Attrition Rate (%)', color: 'ember' }]}
          title="Attrition by Department"
          subtitle="Trailing 12m · % of headcount"
          height={220}
        />
        <GeoBreakdown />
      </div>

      {/* Productivity table */}
      <div className="mt-5">
        <ProductivityTable />
      </div>
    </section>
  );
}
