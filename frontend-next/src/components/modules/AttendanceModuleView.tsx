'use client';

import { useMemo, useState, useCallback } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SkeletonCard, SkeletonTable } from '@/components/system/Suspense';
import { attendanceHeatMap, employeeRecords } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatDateTime } from '@/utils/formatters';
import { Clock, Users, CheckCircle2, AlertTriangle, LogIn, LogOut, RefreshCw, MapPin, Calendar } from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────────────────── */ type AttendanceRow = {
 id: string;
 name: string;
 department: string;
 checkIn: string;
 checkOut: string;
 status: string;
};

type CheckInStatus = 'idle' | 'checking-in' | 'checked-in' | 'checking-out' | 'done';

/* ── Fallback rows ───────────────────────────────────────────────────────────── */ const fallbackRows = employeeRecords.map((employee, index) => ({
 id: employee.id,
 name: employee.name,
 department: employee.department,
 checkIn: index % 2 === 0 ? '09:05 AM' : '09:21 AM',
 checkOut: index % 3 === 0 ? '06:34 PM' : '06:10 PM',
 status: employee.status === 'On Leave' ? 'Leave' : 'Present',
}));

/* ── Check-In/Out Widget ─────────────────────────────────────────────────────── */ function CheckInWidget() {
 const [status, setStatus] = useState<CheckInStatus>('idle');
 const [checkedInAt, setCheckedInAt] = useState<string | null>(null);

 const handleCheckIn = useCallback(async () => {
 try {
 setStatus('checking-in');
 // Request geolocation if available
 let lat, lng;
 if (navigator.geolocation) {
 try {
 const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
 navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
 });
 lat = pos.coords.latitude;
 lng = pos.coords.longitude;
 } catch (e) {
 console.warn('Geolocation failed or denied', e);
 }
 }

 await platformApi.punchIn({ lat, lng });
 setCheckedInAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
 setStatus('checked-in');
 } catch (e) {
 console.error('Punch in failed:', e);
 setStatus('idle');
 alert(e instanceof Error ? e.message : 'Punch in failed');
 }
 }, []);

 const handleCheckOut = useCallback(async () => {
 try {
 setStatus('checking-out');
 await platformApi.punchOut();
 setStatus('done');
 } catch (e) {
 console.error('Punch out failed:', e);
 setStatus('checked-in');
 alert(e instanceof Error ? e.message : 'Punch out failed');
 }
 }, []);

 const now = new Date();
 const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
 const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

 return (
 <GlassCard className="p-5">
 <div className="flex items-center gap-2 mb-4">
 <Clock className="h-4 w-4 text-aqua" />
 <p className="text-sm font-semibold text-slate-100">My Attendance</p>
 <span className="ml-auto text-[10px] text-slate-500">{dateStr}</span>
 </div>

 <div className="text-center py-4">
 <p className="text-3xl font-black text-white tracking-tight">{timeStr}</p>
 <p className="mt-1 text-xs text-slate-500 flex items-center justify-center gap-1">
 <MapPin className="h-3 w-3" /> HQ Office · IST
 </p>
 </div>

 <div className="mt-4 space-y-2">
 {status === 'idle' && (
 <button
 onClick={handleCheckIn}
 className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-jade/80 to-emerald-600 py-2.5 text-sm font-bold text-navy hover:opacity-90 active:scale-[0.98] transition-all"
 >
 <LogIn className="h-4 w-4" /> Check In
 </button>
 )}

 {status === 'checking-in' && (
 <button disabled className="w-full flex items-center justify-center gap-2 rounded-xl bg-jade/20 py-2.5 text-sm font-bold text-jade opacity-70 cursor-not-allowed">
 <RefreshCw className="h-4 w-4 animate-spin" /> Checking in…
 </button>
 )}

 {status === 'checked-in' && (
 <>
 <div className="flex items-center gap-2 rounded-xl bg-jade/10 border border-jade/20 px-4 py-2.5">
 <CheckCircle2 className="h-4 w-4 text-jade shrink-0" />
 <p className="text-xs text-jade font-semibold">Checked in at {checkedInAt}</p>
 </div>
 <button
 onClick={handleCheckOut}
 className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember/10 border border-ember/20 py-2.5 text-sm font-bold text-ember hover:bg-ember/20 active:scale-[0.98] transition-all"
 >
 <LogOut className="h-4 w-4" /> Check Out
 </button>
 </>
 )}

 {status === 'checking-out' && (
 <button disabled className="w-full flex items-center justify-center gap-2 rounded-xl bg-ember/20 py-2.5 text-sm font-bold text-ember opacity-70 cursor-not-allowed">
 <RefreshCw className="h-4 w-4 animate-spin" /> Checking out…
 </button>
 )}

 {status === 'done' && (
 <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
 <CheckCircle2 className="h-4 w-4 text-slate-500 shrink-0" />
 <p className="text-xs text-slate-500 font-semibold">Checked out for today</p>
 </div>
 )}
 </div>

 <div className="mt-4 pt-4 border-t border-white/5">
 <div className="grid grid-cols-3 gap-2 text-center">
 {[
 { label: 'Today', value: '8h 12m' },
 { label: 'Week', value: '38h 45m' },
 { label: 'Month', value: '168h' },
 ].map((item) => (
 <div key={item.label}>
 <p className="text-xs font-bold text-navy">{item.value}</p>
 <p className="text-[10px] text-slate-500">{item.label}</p>
 </div>
 ))}
 </div>
 </div>
 </GlassCard>
 );
}

/* ── Main AttendanceModuleView ────────────────────────────────────────────────── */ export function AttendanceModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);

 const { data, isLive, loading, error, refresh } = useApiResource({
 loader: async () => {
 const attendance = await platformApi.getAttendance();

 const tableRows: AttendanceRow[] = attendance.slice(0, 120).map((entry) => {
 return {
 id: entry.id,
 name: entry.employee ? `${entry.employee.firstName} ${entry.employee.lastName}` : 'Employee',
 department: entry.employee?.department || 'General',
 checkIn: entry.checkInAt ? formatDateTime(entry.checkInAt) : '—',
 checkOut: entry.checkOutAt ? formatDateTime(entry.checkOutAt) : '—',
 status: entry.status.toLowerCase().includes('leave') ? 'Leave'
 : entry.status.toLowerCase().includes('absent') ? 'Absent' : 'Present',
 };
 });

 return { attendance, rows: tableRows };
 },
 fallback: {
 attendance: [],
 rows: [],
 },
 });

 const presentCount = useMemo(() => data.rows.filter((row) => row.status === 'Present').length, [data.rows]);
 const leaveCount = useMemo(() => data.rows.filter((row) => row.status === 'Leave').length, [data.rows]);
 const absentCount = useMemo(() => data.rows.filter((row) => row.status === 'Absent').length, [data.rows]);

 const attendancePercent = useMemo(() => {
 const total = data.rows.length;
 if (!total) return '95.3%';
 return `${((presentCount / total) * 100).toFixed(1)}%`;
 }, [data.rows.length, presentCount]);

 const heatmapData = useMemo(() => {
 if (!isLive || data.attendance.length === 0) return attendanceHeatMap;

 const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
 const bucket = new Map<string, { present: number; absent: number; leave: number }>();

 data.attendance.forEach((entry) => {
 const day = week[new Date(entry.attendanceDate).getDay()];
 const current = bucket.get(day) ?? { present: 0, absent: 0, leave: 0 };
 const status = entry.status.toLowerCase();

 if (status.includes('leave')) current.leave += 1;
 else if (status.includes('absent')) current.absent += 1;
 else current.present+= 1;

 bucket.set(day, current);
 });

 return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => ({
 name: day,
 present: bucket.get(day)?.present ?? 0,
 absent: bucket.get(day)?.absent ?? 0,
 leave: bucket.get(day)?.leave ?? 0,
 }));
 }, [data.attendance, isLive]);

 const kpiCards = [
 { label: 'Attendance Today', value: attendancePercent, icon: CheckCircle2, color: 'text-jade', gradient: 'from-jade/20 to-emerald-500/5' },
 { label: 'Present', value: presentCount || 38, icon: Users, color: 'text-aqua', gradient: 'from-aqua/20 to-cyan-500/5' },
 { label: 'On Leave', value: leaveCount || 21, icon: Calendar, color: 'text-gold', gradient: 'from-gold/20 to-amber-500/5' },
 { label: 'Absent', value: absentCount || 7, icon: AlertTriangle,color: 'text-ember', gradient: 'from-ember/20 to-red-500/5' },
 ];

 return (
 <div className="space-y-5">
 <PageTitle
 title="Attendance Dashboard"
 description="Real-time attendance tracking, punctuality trends, leave distribution, and cross-team visibility."
 />

 <ModuleLinksBar
 links={[
 { label: 'Employees', href: `/employees?role=${activeRole}` },
 { label: 'Payroll', href: `/payroll?role=${activeRole}` },
 { label: 'Leave', href: `/leave?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 {/* KPI Cards */}
 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {loading ? (
 Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
 ) : (
 kpiCards.map((card) => {
 const Icon = card.icon;
 return (
 <GlassCard key={card.label}>
 <div className={`p-5 rounded-2xl bg-gradient-to-br ${card.gradient}`}>
 <div className="flex items-center justify-between mb-3">
 <div className={`h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center ${card.color}`}>
 <Icon className="h-4 w-4" />
 </div>
 </div>
 <p className="text-2xl font-black text-white">{card.value}</p>
 <p className="mt-1 text-xs uppercase tracking-[0.13em] text-slate-500">{card.label}</p>
 </div>
 </GlassCard>
 );
 })
 )}
 </section>

 {/* Check-In Widget + Charts */}
 <section className="grid gap-4 xl:grid-cols-3">
 <CheckInWidget />
 <div className="xl:col-span-2">
 {loading ? (
 <SkeletonCard className="h-64" />
 ) : (
 <StackedBarChart title="Weekly Attendance Heatmap" data={heatmapData} mode="attendance" />
 )}
 </div>
 </section>

 {/* Trend Chart */}
 <section>
 {loading ? (
 <SkeletonCard className="h-56" />
 ) : (
 <TrendAreaChart
 title="Monthly Attendance Score"
 color="#0F8B8D"
 data={heatmapData.map((item) => ({ name: item.name, value: item.present + item.leave }))}
 />
 )}
 </section>

 {/* Attendance Log Table */}
 <section>
 <div className="mb-3 flex items-center justify-between">
 <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Today's Attendance Log</h2>
 {loading && <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />}
 </div>

 {loading ? (
 <SkeletonTable rows={8} />
 ) : error && data.rows.length === 0 ? (
 <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
 <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
 <p className="text-sm font-medium text-slate-500">Could not load attendance data</p>
 </div>
 ) : data.rows.length === 0 ? (
 <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
 <Users className="mx-auto mb-3 h-8 w-8 text-slate-700" />
 <p className="text-sm font-medium text-slate-500">No attendance records for today</p>
 </div>
 ) : (
 <SimpleTable
 rows={data.rows}
 columns={[
 { key: 'id', label: 'Attendance ID' },
 { key: 'name', label: 'Name' },
 { key: 'department', label: 'Department' },
 { key: 'checkIn', label: 'Check-In' },
 { key: 'checkOut', label: 'Check-Out' },
 {
 key: 'status',
 label: 'Status',
 render: (row) => (
 <StatusPill
 label={row.status}
 tone={row.status === 'Present' ? 'success' : row.status === 'Leave' ? 'warning' : 'danger'}
 />
 ),
 },
 ]}
 />
 )}
 </section>
 </div>
 );
}
