'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useUIStore } from '@/store/ui-store';
import { canAccessRoute, toRoleLabel, toSafePlatformRole } from '@/utils/platform-config';

type ModuleLink = {
  label: string;
  href: string;
};

type ModuleLinksBarProps = {
  links: ModuleLink[];
  isLive: boolean;
  loading?: boolean;
  error?: string | null;
};

const moduleRoutes: ModuleLink[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'A2Z Atlas', href: '/a2z-atlas' },
  { label: 'Employees', href: '/employees' },
  { label: 'Departments', href: '/departments' },
  { label: 'Designations', href: '/designations' },
  { label: 'Attendance', href: '/attendance' },
  { label: 'Tracking', href: '/tracking' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Onboarding', href: '/onboarding' },
  { label: 'Recruitment', href: '/recruitment' },
  { label: 'Interviews', href: '/interviews' },
  { label: 'Candidates', href: '/candidates' },
  { label: 'Payroll', href: '/payroll' },
  { label: 'Leave', href: '/leave' },
  { label: 'Expense', href: '/expense' },
  { label: 'Performance', href: '/performance' },
  { label: 'LMS', href: '/lms' },
  { label: 'Gamification', href: '/gamification' },
  { label: 'Location', href: '/location' },
  { label: 'CRM', href: '/crm' },
  { label: 'Sales', href: '/sales' },
  { label: 'Marketing', href: '/marketing' },
  { label: 'Finance', href: '/finance' },
  { label: 'Documents', href: '/documents' },
  { label: 'Compliance', href: '/compliance' },
  { label: 'Services', href: '/services' },
  { label: 'Helpdesk', href: '/helpdesk' },
  { label: 'Procurement', href: '/procurement' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'AI Hub', href: '/ai-hub' },
  { label: 'Permissions', href: '/permissions' },
  { label: 'Automation', href: '/automation' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Job Board', href: '/job-board' },
  { label: 'Recruiter Hub', href: '/recruiter-hub' },
  { label: 'Recruiter Revenue', href: '/recruiter-revenue' },
  { label: 'Offboarding', href: '/offboarding' },
  { label: 'Super Admin', href: '/super-admin' },
  { label: 'Plan Catalog', href: '/plan-catalog' },
  { label: 'Subscriptions', href: '/subscriptions' },
  { label: 'Payments', href: '/payments' },
  { label: 'White Label', href: '/white-label' },
  { label: 'Settings', href: '/settings' },
];

const stripQuery = (href: string) => href.split('?')[0];

const ensureRoleQuery = (href: string, role: string) => {
  if (href.includes('?')) {
    return href;
  }

  return `${href}?role=${role}`;
};

export function ModuleLinksBar({ links, isLive, loading = false, error = null }: ModuleLinksBarProps) {
  const activeRole = useUIStore((state) => state.activeRole);
  const safeRole = toSafePlatformRole(activeRole);
  const displayError = useMemo(() => {
    if (!error) {
      return null;
    }

    return /Cannot GET/i.test(error)
      ? 'Live backend endpoint is unavailable right now. Protected fallback data is being shown.'
      : error;
  }, [error]);

  const mergedLinks = useMemo(() => {
    const roleLinks = moduleRoutes.map((item) => ({
      label: item.label,
      href: `${item.href}?role=${safeRole}`,
    }));

    const merged = [...links.map((item) => ({ ...item, href: ensureRoleQuery(item.href, safeRole) })), ...roleLinks];
    const seen = new Set<string>();

    return merged
      .filter((item) => canAccessRoute(safeRole, stripQuery(item.href)))
      .filter((item) => {
        if (seen.has(item.href)) {
          return false;
        }

        seen.add(item.href);
        return true;
      });
  }, [links, safeRole]);

  return (
    <section className="rounded-[28px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.12),_transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,255,255,0.84))] p-4 shadow-panel backdrop-blur dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.16),_transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.82))]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-aqua/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-aqua">
              Command Routes
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {isLive
                ? 'Live route mesh is synced with active module context.'
                : 'Protected route mesh remains available while backend data reconnects.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                isLive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
              }`}
            >
              {loading ? 'Refreshing...' : isLive ? 'Realtime Route Mesh' : 'Fallback Route Mesh'}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {mergedLinks.length} accessible routes
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {toRoleLabel(safeRole)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
        {mergedLinks.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-aqua/40 hover:text-aqua dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {link.label}
          </Link>
        ))}
      </div>
      {displayError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          {displayError}
        </div>
      ) : null}
      </div>
    </section>
  );
}
