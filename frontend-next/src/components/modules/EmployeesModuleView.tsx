'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { employeeRecords } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import type { EmployeeRecord } from '@/types/platform';
import { useUIStore } from '@/store/ui-store';

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

export function EmployeesModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const [query, setQuery] = useState('');
  // ⚡ BOLT: Defer query updates to keep the search input responsive
  // during intensive list filtering.
  const deferredQuery = useDeferredValue(query);
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const { data: employeeRows, isLive, loading, error } = useApiResource({
    loader: async () => {
      const rows = await platformApi.getEmployees();

      return rows.map((row) => ({
        id: row.employeeCode || row.id,
        name: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || row.email,
        department: row.department || 'General',
        designation: row.designation || 'Employee',
        status: normalizeEmployeeStatus(row.status),
        location: 'Global',
        score: 85,
      })) satisfies EmployeeRecord[];
    },
    fallback: employeeRecords,
  });

  const departments = useMemo(
    () => ['All', ...Array.from(new Set(employeeRows.map((entry) => entry.department)))],
    [employeeRows],
  );

  const filteredRows = useMemo(() => {
    const search = deferredQuery.toLowerCase();
    return employeeRows.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(search) ||
        employee.id.toLowerCase().includes(search) ||
        employee.designation.toLowerCase().includes(search);
      const matchesDepartment = departmentFilter === 'All' || employee.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [departmentFilter, deferredQuery, employeeRows]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Employee Management"
        description="Unified employee list, profile cards, documents, attendance, and performance visibility."
      />

      <ModuleLinksBar
        links={[
          { label: 'Attendance', href: `/attendance?role=${activeRole}` },
          { label: 'Payroll', href: `/payroll?role=${activeRole}` },
          { label: 'Documents', href: `/documents?role=${activeRole}` },
          { label: 'Services', href: `/services?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
          <Search size={14} className="text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search employee by name, id, or role"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/70"
        >
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredRows.slice(0, 3).map((employee) => (
          <GlassCard key={employee.id}>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Profile Card</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{employee.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{employee.designation}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill label={employee.department} />
              <StatusPill
                label={employee.status}
                tone={employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'default'}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">Performance Score: {employee.score}</p>
          </GlassCard>
        ))}
      </section>

      <section>
        <SimpleTable
          rows={filteredRows}
          columns={[
            { key: 'id', label: 'Employee ID' },
            { key: 'name', label: 'Name' },
            { key: 'department', label: 'Department' },
            { key: 'designation', label: 'Designation' },
            {
              key: 'status',
              label: 'Status',
              render: (employee) => (
                <StatusPill
                  label={employee.status}
                  tone={employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'default'}
                />
              ),
            },
            { key: 'location', label: 'Location' },
            { key: 'score', label: 'Performance Score' },
          ]}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Documents</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Live document ownership and compliance metadata synced with Document Center.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Attendance</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Realtime check-in stream with anomaly detection for multi-office and remote teams.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Performance</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Quarterly review progress and role-level scorecards integrated with analytics models.</p>
        </GlassCard>
      </section>
    </div>
  );
}
