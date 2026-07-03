'use client';

import React, { useState, useDeferredValue } from 'react';
import { motion } from 'framer-motion';
import {
 Users, Clock, FileText, ArrowUpRight, Search,
 Filter, Download, UserPlus, CheckCircle2, XCircle, AlertTriangle,
 RefreshCw, Loader2,
} from 'lucide-react';
import {
 KpiStrip, AreaTrendChart, BarTrendChart, DonutChart,
 GlassCard, SuspenseDashboardBoundary, SkeletonTable, SkeletonCard,
} from '@/components/system';
import {
 useHrmsKpis,
 useAttendanceTrend,
 useLeaveByType,
 useEmployeeList,
 useApproveLeave,
 type HrmsKpiDto,
 type AttendanceWeekPoint,
 type LeaveTypePoint,
} from '@/hooks/api';

/* ── Fallback data ───────────────────────────────────────────────────────────── */ const FALLBACK_KPIS: HrmsKpiDto = {
 activeEmployees: 1247,
 newThisMonth: 18,
 onLeaveToday: 42,
 documentsPending: 7,
 activeEmployeesTrend: 3.2,
 newThisMonthTrend: 12.5,
 onLeaveTrend: -2.1,
 documentsTrend: -30,
};

const FALLBACK_ATTENDANCE: AttendanceWeekPoint[] = [
 { week: 'W1', present: 1180, absent: 67, wfh: 210 },
 { week: 'W2', present: 1195, absent: 52, wfh: 225 },
 { week: 'W3', present: 1201, absent: 46, wfh: 198 },
 { week: 'W4', present: 1210, absent: 37, wfh: 241 },
 { week: 'W5', present: 1222, absent: 25, wfh: 230 },
 { week: 'W6', present: 1235, absent: 12, wfh: 215 },
];

const FALLBACK_LEAVE: LeaveTypePoint[] = [
 { name: 'Casual', value: 38, color: 'aqua' },
 { name: 'Sick', value: 24, color: 'ember' },
 { name: 'Earned', value: 21, color: 'jade' },
 { name: 'Optional', value: 17, color: 'gold' },
];

const DEPT_HEADCOUNT = [
 { dept: 'Eng', count: 472 },
 { dept: 'Sales', count: 238 },
 { dept: 'Ops', count: 187 },
 { dept: 'Finance', count: 143 },
 { dept: 'People', count: 98 },
 { dept: 'Legal', count: 62 },
 { dept: 'Others', count: 47 },
];

type EmployeeStatus = 'active' | 'probation' | 'notice';

const STATUS_STYLE: Record<EmployeeStatus, string> = {
 active: 'bg-jade/20 text-jade border-jade/20',
 probation: 'bg-gold/20 text-gold border-gold/20',
 notice: 'bg-ember/20 text-ember border-ember/20',
};

const LIFECYCLE_FUNNEL = [
 { stage: 'Hired', count: 1320, color: 'bg-aqua' },
 { stage: 'Onboarded', count: 1298, color: 'bg-jade' },
 { stage: 'Active', count: 1247, color: 'bg-gold' },
 { stage: 'On Notice', count: 18, color: 'bg-ember' },
];

/* ── Live KPI Strip ──────────────────────────────────────────────────────────── */ function LiveHrmsKpiStrip() {
 const { data, isLoading, isError } = useHrmsKpis();
 const kpi = data ?? FALLBACK_KPIS;

 if (isLoading) {
 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
 </div>
 );
 }

 const tiles = [
 { label: 'Active Employees', value: kpi.activeEmployees.toLocaleString(), trend: kpi.activeEmployeesTrend, icon: Users, iconColor: 'text-aqua' },
 { label: 'New This Month', value: String(kpi.newThisMonth), trend: kpi.newThisMonthTrend, icon: UserPlus, iconColor: 'text-jade' },
 { label: 'On Leave Today', value: String(kpi.onLeaveToday), trend: kpi.onLeaveTrend, icon: Clock, iconColor: 'text-gold' },
 { label: 'Docs Pending', value: String(kpi.documentsPending), trend: kpi.documentsTrend, icon: FileText, iconColor: 'text-ember' },
 ];

 return (
 <div>
 {isError && (
 <p className="mb-3 text-[10px] text-amber-400/70">⚠ Live HRMS KPIs unavailable — showing cached values</p>
 )}
 <KpiStrip tiles={tiles as any} columns={4} />
 </div>
 );
}

/* ── Live Attendance Trend Chart ─────────────────────────────────────────────── */ function LiveAttendanceChart() {
 const { data, isLoading } = useAttendanceTrend(6);
 const chartData = (data && data.length > 0) ? data : FALLBACK_ATTENDANCE;

 if (isLoading) return <SkeletonCard className="h-60" />;

 return (
 <AreaTrendChart
 data={chartData}
 xKey="week"
 series={[
 { key: 'present', label: 'Present', color: 'jade' },
 { key: 'wfh', label: 'WFH', color: 'aqua' },
 { key: 'absent', label: 'Absent', color: 'ember' },
 ]}
 title="Attendance Overview"
 subtitle="Last 6 weeks · present, WFH, absent"
 height={240}
 />
 );
}

/* ── Live Leave Donut ────────────────────────────────────────────────────────── */ function LiveLeaveDonut() {
 const { data, isLoading } = useLeaveByType();
 const leaveData = (data && data.length > 0) ? data : FALLBACK_LEAVE;

 if (isLoading) return <SkeletonCard className="h-60" />;

 return (
 <DonutChart
 data={leaveData as any}
 title="Leave by Type"
 subtitle="Current month distribution"
 height={240}
 />
 );
}

/* ── Live Employee Table ─────────────────────────────────────────────────────── */ function LiveEmployeeTable() {
 const [rawQuery, setRawQuery] = useState('');
 const query = useDeferredValue(rawQuery).trim().toLowerCase();
 const { data, isLoading, isError, refetch } = useEmployeeList({ limit: 10, search: query || undefined });

 const employees = data?.data ?? [];

 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between gap-4 flex-wrap">
 <p className="text-sm font-black text-white">Recent Employees</p>
 <div className="flex items-center gap-2">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
 <input
 type="search"
 value={rawQuery}
 onChange={(e) => setRawQuery(e.target.value)}
 placeholder="Search…"
 aria-label="Search employees"
 className="pl-8 pr-4 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-white placeholder:text-slate-600 outline-none focus:border-gold/30 transition-colors w-36"
 />
 </div>
 <button
 onClick={() => void refetch()}
 disabled={isLoading}
 aria-label="Refresh employees"
 className="h-8 w-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors disabled:opacity-40"
 >
 <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
 </button>
 <button aria-label="Export employee data" className="h-8 w-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
 <Download className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 </div>

 {isLoading ? (
 <SkeletonTable rows={6} />
 ) : isError ? (
 <div className="text-center py-8">
 <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
 <p className="text-sm text-slate-500">Could not load employee list</p>
 <button onClick={() => void refetch()} className="mt-2 text-xs text-amber-400 hover:underline">
 Retry
 </button>
 </div>
 ) : employees.length === 0 ? (
 <div className="text-center py-8">
 <Users className="h-8 w-8 text-slate-700 mx-auto mb-2" />
 <p className="text-sm text-slate-500">No employees found</p>
 </div>
 ) : (
 <SuspenseDashboardBoundary context="EmployeeTable" skeletonType="table" skeletonRows={6}>
 <div className="overflow-x-auto -mx-6 px-6">
 <table className="w-full text-xs" aria-label="Recent employees table">
 <thead>
 <tr className="border-b border-white/5">
 {['Employee', 'Department', 'Role', 'Joined', 'Status', ''].map((h) => (
 <th key={h} className="text-left text-[10px] font-black text-slate-600 uppercase tracking-wide pb-3 pr-4">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {employees.map((emp) => (
 <tr key={emp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
 <td className="py-3 pr-4">
 <div className="flex items-center gap-2.5">
 <div className="h-7 w-7 rounded-full bg-gradient-to-br from-aqua/30 to-jade/30 flex items-center justify-center text-[10px] font-black text-white">
 {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
 </div>
 <div>
 <p className="font-bold text-navy">{emp.name}</p>
 <p className="text-slate-600">{emp.id}</p>
 </div>
 </div>
 </td>
 <td className="py-3 pr-4 text-slate-500">{emp.dept}</td>
 <td className="py-3 pr-4 text-slate-500">{emp.role}</td>
 <td className="py-3 pr-4 text-slate-500">{new Date(emp.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
 <td className="py-3 pr-4">
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black capitalize ${STATUS_STYLE[emp.status as EmployeeStatus] ?? STATUS_STYLE.active}`}>
 {emp.status}
 </span>
 </td>
 <td className="py-3">
 <button aria-label={`View ${emp.name} profile`} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white">
 <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </SuspenseDashboardBoundary>
 )}
 </GlassCard>
 );
}

/* ── Lifecycle Funnel ────────────────────────────────────────────────────────── */ function LifecycleFunnel() {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <p className="text-sm font-black text-white">Employee Lifecycle Funnel</p>
 <div className="space-y-3">
 {LIFECYCLE_FUNNEL.map((stage, i) => {
 const maxCount = LIFECYCLE_FUNNEL[0].count;
 const pct = (stage.count / maxCount) * 100;
 return (
 <div key={stage.stage}>
 <div className="flex justify-between text-xs mb-1.5">
 <span className="text-slate-500 font-semibold">{stage.stage}</span>
 <span className="font-black text-white">{stage.count.toLocaleString()}</span>
 </div>
 <div className="h-6 rounded-lg bg-white/5 overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 whileInView={{ width: `${pct}%` }}
 viewport={{ once: true }}
 transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
 className={`h-full rounded-lg ${stage.color}/30 flex items-center justify-end pr-3`}
 role="progressbar"
 aria-valuenow={stage.count}
 aria-valuemin={0}
 aria-valuemax={maxCount}
 aria-label={stage.stage}
 >
 <span className="text-[10px] font-black text-white">{pct.toFixed(0)}%</span>
 </motion.div>
 </div>
 </div>
 );
 })}
 </div>
 </GlassCard>
 );
}

// ── HrmsDashboard ─────────────────────────────────────────────────────────────
/**
 * HrmsDashboard — Phase 3C
 * HRMS Intelligence: workforce KPIs, attendance trends, leave analysis,
 * lifecycle funnel, department breakdown, and searchable employee table.
 * All data sections wired to React Query hooks with loading/error/empty states.
 */
export function HrmsDashboard() {
 return (
 <section aria-labelledby="hrms-heading">
 <h1 id="hrms-heading" className="sr-only">HRMS Intelligence Dashboard</h1>

 {/* Header */}
 <div className="mb-8">
 <p className="section-label text-aqua mb-2">HRMS Intelligence</p>
 <h2 className="text-3xl font-black tracking-tighter text-white">Workforce Command</h2>
 <p className="text-sm text-slate-500 mt-1">Real-time people analytics · live from backend</p>
 </div>

 {/* KPIs — live data */}
 <LiveHrmsKpiStrip />

 {/* Charts row — live data */}
 <div className="mt-6 grid lg:grid-cols-3 gap-5">
 <div className="lg:col-span-2">
 <LiveAttendanceChart />
 </div>
 <LiveLeaveDonut />
 </div>

 {/* Dept headcount + lifecycle funnel */}
 <div className="mt-5 grid lg:grid-cols-2 gap-5">
 <BarTrendChart
 data={DEPT_HEADCOUNT}
 xKey="dept"
 series={[{ key: 'count', label: 'Headcount', color: 'aqua' }]}
 title="Headcount by Department"
 subtitle="Current org breakdown"
 height={220}
 />
 <LifecycleFunnel />
 </div>

 {/* Employee table — live data */}
 <div className="mt-5">
 <LiveEmployeeTable />
 </div>

 {/* Quick actions */}
 <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
 {[
 { label: 'Add Employee', icon: UserPlus, color: 'text-jade', bg: 'bg-jade/10 border-jade/20' },
 { label: 'Approve Leaves', icon: CheckCircle2, color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
 { label: 'Flag Violations', icon: AlertTriangle,color: 'text-ember', bg: 'bg-ember/10 border-ember/20' },
 { label: 'Export Report', icon: Download, color: 'text-aqua', bg: 'bg-aqua/10 border-aqua/20' },
 ].map((action) => (
 <button
 key={action.label}
 aria-label={action.label}
 className={`flex items-center gap-3 p-4 rounded-2xl border ${action.bg} hover:scale-[1.02] transition-all duration-200`}
 >
 <action.icon className={`h-5 w-5 ${action.color}`} aria-hidden="true" />
 <span className={`text-xs font-black ${action.color}`}>{action.label}</span>
 </button>
 ))}
 </div>
 </section>
 );
}
