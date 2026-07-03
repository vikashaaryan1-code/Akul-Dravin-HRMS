'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { MetricCard } from '@/components/modules/MetricCard';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';
import { workActivityRecords, workdaySummaryRecords, workHourTrend } from '@/services/platform-data';
import { useUIStore } from '@/store/ui-store';

export function TrackingModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);

 const { data, isLive, loading, error } = useApiResource({
 loader: async () => {
 const [activities, workdays] = await Promise.all([
 platformApi.getWorkActivities(),
 platformApi.getWorkdaySummary(),
 ]);

 return {
 activities,
 workdays,
 };
 },
 fallback: {
 activities: workActivityRecords,
 workdays: workdaySummaryRecords,
 },
 });

 const metrics = useMemo(() => {
 const totalTodayHours = data.activities.reduce((sum, row) => sum + Number(row.productiveHours), 0);
 const weekHours = workHourTrend.reduce((sum, row) => sum + row.value, 0);
 const monthHours = data.workdays.reduce((sum, row) => sum + Number(row.presentDays) * 8, 0);

 return [
 {
 id: 'm1',
 label: 'Hours Worked Today',
 value: `${totalTodayHours.toFixed(1)}h`,
 trend: isLive ? 'Live from tracking API' : 'Fallback data snapshot',
 trendDirection: 'up' as const,
 },
 {
 id: 'm2',
 label: 'Hours This Week',
 value: `${weekHours}h`,
 trend: '+6h from previous week',
 trendDirection: 'up' as const,
 },
 {
 id: 'm3',
 label: 'Hours This Month',
 value: `${monthHours}h`,
 trend: 'Workday-derived estimate',
 trendDirection: 'neutral' as const,
 },
 {
 id: 'm4',
 label: 'Productivity Avg',
 value: `${(totalTodayHours / Math.max(data.activities.length, 1)).toFixed(1)}h/employee`,
 trend: '+4.2% throughput',
 trendDirection: 'up' as const,
 },
 ];
 }, [data.activities, data.workdays, isLive]);

 const workdayDistribution = useMemo(() => {
 const totals = data.workdays.reduce(
 (acc, row) => ({
 present: acc.present + Number(row.presentDays),
 absent: acc.absent + Number(row.absentDays),
 leave: acc.leave + Number(row.paidLeave) + Number(row.unpaidLeave),
 }),
 { present: 0, absent: 0, leave: 0 },
 );

 return [
 { name: 'Present', value: totals.present },
 { name: 'Absent', value: totals.absent },
 { name: 'Leave', value: totals.leave },
 ];
 }, [data.workdays]);

 return (
 <div className="space-y-5">
 <PageTitle
 title="Work Activity Tracking"
 description="Track login/logout, project effort, and employee productivity across daily, weekly, and monthly windows."
 />

 <ModuleLinksBar
 links={[
 { label: 'Attendance', href: `/attendance?role=${activeRole}` },
 { label: 'Tasks', href: `/tasks?role=${activeRole}` },
 { label: 'Performance', href: `/performance?role=${activeRole}` },
 { label: 'Location', href: `/location?role=${activeRole}` },
 ]}
 isLive={isLive}
 loading={loading}
 error={error}
 />

 <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 {metrics.map((metric) => (
 <MetricCard key={metric.id} metric={metric} />
 ))}
 </section>

 <section className="grid gap-4 xl:grid-cols-2">
 <TrendAreaChart title="Weekly Productive Hours" data={workHourTrend} color="#0F8B8D" />
 <StackedBarChart title="Workday Distribution Snapshot" data={workdayDistribution} mode="single" />
 </section>

 <section className="grid gap-4 xl:grid-cols-2">
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Work Activity Log</p>
 <SimpleTable
 columns={[
 { key: 'employeeName', label: 'Employee' },
 { key: 'loginAt', label: 'Login' },
 { key: 'logoutAt', label: 'Logout' },
 { key: 'project', label: 'Project' },
 { key: 'tasksCompleted', label: 'Tasks' },
 {
 key: 'productiveHours',
 label: 'Productive Hours',
 render: (row) => `${row.productiveHours}h`,
 },
 ]}
 rows={data.activities}
 />
 </GlassCard>

 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Workday Analytics</p>
 <SimpleTable
 columns={[
 { key: 'employeeName', label: 'Employee' },
 { key: 'presentDays', label: 'Present' },
 { key: 'absentDays', label: 'Absent' },
 { key: 'paidLeave', label: 'Paid Leave' },
 { key: 'unpaidLeave', label: 'Unpaid Leave' },
 { key: 'wfhDays', label: 'WFH Days' },
 ]}
 rows={data.workdays}
 />
 </GlassCard>
 </section>
 </div>
 );
}
