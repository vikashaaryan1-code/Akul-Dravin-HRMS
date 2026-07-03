'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/modules/MetricCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';
import { locationHistoryTrend, locationSnapshotRecords } from '@/services/platform-data';
import { useUIStore } from '@/store/ui-store';

const toTimeLabel = (value: string) => new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export function LocationModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);

 const { data, isLive, loading, error } = useApiResource({
 loader: async () => {
 const [snapshot, history] = await Promise.all([
 platformApi.getLocationSnapshot(),
 platformApi.getLocationHistory(),
 ]);

 return {
 snapshot,
 history,
 };
 },
 fallback: {
 snapshot: locationSnapshotRecords,
 history: locationHistoryTrend,
 },
 });

 const metrics = useMemo(() => {
 const office = data.snapshot.filter((item) => item.zoneType.toLowerCase().includes('office')).length;
 const wfh = data.snapshot.filter((item) => item.zoneType.toLowerCase().includes('wfh')).length;
 const field = data.snapshot.filter((item) => item.zoneType.toLowerCase().includes('field')).length;

 return [
 {
 id: 'lc1',
 label: 'Office Presence',
 value: String(office),
 trend: 'Inside geofence',
 trendDirection: 'up' as const,
 },
 {
 id: 'lc2',
 label: 'Work From Home',
 value: String(wfh),
 trend: 'WFH active session',
 trendDirection: 'neutral' as const,
 },
 {
 id: 'lc3',
 label: 'Field Employees',
 value: String(field),
 trend: 'Client/location visits',
 trendDirection: 'up' as const,
 },
 {
 id: 'lc4',
 label: 'Location Feed',
 value: isLive ? 'Realtime' : 'Snapshot',
 trend: isLive ? 'GPS stream connected' : 'Fallback mode',
 trendDirection: 'up' as const,
 },
 ];
 }, [data.snapshot, isLive]);

 const locationBars = useMemo(
 () => data.history.map((item) => ({ name: item.name, value: Number(item.value) })),
 [data.history],
 );

 return (
 <div className="space-y-5">
 <PageTitle
 title="Location Tracking"
 description="Monitor office geofencing, work from home status, field movement, and location history for workforce visibility."
 />

 <ModuleLinksBar
 links={[
 { label: 'Tracking', href: `/tracking?role=${activeRole}` },
 { label: 'Attendance', href: `/attendance?role=${activeRole}` },
 { label: 'Performance', href: `/performance?role=${activeRole}` },
 { label: 'Dashboard', href: `/dashboard?role=${activeRole}` },
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
 <StackedBarChart title="Location Mode Distribution" data={locationBars} mode="single" />
 <GlassCard>
 <p className="text-sm font-semibold text-slate-800 ">Location Governance</p>
 <ul className="mt-3 space-y-2 text-sm text-slate-600 ">
 <li>Geofence policy status: Active</li>
 <li>Out-of-zone alerts (today): {data.snapshot.filter((item) => item.status.toLowerCase().includes('out')).length}</li>
 <li>WFH compliance check: 96.8%</li>
 <li>Field movement integrity: 98.3%</li>
 </ul>
 </GlassCard>
 </section>

 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Current Employee Location Snapshot</p>
 <SimpleTable
 columns={[
 { key: 'employeeName', label: 'Employee' },
 { key: 'locationLabel', label: 'Location' },
 { key: 'zoneType', label: 'Zone Type' },
 { key: 'status', label: 'Status' },
 {
 key: 'lastPingAt',
 label: 'Last Ping',
 render: (row) => toTimeLabel(row.lastPingAt),
 },
 ]}
 rows={data.snapshot}
 />
 </GlassCard>
 </div>
 );
}
