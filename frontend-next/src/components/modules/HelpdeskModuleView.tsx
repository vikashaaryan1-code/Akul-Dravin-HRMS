'use client';

import { useMemo } from 'react';
import { CircleAlert, Headset, ShieldCheck, Timer } from 'lucide-react';
import { DonutChartCard } from '@/components/charts/DonutChartCard';
import { StackedBarChart } from '@/components/charts/StackedBarChart';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { SimpleTable } from '@/components/modules/SimpleTable';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';
import { StatusPill } from '@/components/ui/StatusPill';
import { helpdeskSlaRecords, helpdeskTicketRecords } from '@/services/platform-data';
import type { HelpdeskTicketApiRecord } from '@/services/api/platform-api';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';
import { canPerformAction } from '@/utils/action-permissions';
import { formatDateTime } from '@/utils/formatters';

const priorityTone = (priority: string): 'default' | 'success' | 'warning' | 'danger' => {
  const normalized = priority.toLowerCase();

  if (normalized.includes('critical')) return 'danger';
  if (normalized.includes('high')) return 'warning';
  if (normalized.includes('low')) return 'success';
  return 'default';
};

const statusTone = (status: string): 'default' | 'success' | 'warning' | 'danger' => {
  const normalized = status.toLowerCase();

  if (normalized.includes('resolved')) return 'success';
  if (normalized.includes('escalated')) return 'danger';
  if (normalized.includes('progress') || normalized.includes('open')) return 'warning';
  return 'default';
};

export function HelpdeskModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);
  const canResolve = canPerformAction(activeRole, 'helpdesk.resolve-ticket');
  const canEscalate = canPerformAction(activeRole, 'helpdesk.escalate-ticket');

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const [tickets, sla] = await Promise.all([
        platformApi.getHelpdeskTickets(),
        platformApi.getHelpdeskSlaStatus(),
      ]);

      return {
        tickets,
        sla,
      };
    },
    fallback: {
      tickets: helpdeskTicketRecords,
      sla: helpdeskSlaRecords,
    },
  });

  const tickets = data.tickets as HelpdeskTicketApiRecord[];

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => {
      const status = ticket.status.toLowerCase();
      return status.includes('open') || status.includes('progress') || status.includes('escalated');
    }).length;

    const critical = tickets.filter((ticket) => ticket.priority.toLowerCase().includes('critical')).length;
    const avgSla = tickets.length > 0 ? tickets.reduce((sum, ticket) => sum + ticket.slaHours, 0) / tickets.length : 0;

    return {
      open,
      critical,
      avgSla,
      resolved: tickets.filter((ticket) => ticket.status.toLowerCase().includes('resolved')).length,
    };
  }, [tickets]);

  const categoryDistribution = useMemo(() => {
    const grouped = new Map<string, number>();

    tickets.forEach((ticket) => {
      grouped.set(ticket.category, (grouped.get(ticket.category) ?? 0) + 1);
    });

    return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Helpdesk & Support Operations"
        description="Monitor employee support tickets, escalation queues, and SLA performance with role-based support controls."
        actions={
          <div className="flex flex-col items-start gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canResolve}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 dark:bg-slate-100 dark:text-slate-900"
                title={canResolve ? 'Resolve selected tickets' : 'Your role cannot resolve helpdesk tickets.'}
              >
                Resolve Ticket
              </button>
              <button
                type="button"
                disabled={!canEscalate}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                title={canEscalate ? 'Escalate selected tickets' : 'Your role cannot escalate helpdesk tickets.'}
              >
                Escalate Ticket
              </button>
            </div>
            {!canResolve || !canEscalate ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">Support actions are restricted by active role policy.</p>
            ) : null}
          </div>
        }
      />

      <ModuleLinksBar
        links={[
          { label: 'Services', href: `/services?role=${activeRole}` },
          { label: 'Permissions', href: `/permissions?role=${activeRole}` },
          { label: 'Automation', href: `/automation?role=${activeRole}` },
          { label: 'Analytics', href: `/analytics?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Open Tickets</p>
            <Headset size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{stats.open}</p>
          <p className="mt-1 text-xs text-slate-500">Active queue requiring action</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Critical Alerts</p>
            <CircleAlert size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{stats.critical}</p>
          <p className="mt-1 text-xs text-slate-500">Escalations with shortest SLA window</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Avg SLA Window</p>
            <Timer size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{stats.avgSla.toFixed(1)}h</p>
          <p className="mt-1 text-xs text-slate-500">Average resolution target across tickets</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Resolved Today</p>
            <ShieldCheck size={16} className="text-slate-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{stats.resolved}</p>
          <p className="mt-1 text-xs text-slate-500">Compliance-safe support closure</p>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DonutChartCard title="SLA Compliance Split" data={data.sla} />
        <StackedBarChart title="Ticket Category Distribution" data={categoryDistribution} mode="single" />
      </section>

      <section>
        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Support Ticket Queue</p>
          <SimpleTable
            rows={tickets}
            columns={[
              { key: 'ticketNumber', label: 'Ticket' },
              { key: 'requester', label: 'Requester' },
              { key: 'department', label: 'Department' },
              { key: 'category', label: 'Category' },
              {
                key: 'priority',
                label: 'Priority',
                render: (ticket) => <StatusPill label={ticket.priority} tone={priorityTone(ticket.priority)} />,
              },
              {
                key: 'status',
                label: 'Status',
                render: (ticket) => <StatusPill label={ticket.status} tone={statusTone(ticket.status)} />,
              },
              {
                key: 'slaHours',
                label: 'SLA',
                render: (ticket) => `${ticket.slaHours}h`,
              },
              {
                key: 'createdAt',
                label: 'Created',
                render: (ticket) => formatDateTime(ticket.createdAt),
              },
            ]}
          />
        </GlassCard>
      </section>
    </div>
  );
}
