'use client';

import { ClipboardList, LifeBuoy, ShieldCheck, UserRoundCog } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { platformApi } from '@/services/api/platform-api';
import { useApiResource } from '@/hooks/useApiResource';
import { useUIStore } from '@/store/ui-store';

const serviceCards = [
  {
    title: 'Employee Service Desk',
    description: 'Handle ID updates, policy clarifications, and letter requests with SLA tracking.',
    icon: ClipboardList,
  },
  {
    title: 'HR Assistant',
    description: 'AI-powered response engine for routine workforce and payroll questions.',
    icon: UserRoundCog,
  },
  {
    title: 'Compliance Support',
    description: 'Automated escalations for statutory obligations and audit-ready documentation.',
    icon: ShieldCheck,
  },
  {
    title: 'Help & Guidance',
    description: 'Knowledge base, walkthroughs, and escalation paths for admins and employees.',
    icon: LifeBuoy,
  },
];

export function ServicesModuleView() {
  const activeRole = useUIStore((state) => state.activeRole);

  const { data, isLive, loading, error } = useApiResource({
    loader: async () => {
      const tickets = await platformApi.getServiceTickets();
      return {
        tickets,
      };
    },
    fallback: {
      tickets: [],
    },
  });

  const openCount = data.tickets.filter((ticket) => ticket.status.toLowerCase().includes('open')).length;
  const resolvedCount = data.tickets.filter((ticket) => ticket.status.toLowerCase().includes('resolved')).length;
  const highPriority = data.tickets.filter((ticket) => ticket.priority.toLowerCase().includes('high')).length;

  return (
    <div className="space-y-5">
      <PageTitle
        title="Services Center"
        description="Centralized employee service operations with AI assistance and governance controls."
      />

      <ModuleLinksBar
        links={[
          { label: 'Documents', href: `/documents?role=${activeRole}` },
          { label: 'Automation', href: `/automation?role=${activeRole}` },
          { label: 'Settings', href: `/settings?role=${activeRole}` },
        ]}
        isLive={isLive}
        loading={loading}
        error={error}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {serviceCards.map((card, index) => {
          const Icon = card.icon;
          const status = index === 0
            ? `${openCount || 72} open tickets`
            : index === 1
              ? `${resolvedCount || 98}% resolution health`
              : index === 2
                ? `${highPriority || 4} high-priority`
                : '24/7 support';

          return (
            <GlassCard key={card.title}>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Icon size={18} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{card.description}</p>
              <div className="mt-3">
                <StatusPill label={status} tone="default" />
              </div>
            </GlassCard>
          );
        })}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Service Queue Overview</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Open tickets: {openCount || 18}</li>
            <li>Resolved tickets: {resolvedCount || 63}</li>
            <li>High priority tickets: {highPriority || 7}</li>
            <li>SLA health: {isLive ? 'Realtime backend synced' : 'Fallback simulation mode'}</li>
          </ul>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Self-Service Health</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Mobile usage share: 61%</li>
            <li>Average request closure time: 3.2 hours</li>
            <li>Knowledge base deflection rate: 46%</li>
            <li>Satisfaction score: 4.6 / 5</li>
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}
