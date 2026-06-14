'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, CheckCircle2, AlertTriangle, Clock,
  Download, Send, ArrowUpRight, TrendingUp, Lock,
  FileText, RefreshCw,
} from 'lucide-react';
import {
  KpiStrip, BarTrendChart, AreaTrendChart, DonutChart,
  GlassCard, SuspenseDashboardBoundary,
} from '@/components/system';

// ── DTO-shaped mock data ──────────────────────────────────────────────────────
const PAYROLL_KPIS = [
  { label: 'Gross Payroll (Apr)',  value: '₹4.82Cr',  trend: 1.8,  icon: DollarSign,   iconColor: 'text-gold' },
  { label: 'Net Disbursed',        value: '₹3.91Cr',  trend: 1.6,  icon: CheckCircle2, iconColor: 'text-jade' },
  { label: 'Pending Approvals',    value: '4',         trend: -33,  icon: Clock,        iconColor: 'text-ember' },
  { label: 'Tax Deducted (TDS)',   value: '₹42.6L',   trend: 2.4,  icon: FileText,     iconColor: 'text-aqua' },
];

const PAYROLL_TREND = [
  { month: 'Nov', gross: 442, net: 358, tax: 38 },
  { month: 'Dec', gross: 451, net: 365, tax: 39 },
  { month: 'Jan', gross: 458, net: 371, tax: 40 },
  { month: 'Feb', gross: 463, net: 374, tax: 41 },
  { month: 'Mar', gross: 471, net: 381, tax: 42 },
  { month: 'Apr', gross: 482, net: 391, tax: 43 },
];

const DEPT_PAYROLL = [
  { dept: 'Eng',     cost: 1820 },
  { dept: 'Sales',   cost: 940  },
  { dept: 'Ops',     cost: 730  },
  { dept: 'Finance', cost: 510  },
  { dept: 'People',  cost: 380  },
  { dept: 'Legal',   cost: 180  },
];

const PAYROLL_SPLIT = [
  { name: 'Basic',    value: 45, color: 'gold'  },
  { name: 'HRA',      value: 22, color: 'aqua'  },
  { name: 'Special',  value: 18, color: 'jade'  },
  { name: 'Variable', value: 15, color: 'ember' },
] as const;

type PayStatus = 'disbursed' | 'processing' | 'pending' | 'flagged';
const STATUS_STYLE: Record<PayStatus, string> = {
  disbursed:  'bg-jade/15  text-jade  border-jade/20',
  processing: 'bg-aqua/15  text-aqua  border-aqua/20',
  pending:    'bg-gold/15  text-gold  border-gold/20',
  flagged:    'bg-ember/15 text-ember border-ember/20',
};
const STATUS_ICON: Record<PayStatus, any> = {
  disbursed: CheckCircle2, processing: RefreshCw, pending: Clock, flagged: AlertTriangle,
};

const PAYSLIP_ROWS = [
  { id: 'PAY-0041', name: 'Aarav Mehta',    dept: 'Engineering', amount: '₹1,28,400', month: 'Apr 2026', status: 'disbursed'  as PayStatus },
  { id: 'PAY-0042', name: 'Priya Nair',     dept: 'Sales',       amount: '₹84,200',  month: 'Apr 2026', status: 'disbursed'  as PayStatus },
  { id: 'PAY-0043', name: 'Rohan Joshi',    dept: 'Operations',  amount: '₹72,600',  month: 'Apr 2026', status: 'processing' as PayStatus },
  { id: 'PAY-0044', name: 'Divya Krishnan', dept: 'Finance',     amount: '₹92,100',  month: 'Apr 2026', status: 'pending'    as PayStatus },
  { id: 'PAY-0045', name: 'Karan Sharma',   dept: 'Legal',       amount: '₹1,10,500',month: 'Apr 2026', status: 'flagged'    as PayStatus },
];

const VARIANCE_ALERTS = [
  { dept: 'Engineering', variance: '+₹12.4L', reason: 'Performance bonus batch',    severity: 'info'    as const },
  { dept: 'Sales',        variance: '+₹4.2L',  reason: 'Commission reconciliation', severity: 'warning' as const },
  { dept: 'Operations',   variance: '-₹1.8L',  reason: 'Unconfirmed attendance',    severity: 'error'   as const },
];

const ALERT_STYLE = {
  info:    { color: 'text-aqua',  border: 'border-aqua/20',  bg: 'bg-aqua/5'  },
  warning: { color: 'text-gold',  border: 'border-gold/20',  bg: 'bg-gold/5'  },
  error:   { color: 'text-ember', border: 'border-ember/20', bg: 'bg-ember/5' },
};

// ── Cycle Status Banner ───────────────────────────────────────────────────────
type CyclePhase = 'draft' | 'review' | 'processing' | 'disbursed';
const CYCLE_STEPS: { label: string; phase: CyclePhase }[] = [
  { label: 'Draft',       phase: 'draft'       },
  { label: 'Under Review',phase: 'review'      },
  { label: 'Processing',  phase: 'processing'  },
  { label: 'Disbursed',   phase: 'disbursed'   },
];

function CycleStatusBanner() {
  const currentPhase: CyclePhase = 'disbursed';
  const currentIndex = CYCLE_STEPS.findIndex((s) => s.phase === currentPhase);

  return (
    <GlassCard className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-white">April 2026 Cycle Status</p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-jade/10 border border-jade/20 text-xs font-black text-jade">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Disbursed
        </span>
      </div>
      <div className="flex items-center gap-0" role="progressbar" aria-label="Payroll cycle progress">
        {CYCLE_STEPS.map((step, i) => {
          const isPast    = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture  = i > currentIndex;
          return (
            <React.Fragment key={step.phase}>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isPast || isCurrent ? 'bg-jade/20 border-jade' : 'bg-white/5 border-white/10'
                }`}>
                  {isPast || isCurrent
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-jade" aria-hidden="true" />
                    : <span className="h-1.5 w-1.5 rounded-full bg-white/20" aria-hidden="true" />
                  }
                </div>
                <p className={`text-[10px] font-bold text-center ${
                  isCurrent ? 'text-jade' : isFuture ? 'text-slate-700' : 'text-slate-500'
                }`}>{step.label}</p>
              </div>
              {i < CYCLE_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mb-5 mx-1 rounded-full transition-colors ${
                  i < currentIndex ? 'bg-jade/50' : 'bg-white/5'
                }`} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ── PayrollDashboard ──────────────────────────────────────────────────────────
/**
 * PayrollDashboard — Phase 3B Priority 3
 * Payroll Control Tower: cycle status, cost trends, variance alerts,
 * department breakdown, payslip table, and compliance badges.
 *
 * Data: DTO-shaped mock — Phase 3C wires to /api/payroll endpoints.
 */
export function PayrollDashboard() {
  return (
    <section aria-labelledby="payroll-heading">
      <h1 id="payroll-heading" className="sr-only">Payroll Control Tower</h1>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label text-gold mb-2">Payroll Control Tower</p>
          <h2 className="text-3xl font-black tracking-tighter text-white">April 2026 Cycle</h2>
          <p className="text-sm text-slate-400 mt-1">Gross: ₹4.82 Cr · Net: ₹3.91 Cr · 1,247 employees</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/8 transition-colors">
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-ember text-void text-xs font-black hover:scale-105 transition-transform">
            <Send className="h-3.5 w-3.5" aria-hidden="true" /> Run Next Cycle
          </button>
        </div>
      </div>

      {/* KPIs */}
      <SuspenseDashboardBoundary context="Payroll KPIs" skeletonType="card" skeletonRows={4}>
        <KpiStrip tiles={PAYROLL_KPIS as unknown as Parameters<typeof KpiStrip>[0]['tiles']} columns={4} />
      </SuspenseDashboardBoundary>

      {/* Cycle status */}
      <div className="mt-5">
        <CycleStatusBanner />
      </div>

      {/* Charts row */}
      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <AreaTrendChart
            data={PAYROLL_TREND}
            xKey="month"
            series={[
              { key: 'gross', label: 'Gross (₹L)', color: 'gold'  },
              { key: 'net',   label: 'Net (₹L)',   color: 'jade'  },
              { key: 'tax',   label: 'TDS (₹L)',   color: 'ember' },
            ]}
            title="Payroll Trend"
            subtitle="Last 6 months · gross, net, TDS"
            height={240}
          />
        </div>
        <DonutChart
          data={PAYROLL_SPLIT as unknown as Parameters<typeof DonutChart>[0]['data']}
          title="Salary Component Split"
          subtitle="April 2026 breakdown"
          height={240}
        />
      </div>

      {/* Dept cost + variance alerts */}
      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <BarTrendChart
            data={DEPT_PAYROLL}
            xKey="dept"
            series={[{ key: 'cost', label: 'Payroll (₹L)', color: 'gold' }]}
            title="Department Payroll Cost"
            subtitle="April 2026 cycle · in ₹ Lakhs"
            height={220}
          />
        </div>
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gold" aria-hidden="true" />
            <p className="text-sm font-black text-white">Variance Alerts</p>
          </div>
          <div className="space-y-3" role="list" aria-label="Payroll variance alerts">
            {VARIANCE_ALERTS.map((alert) => {
              const s = ALERT_STYLE[alert.severity];
              return (
                <div key={alert.dept} role="listitem" className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-xs font-black ${s.color}`}>{alert.dept}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alert.reason}</p>
                    </div>
                    <span className={`text-xs font-black ${s.color} shrink-0`}>{alert.variance}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Payslip table */}
      <div className="mt-5">
        <GlassCard className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-aqua" aria-hidden="true" />
              <p className="text-sm font-black text-white">Payslip Register</p>
            </div>
            <span className="section-label text-slate-600">Audit-locked</span>
          </div>
          <SuspenseDashboardBoundary context="PayslipTable" skeletonType="table" skeletonRows={5}>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-xs" aria-label="Payslip register">
                <thead>
                  <tr className="border-b border-white/5">
                    {['ID', 'Employee', 'Department', 'Amount', 'Period', 'Status', ''].map((h) => (
                      <th key={h} className="text-left text-[10px] font-black text-slate-600 uppercase tracking-wide pb-3 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAYSLIP_ROWS.map((row) => {
                    const Icon = STATUS_ICON[row.status];
                    return (
                      <tr key={row.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 pr-4 font-mono text-slate-500">{row.id}</td>
                        <td className="py-3 pr-4 font-bold text-white">{row.name}</td>
                        <td className="py-3 pr-4 text-slate-400">{row.dept}</td>
                        <td className="py-3 pr-4 font-black text-gold">{row.amount}</td>
                        <td className="py-3 pr-4 text-slate-500">{row.month}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black capitalize ${STATUS_STYLE[row.status]}`}>
                            <Icon className="h-3 w-3" aria-hidden="true" />
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <button aria-label={`Download payslip ${row.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white">
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SuspenseDashboardBoundary>
        </GlassCard>
      </div>

      {/* Compliance footer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-5 surface-raised border-subtle rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center"
        role="status"
        aria-label="Payroll compliance status"
      >
        <p className="section-label text-slate-600">Compliance</p>
        {['PF Filed', 'ESIC Filed', 'TDS Filed', 'PT Compliant', 'Audit-Locked'].map((badge) => (
          <div key={badge} className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-jade" aria-hidden="true" />
            <span className="text-xs font-bold text-slate-400">{badge}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <TrendingUp className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
          <span className="text-xs font-bold text-gold">₹4.82 Cr disbursed — 0 disputes</span>
        </div>
      </motion.div>
    </section>
  );
}
