'use client';

import { useState, useMemo } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { formatDateTime } from '@/utils/formatters';

// ── Fallback data ─────────────────────────────────────────────────────────────
const fallbackRequests = [
  { id: 'LR-001', employeeId: 'EMP-1042', leaveTypeId: null, startDate: '2026-04-10', endDate: '2026-04-12', totalDays: 3, reason: 'Personal', status: 'approved', approvedBy: null, approvedAt: null, createdAt: '2026-04-08T09:00:00Z' },
  { id: 'LR-002', employeeId: 'EMP-1093', leaveTypeId: null, startDate: '2026-04-14', endDate: '2026-04-14', totalDays: 1, reason: 'Medical', status: 'pending', approvedBy: null, approvedAt: null, createdAt: '2026-04-09T10:30:00Z' },
  { id: 'LR-003', employeeId: 'EMP-1180', leaveTypeId: null, startDate: '2026-04-18', endDate: '2026-04-22', totalDays: 5, reason: 'Family function', status: 'approved', approvedBy: null, approvedAt: null, createdAt: '2026-04-10T11:00:00Z' },
  { id: 'LR-004', employeeId: 'EMP-1206', leaveTypeId: null, startDate: '2026-04-25', endDate: '2026-04-25', totalDays: 1, reason: 'Sick leave', status: 'rejected', approvedBy: null, approvedAt: null, createdAt: '2026-04-11T08:00:00Z' },
  { id: 'LR-005', employeeId: 'EMP-1215', leaveTypeId: null, startDate: '2026-05-01', endDate: '2026-05-03', totalDays: 3, reason: 'Vacation', status: 'pending', approvedBy: null, approvedAt: null, createdAt: '2026-04-13T14:00:00Z' },
];

const fallbackTypes = [
  { id: 'LT-1', leaveName: 'Casual Leave', maxDaysPerYear: 12, carryForward: false, isPaid: true, isActive: true },
  { id: 'LT-2', leaveName: 'Sick Leave', maxDaysPerYear: 8, carryForward: false, isPaid: true, isActive: true },
  { id: 'LT-3', leaveName: 'Earned Leave', maxDaysPerYear: 18, carryForward: true, isPaid: true, isActive: true },
  { id: 'LT-4', leaveName: 'Maternity Leave', maxDaysPerYear: 180, carryForward: false, isPaid: true, isActive: true },
  { id: 'LT-5', leaveName: 'Loss of Pay', maxDaysPerYear: 365, carryForward: false, isPaid: false, isActive: true },
];

const monthlyLeaveTrend = [
  { name: 'Jan', value: 24 }, { name: 'Feb', value: 18 }, { name: 'Mar', value: 31 },
  { name: 'Apr', value: 22 }, { name: 'May', value: 27 }, { name: 'Jun', value: 19 },
];

type StatusTone = 'success' | 'warning' | 'danger' | 'default';

function leaveTone(status: string): StatusTone {
  switch (status.toLowerCase()) {
    case 'approved': return 'success';
    case 'pending':  return 'warning';
    case 'rejected': return 'danger';
    default:         return 'default';
  }
}

// ── Apply Leave Modal ──────────────────────────────────────────────────────────
interface ApplyLeaveModalProps {
  leaveTypes: { id: string; leaveName: string }[];
  onClose: () => void;
  onSubmit: (data: { leaveTypeId: string; startDate: string; endDate: string; reason: string }) => void;
  submitting: boolean;
}

function ApplyLeaveModal({ leaveTypes, onClose, onSubmit, submitting }: ApplyLeaveModalProps) {
  const [form, setForm] = useState({ leaveTypeId: leaveTypes[0]?.id ?? '', startDate: '', endDate: '', reason: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-[#1a1d2e] border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-xl leading-none"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold text-white mb-5">Apply for Leave</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Leave Type</label>
            <select
              name="leaveTypeId"
              value={form.leaveTypeId}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id} className="bg-[#1a1d2e]">{lt.leaveName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Reason</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Brief reason for leave..."
              className="w-full rounded-lg bg-white/5 border border-white/10 text-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Leave Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function LeaveModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localRequests, setLocalRequests] = useState<typeof fallbackRequests>([]);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [requests, types] = await Promise.all([
        platformApi.getLeaveRequests(),
        platformApi.getLeaveTypes(),
      ]);
      return { requests, types };
    },
    fallback: { requests: fallbackRequests, types: fallbackTypes },
  });

  const allRequests = useMemo(
    () => [...localRequests, ...data.requests],
    [localRequests, data.requests],
  );

  // ── KPI metrics ─────────────────────────────────────────────────────────────
  const pending  = useMemo(() => allRequests.filter((r) => r.status === 'pending').length,  [allRequests]);
  const approved = useMemo(() => allRequests.filter((r) => r.status === 'approved').length, [allRequests]);
  const rejected = useMemo(() => allRequests.filter((r) => r.status === 'rejected').length, [allRequests]);
  const totalDays = useMemo(
    () => allRequests.filter((r) => r.status === 'approved').reduce((s, r) => s + (r.totalDays || 0), 0),
    [allRequests],
  );

  // ── Apply leave handler ──────────────────────────────────────────────────────
  const handleApply = async (form: { leaveTypeId: string; startDate: string; endDate: string; reason: string }) => {
    setSubmitting(true);
    try {
      const start  = new Date(form.startDate);
      const end    = new Date(form.endDate);
      const days   = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1);

      let created;
      try {
        created = await platformApi.createLeaveRequest({
          employeeId: 'me',
          leaveTypeId: form.leaveTypeId,
          startDate: form.startDate,
          endDate: form.endDate,
          totalDays: days,
          reason: form.reason,
        });
      } catch {
        // Optimistic fallback for dev/demo environments without a live backend
        created = {
          id: `LR-${Date.now()}`,
          employeeId: 'me',
          leaveTypeId: form.leaveTypeId,
          startDate: form.startDate,
          endDate: form.endDate,
          totalDays: days,
          reason: form.reason,
          status: 'pending',
          approvedBy: null,
          approvedAt: null,
          createdAt: new Date().toISOString(),
        };
      }

      setLocalRequests((prev) => [created as typeof fallbackRequests[0], ...prev]);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Table rows ───────────────────────────────────────────────────────────────
  const tableRows = useMemo(
    () =>
      allRequests.slice(0, 50).map((r) => ({
        id:        r.id,
        employee:  r.employeeId,
        period:    `${r.startDate} → ${r.endDate}`,
        days:      r.totalDays,
        reason:    r.reason ?? '—',
        status:    r.status,
        appliedAt: formatDateTime(r.createdAt),
      })),
    [allRequests],
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Leave Management"
        description="Apply for leave, track approvals, and view team-wide leave balance across all departments."
      />

      <ModuleLinksBar
        links={[
          { label: 'Attendance', href: `/attendance?role=${activeRole}` },
          { label: 'Employees',  href: `/employees?role=${activeRole}` },
          { label: 'Payroll',    href: `/payroll?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Pending Approval</p>
          <p className="mt-2 text-2xl font-semibold text-amber-400">{pending}</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting manager action</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Approved This Month</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">{approved}</p>
          <p className="mt-1 text-xs text-slate-500">{totalDays} total days granted</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Rejected</p>
          <p className="mt-2 text-2xl font-semibold text-rose-400">{rejected}</p>
          <p className="mt-1 text-xs text-slate-500">Ineligible or quota exceeded</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Leave Types Active</p>
          <p className="mt-2 text-2xl font-semibold">{data.types.filter((t) => t.isActive).length}</p>
          <p className="mt-1 text-xs text-slate-500">Configured policies</p>
        </GlassCard>
      </section>

      {/* Chart + Action row */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendAreaChart
            title="Monthly Leave Applications"
            color="#818cf8"
            data={monthlyLeaveTrend}
          />
        </div>

        {/* Leave types card */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Leave Policies</p>
            <span className="text-xs text-slate-500">{data.types.length} types</span>
          </div>
          <ul className="space-y-2">
            {data.types.map((lt) => (
              <li key={lt.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{lt.leaveName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{lt.maxDaysPerYear}d/yr</span>
                  {lt.isPaid ? (
                    <span className="rounded-full bg-emerald-900/40 text-emerald-400 px-2 py-0.5 text-[10px]">Paid</span>
                  ) : (
                    <span className="rounded-full bg-rose-900/40 text-rose-400 px-2 py-0.5 text-[10px]">Unpaid</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>

      {/* Apply leave CTA */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Leave Requests</h2>
        <button
          id="apply-leave-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
        >
          <span>＋</span> Apply for Leave
        </button>
      </div>

      {/* Requests table */}
      <section>
        <SimpleTable
          rows={tableRows}
          columns={[
            { key: 'id',        label: 'Request ID' },
            { key: 'employee',  label: 'Employee ID' },
            { key: 'period',    label: 'Period' },
            { key: 'days',      label: 'Days' },
            { key: 'reason',    label: 'Reason' },
            { key: 'appliedAt', label: 'Applied At' },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <StatusPill label={row.status} tone={leaveTone(row.status)} />
              ),
            },
          ]}
        />
      </section>

      {/* Apply Leave Modal */}
      {showModal && (
        <ApplyLeaveModal
          leaveTypes={data.types}
          onClose={() => setShowModal(false)}
          onSubmit={handleApply}
          submitting={submitting}
        />
      )}
    </div>
  );
}
