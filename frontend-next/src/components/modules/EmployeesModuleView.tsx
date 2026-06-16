'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, RefreshCw, Search, ShieldCheck, Sparkles, Star, Users, WalletCards } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { EmployeeFormModal } from '@/components/modules/EmployeeFormModal';
import { OMNIX_A2Z_ACTIVE_MODULES, OMNIX_A2Z_SERVICE_SUITES } from '@/lib/public-site';
import { employeeRecords } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import type { EmployeeRecord } from '@/types/platform';
import { useUIStore } from '@/store/ui-store';
import { canPerformAction } from '@/utils/action-permissions';
import { toRoleLabel, toSafePlatformRole } from '@/utils/platform-config';

type EmployeeViewModel = EmployeeRecord & {
  avatar: string;
  email: string;
  lane: string;
  manager: string;
  automation: number;
  tags: string[];
};

const statusOptions: Array<'All' | EmployeeRecord['status']> = ['All', 'Active', 'On Leave', 'Probation'];

const departmentRoutes: Record<string, string> = {
  Engineering: '/tasks',
  Finance: '/payroll',
  HR: '/documents',
  Operations: '/tracking',
  Sales: '/sales',
  General: '/employees',
};

const departmentManagers: Record<string, string> = {
  Engineering: 'Tony Stark',
  Finance: 'Bruce Wayne',
  HR: 'Sarah Connor',
  Operations: 'Diana Prince',
  Sales: 'Meera Joshi',
  General: 'People Command',
};

const departmentTags: Record<string, string[]> = {
  Engineering: ['Delivery', 'Code Health', 'Sprint'],
  Finance: ['Payroll', 'Approvals', 'Controls'],
  HR: ['Lifecycle', 'Policy', 'People Ops'],
  Operations: ['SLA', 'Shifts', 'Field Ops'],
  Sales: ['Pipeline', 'Revenue', 'Coaching'],
  General: ['Workforce', 'Operations', 'Visibility'],
};

const normalizeEmployeeStatus = (status: string): EmployeeRecord['status'] => {
  const normalized = status.toLowerCase();
  if (normalized.includes('leave')) {
    return 'On Leave';
  }

  if (normalized.includes('probation')) {
    return 'Probation';
  }

  return 'Active';
};

const toInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const toEmailSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

const derivePerformanceScore = (seed: string, status: EmployeeRecord['status']) => {
  let hash = 0;

  for (const character of seed) {
    hash = (hash + character.charCodeAt(0)) % 997;
  }

  const baseline = status === 'Active' ? 84 : status === 'On Leave' ? 79 : 75;
  return Math.min(96, baseline + (hash % 10));
};

const buildEmployeeModel = (employee: EmployeeRecord, email?: string): EmployeeViewModel => ({
  ...employee,
  avatar: toInitials(employee.name),
  email: email ?? `${toEmailSlug(employee.name)}@akuldravin.ai`,
  lane: departmentRoutes[employee.department] ?? departmentRoutes.General,
  manager: departmentManagers[employee.department] ?? departmentManagers.General,
  automation: Math.max(
    68,
    Math.min(99, employee.score + (employee.status === 'Active' ? 5 : employee.status === 'On Leave' ? -7 : -4)),
  ),
  tags: departmentTags[employee.department] ?? departmentTags.General,
});

export function EmployeesModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const safeRole = toSafePlatformRole(activeRole);
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | EmployeeRecord['status']>('All');
  const [selectedId, setSelectedId] = useState('EMP-1042');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['EMP-1042', 'EMP-1093', 'EMP-1215']);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const search = useDeferredValue(query).trim().toLowerCase();

  const fallbackRows = useMemo(() => employeeRecords.map((employee) => buildEmployeeModel(employee)), []);

  const { data: employeeRows, isLive, loading, error, refresh } = useApiResource<EmployeeViewModel[]>({
    loader: async () => {
      const rows = await platformApi.getEmployees();

      return rows.map((row) => {
        const status = normalizeEmployeeStatus(row.status);
        const id = row.employeeCode || row.id;
        const name = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email;

        return buildEmployeeModel(
          {
            id,
            name,
            department: row.department || 'General',
            designation: row.designation || 'Employee',
            status,
            location: row.department || 'HQ',
            score: derivePerformanceScore(id, status),
          },
          row.email,
        );
      });
    },
    fallback: fallbackRows,
  });

  const departments = useMemo(
    () => ['All', ...Array.from(new Set(employeeRows.map((entry) => entry.department)))],
    [employeeRows],
  );

  const filteredRows = useMemo(
    () =>
      employeeRows
        .filter((employee) => {
          const matchesSearch =
            !search ||
            [
              employee.name,
              employee.id,
              employee.designation,
              employee.department,
              employee.email,
              employee.manager,
              ...employee.tags,
            ]
              .join(' ')
              .toLowerCase()
              .includes(search);
          const matchesDepartment = departmentFilter === 'All' || employee.department === departmentFilter;
          const matchesStatus = statusFilter === 'All' || employee.status === statusFilter;
          return matchesSearch && matchesDepartment && matchesStatus;
        })
        .sort((left, right) => right.score + right.automation - (left.score + left.automation)),
    [departmentFilter, employeeRows, search, statusFilter],
  );

  useEffect(() => {
    if (filteredRows.length && !filteredRows.some((employee) => employee.id === selectedId)) {
      setSelectedId(filteredRows[0].id);
    }
  }, [filteredRows, selectedId]);

  const spotlight = filteredRows.find((employee) => employee.id === selectedId) ?? filteredRows[0] ?? employeeRows[0] ?? fallbackRows[0];
  const featuredRows = filteredRows.slice(0, 3);
  const pinnedRows = employeeRows.filter((employee) => favoriteIds.includes(employee.id));
  const activeCount = filteredRows.filter((employee) => employee.status === 'Active').length;
  const averageAutomation = filteredRows.length
    ? Math.round(filteredRows.reduce((sum, employee) => sum + employee.automation, 0) / filteredRows.length)
    : 0;
  const totalDocuments = filteredRows.reduce((sum, employee) => sum + employee.tags.length, 0);
  const canExport = canPerformAction(safeRole, 'dashboard.export');
  const canOpenDocuments = canPerformAction(safeRole, 'documents.preview');
  const statusMessage = isLive
    ? 'Realtime employee roster is synced with live profile data and workforce visibility controls.'
    : error
      ? 'Live employee endpoint is unavailable, so protected fallback roster data is currently active.'
      : 'Protected fallback roster data remains active until live employee sync reconnects.';

  const toggleFavorite = (employeeId: string) => {
    setFavoriteIds((current) =>
      current.includes(employeeId) ? current.filter((value) => value !== employeeId) : [...current, employeeId],
    );
  };

  const handleExport = () => {
    if (!canExport || !filteredRows.length) {
      return;
    }

    const rows = [
      ['Employee ID', 'Name', 'Department', 'Designation', 'Status', 'Location', 'Performance Score', 'Automation'],
      ...filteredRows.map((employee) => [
        employee.id,
        employee.name,
        employee.department,
        employee.designation,
        employee.status,
        employee.location,
        String(employee.score),
        String(employee.automation),
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'employee-atlas.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenCreateForm = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = () => {
    if (spotlight) {
      setEditingEmployee(spotlight);
      setIsFormOpen(true);
    }
  };

  const handleFormSuccess = () => {
    refresh();
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.18),_transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.97),rgba(255,255,255,0.86))] p-5 shadow-panel backdrop-blur dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.28),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.22),_transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.86))] sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-aqua/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-aqua">Employee Atlas</span>
              <span className="inline-flex rounded-full border border-slate-300/80 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                Active Role: {toRoleLabel(safeRole)}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${isLive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'}`}>
                {isLive ? 'Realtime roster' : 'Fallback roster'}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Employee Atlas Command Deck
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                A2Z-style premium employee screen with live roster search, spotlight profiles, exportable workforce data, and pinned command context.
              </p>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/55">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-aqua" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Workforce posture stable</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{statusMessage}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ink to-aqua px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-aqua/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Syncing...' : 'Sync Roster'}
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={!canExport || !filteredRows.length}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Export Roster
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateForm}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Add Employee
                  </button>
                  {canOpenDocuments ? (
                    <Link href={`/documents?role=${safeRole}`} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      Document Center
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Visible roster', value: filteredRows.length, note: `${employeeRows.length} employees indexed`, icon: Users },
                { label: 'Active now', value: activeCount, note: 'Live workforce availability', icon: Activity },
                { label: 'Automation', value: `${averageAutomation}%`, note: `${totalDocuments} linked workforce signals`, icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-3xl border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/55">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white/70 p-2.5 text-aqua dark:border-slate-700 dark:bg-slate-900/60">
                        <Icon size={18} />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{item.note}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/55">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Omnix A2Z sync</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Atlas modules are now mapped into the HRMS workspace</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {OMNIX_A2Z_ACTIVE_MODULES} Omnix modules across {OMNIX_A2Z_SERVICE_SUITES.length} grouped service suites are now accessible from AKUL DRAVIN HRMS, not only the public A2Z page.
                  </p>
                </div>
                <Link
                  href={`/a2z-atlas?role=${safeRole}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-ink to-aqua px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-aqua/20 transition hover:opacity-90"
                >
                  Open A2Z Atlas <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {OMNIX_A2Z_SERVICE_SUITES.map((suite) => (
                  <span
                    key={suite.id}
                    className="rounded-full border border-slate-300/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {suite.title}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-900/80 bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.26),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.26),_transparent_34%),linear-gradient(145deg,#111B2A,#0f172a)] p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.32)]">
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ember to-amber text-sm font-bold text-white">
                {spotlight.avatar}
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${spotlight.status === 'Active' ? 'bg-emerald-500/15 text-emerald-200' : spotlight.status === 'On Leave' ? 'bg-amber-500/15 text-amber-200' : 'bg-white/10 text-slate-200'}`}>
                {spotlight.status}
              </span>
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Roster spotlight</p>
            <h2 className="mt-2 text-2xl font-semibold">{spotlight.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{spotlight.designation} in {spotlight.department}. Manager: {spotlight.manager}.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {spotlight.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-100">{tag}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Performance</p>
                <p className="mt-2 text-2xl font-semibold">{spotlight.score}%</p>
                <p className="mt-2 text-xs text-slate-400">{spotlight.location}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Automation</p>
                <p className="mt-2 text-2xl font-semibold">{spotlight.automation}%</p>
                <p className="mt-2 text-xs text-slate-400">{spotlight.email}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`${spotlight.lane}?role=${safeRole}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100">
                Open lane <ArrowUpRight size={14} />
              </Link>
              <button type="button" onClick={handleOpenEditForm} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
                Edit profile
              </button>
              <button type="button" onClick={() => toggleFavorite(spotlight.id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15">
                <Star size={14} className={favoriteIds.includes(spotlight.id) ? 'fill-current' : ''} />
                {favoriteIds.includes(spotlight.id) ? 'Pinned' : 'Pin profile'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <ModuleLinksBar
        links={[
          { label: 'A2Z Atlas', href: `/a2z-atlas?role=${safeRole}` },
          { label: 'Attendance', href: `/attendance?role=${safeRole}` },
          { label: 'Payroll', href: `/payroll?role=${safeRole}` },
          { label: 'Documents', href: `/documents?role=${safeRole}` },
          { label: 'Tracking', href: `/tracking?role=${safeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <GlassCard>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Search & filters</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Workforce explorer</h2>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{filteredRows.length} results in current view</div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
                <Search size={15} className="text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search name, employee id, department or manager" />
              </label>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-900">
                {departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | EmployeeRecord['status'])} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-aqua dark:border-slate-700 dark:bg-slate-900">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </GlassCard>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featuredRows.map((employee) => (
              <button key={employee.id} type="button" onClick={() => setSelectedId(employee.id)} className={`rounded-[26px] border p-4 text-left shadow-panel transition hover:-translate-y-0.5 ${employee.id === spotlight.id ? 'border-aqua/40 bg-slate-950 text-white' : 'border-slate-200/80 bg-white/90 dark:border-slate-700/70 dark:bg-slate-900/65'}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ember to-amber text-sm font-bold text-white">{employee.avatar}</span>
                  <StatusPill label={employee.status} tone={employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'default'} />
                </div>
                <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] ${employee.id === spotlight.id ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{employee.department}</p>
                <h3 className="mt-2 text-lg font-semibold">{employee.name}</h3>
                <p className={`text-sm ${employee.id === spotlight.id ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>{employee.designation}</p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span>Score {employee.score}%</span>
                  <span>Auto {employee.automation}%</span>
                </div>
              </button>
            ))}
          </section>

          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Employee matrix</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Detailed roster table</h2>
              </div>
              <span className="rounded-full bg-aqua/10 px-3 py-1 text-xs font-semibold text-aqua">{spotlight.email}</span>
            </div>
            <div className="mt-5">
              <SimpleTable
                rows={filteredRows}
                columns={[
                  { key: 'id', label: 'Employee ID' },
                  {
                    key: 'name',
                    label: 'Name',
                    render: (employee) => (
                      <button type="button" onClick={() => setSelectedId(employee.id)} className="text-left">
                        <span className="block font-semibold text-slate-800 dark:text-slate-100">{employee.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{employee.manager}</span>
                      </button>
                    ),
                  },
                  { key: 'department', label: 'Department' },
                  { key: 'designation', label: 'Designation' },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (employee) => <StatusPill label={employee.status} tone={employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'default'} />,
                  },
                  { key: 'location', label: 'Location' },
                  {
                    key: 'score',
                    label: 'Performance Score',
                    render: (employee) => <span>{employee.score}% / {employee.automation}% auto</span>,
                  },
                ]}
              />
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Pinned roster</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Command rail</h2>
              </div>
              <Star size={18} className="text-amber-500" />
            </div>
            <div className="mt-5 space-y-3">
              {pinnedRows.map((employee) => (
                <button key={employee.id} type="button" onClick={() => setSelectedId(employee.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 text-left transition hover:border-aqua/40 dark:border-slate-700/70 dark:bg-slate-900/55">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{employee.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{employee.department} - {employee.designation}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{employee.score}%</p>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Signal stack</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">People ops notes</h2>
            <div className="mt-5 space-y-3">
              {[
                `${activeCount} employees are currently active in the visible roster view.`,
                `${spotlight.name} is the active spotlight for ${spotlight.department} workflows.`,
                `${averageAutomation}% automation readiness is visible across the filtered workforce.`,
                isLive ? 'Realtime employee data is connected to the backend mesh.' : 'Fallback employee data is protecting the experience while live APIs reconnect.',
              ].map((note) => (
                <div key={note} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-900/55">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500" />
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{note}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-aqua/10 p-3 text-aqua"><WalletCards size={18} /></div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Document readiness</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Linked employee document visibility</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Document Center now feels connected to the employee roster instead of living as an isolated block.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Attendance pulse</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Attendance, tracking, and role context are now tied directly into the same employee command flow.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Performance context</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Performance score and automation readiness are visible together so the page feels more premium and actionable.</p>
        </GlassCard>
      </section>

      <EmployeeFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employeeToEdit={editingEmployee}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
