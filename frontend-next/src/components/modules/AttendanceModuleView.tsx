'use client';

import { useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { attendanceHeatMap, employeeRecords } from '@/services/platform-data';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatDateTime } from '@/utils/formatters';

type AttendanceRow = {
  id: string;
  name: string;
  department: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

const fallbackRows = employeeRecords.map((employee, index) => ({
  id: employee.id,
  name: employee.name,
  department: employee.department,
  checkIn: index % 2 === 0 ? '09:05 AM' : '09:21 AM',
  checkOut: index % 3 === 0 ? '06:34 PM' : '06:10 PM',
  status: employee.status === 'On Leave' ? 'Leave' : 'Present',
}));

export function AttendanceModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [attendance, employees] = await Promise.all([
        platformApi.getAttendance(),
        platformApi.getEmployees(),
      ]);

      const employeeMap = new Map(
        employees.map((entry) => [
          entry.id,
          {
            name: `${entry.firstName} ${entry.lastName}`.trim(),
            department: entry.department,
          },
        ]),
      );

      const tableRows: AttendanceRow[] = attendance.slice(0, 120).map((entry) => {
        const employee = employeeMap.get(entry.employeeId);
        return {
          id: entry.id,
          name: employee?.name || 'Employee',
          department: employee?.department || 'General',
          checkIn: entry.checkInAt ? formatDateTime(entry.checkInAt) : '-',
          checkOut: entry.checkOutAt ? formatDateTime(entry.checkOutAt) : '-',
          status: entry.status.toLowerCase().includes('leave') ? 'Leave' : entry.status.toLowerCase().includes('absent') ? 'Absent' : 'Present',
        };
      });

      return {
        attendance,
        rows: tableRows,
      };
    },
    fallback: {
      attendance: [],
      rows: fallbackRows,
    },
  });

  const presentCount = useMemo(() => data.rows.filter((row) => row.status === 'Present').length, [data.rows]);
  const leaveCount = useMemo(() => data.rows.filter((row) => row.status === 'Leave').length, [data.rows]);
  const absentCount = useMemo(() => data.rows.filter((row) => row.status === 'Absent').length, [data.rows]);

  const attendancePercent = useMemo(() => {
    const total = data.rows.length;
    if (!total) {
      return '95.3%';
    }

    return `${((presentCount / total) * 100).toFixed(1)}%`;
  }, [data.rows.length, presentCount]);

  const heatmapData = useMemo(() => {
    if (!isLive || data.attendance.length === 0) {
      return attendanceHeatMap;
    }

    const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const bucket = new Map<string, { present: number; absent: number; leave: number }>();

    data.attendance.forEach((entry) => {
      const day = week[new Date(entry.attendanceDate).getDay()];
      const current = bucket.get(day) ?? { present: 0, absent: 0, leave: 0 };
      const status = entry.status.toLowerCase();

      if (status.includes('leave')) {
        current.leave += 1;
      } else if (status.includes('absent')) {
        current.absent += 1;
      } else {
        current.present += 1;
      }

      bucket.set(day, current);
    });

    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => ({
      name: day,
      present: bucket.get(day)?.present ?? 0,
      absent: bucket.get(day)?.absent ?? 0,
      leave: bucket.get(day)?.leave ?? 0,
    }));
  }, [data.attendance, isLive]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Attendance Dashboard"
        description="Realtime attendance tracking, punctuality trends, leave distribution, and cross-team visibility."
      />

      <ModuleLinksBar
        links={[
          { label: 'Employees', href: `/employees?role=${activeRole}` },
          { label: 'Payroll', href: `/payroll?role=${activeRole}` },
          { label: 'Services', href: `/services?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Attendance Today</p>
          <p className="mt-2 text-2xl font-semibold">{attendancePercent}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Present</p>
          <p className="mt-2 text-2xl font-semibold">{presentCount || 38}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">On Leave</p>
          <p className="mt-2 text-2xl font-semibold">{leaveCount || 21}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Absent</p>
          <p className="mt-2 text-2xl font-semibold">{absentCount || 7}</p>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StackedBarChart title="Weekly Attendance Heatmap" data={heatmapData} mode="attendance" />
        <TrendAreaChart
          title="Monthly Attendance Score"
          color="#0F8B8D"
          data={heatmapData.map((item) => ({ name: item.name, value: item.present + item.leave }))}
        />
      </section>

      <section>
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
      </section>
    </div>
  );
}
