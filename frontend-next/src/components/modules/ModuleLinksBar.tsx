'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useUIStore } from '@/store/ui-store';
import { canAccessRoute, toSafePlatformRole } from '@/utils/platform-config';

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
    <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-panel backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/65">
      <div className="flex flex-wrap items-center gap-2">
        {mergedLinks.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {link.label}
          </Link>
        ))}

        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            isLive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
          }`}
        >
          {loading ? 'Refreshing...' : isLive ? 'Live Backend Data' : 'Fallback Data'}
        </span>
      </div>
      {error ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{error}</p> : null}
    </section>
  );
}
