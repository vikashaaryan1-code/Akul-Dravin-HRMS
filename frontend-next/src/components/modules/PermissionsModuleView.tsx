'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { MetricCard } from '@/components/modules/MetricCard';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi } from '@/services/api/platform-api';
import { permissionAuditRecords, permissionRoleRecords } from '@/services/platform-data';
import { useUIStore } from '@/store/ui-store';
import { canPerformAction } from '@/utils/action-permissions';

const toDateTimeLabel = (value: string) =>
 new Date(value).toLocaleString('en-IN', {
 day: '2-digit',
 month: 'short',
 hour: '2-digit',
 minute: '2-digit',
 });

export function PermissionsModuleView() {
 const activeRole = useUIStore((state) => state.activeRole);
 const canGrant = canPerformAction(activeRole, 'permissions.grant');
 const canRevoke = canPerformAction(activeRole, 'permissions.revoke');

 const { data, isLive, loading, error } = useApiResource({
 loader: async () => {
 const [roles, audits] = await Promise.all([
 platformApi.getPermissionRoles(),
 platformApi.getPermissionAudits(),
 ]);

 return {
 roles,
 audits,
 };
 },
 fallback: {
 roles: permissionRoleRecords,
 audits: permissionAuditRecords,
 },
 });

 const metrics = useMemo(() => {
 const editableRoles = data.roles.filter((role) => !role.canEdit.toLowerCase().includes('none')).length;
 const approvalRoles = data.roles.filter((role) => !role.canApprove.toLowerCase().includes('none')).length;

 return [
 {
 id: 'pm1',
 label: 'Configured Roles',
 value: String(data.roles.length),
 trend: 'RBAC templates active',
 trendDirection: 'up' as const,
 },
 {
 id: 'pm2',
 label: 'Editable Roles',
 value: String(editableRoles),
 trend: 'Policy-compliant edit scope',
 trendDirection: 'up' as const,
 },
 {
 id: 'pm3',
 label: 'Approval Roles',
 value: String(approvalRoles),
 trend: 'Controlled approval rights',
 trendDirection: 'up' as const,
 },
 {
 id: 'pm4',
 label: 'Audit Feed',
 value: isLive ? 'Realtime' : 'Snapshot',
 trend: `${data.audits.length} recent actions`,
 trendDirection: 'neutral' as const,
 },
 ];
 }, [data.audits.length, data.roles, isLive]);

 return (
 <div className="space-y-5">
 <PageTitle
 title="Permission Control"
 description="Manage role-based access control, approval authority, and enterprise audit history for secure operations."
 actions={
 <div className="flex flex-col items-start gap-2">
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 disabled={!canGrant}
 className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 "
 title={canGrant ? 'Grant Access' : 'Your role cannot grant permissions.'}
 >
 Grant Access
 </button>
 <button
 type="button"
 disabled={!canRevoke}
 className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45 "
 title={canRevoke ? 'Revoke Access' : 'Your role cannot revoke permissions.'}
 >
 Revoke Access
 </button>
 </div>
 {!canGrant || !canRevoke ? (
 <p className="text-[11px] text-amber-700 ">Permission actions are limited by active role policy.</p>
 ) : null}
 </div>
 }
 />

 <ModuleLinksBar
 links={[
 { label: 'Dashboard', href: `/dashboard?role=${activeRole}` },
 { label: 'Settings', href: `/settings?role=${activeRole}` },
 { label: 'Analytics', href: `/analytics?role=${activeRole}` },
 { label: 'Employees', href: `/employees?role=${activeRole}` },
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
 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Role Permission Matrix</p>
 <SimpleTable
 columns={[
 { key: 'roleName', label: 'Role' },
 { key: 'canView', label: 'Can View' },
 { key: 'canEdit', label: 'Can Edit' },
 { key: 'canApprove', label: 'Can Approve' },
 { key: 'canAccessReports', label: 'Reports' },
 ]}
 rows={data.roles}
 />
 </GlassCard>

 <GlassCard className="space-y-3">
 <p className="text-sm font-semibold text-slate-800 ">Permission Audit Logs</p>
 <SimpleTable
 columns={[
 { key: 'actor', label: 'Actor' },
 { key: 'action', label: 'Action' },
 {
 key: 'timestamp',
 label: 'Timestamp',
 render: (row) => toDateTimeLabel(row.timestamp),
 },
 ]}
 rows={data.audits}
 />
 </GlassCard>
 </section>
 </div>
 );
}
