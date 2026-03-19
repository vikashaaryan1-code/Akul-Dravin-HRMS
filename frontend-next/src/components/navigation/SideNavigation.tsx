'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { SIDE_NAV_ITEMS, canAccessRoute, filterNavItemsByRole } from '@/utils/platform-config';
import type { PlatformRole } from '@/types/platform';

type SideNavigationProps = {
  activeRole: PlatformRole;
  isOpen: boolean;
  onClose: () => void;
};

export function SideNavigation({ activeRole, isOpen, onClose }: SideNavigationProps) {
  const pathname = usePathname();
  const visibleNavItems = filterNavItemsByRole(SIDE_NAV_ITEMS, activeRole);

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-slate-950/40 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 flex h-full w-[22rem] flex-col border-r border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl transition-transform lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:border-slate-200/80 lg:shadow-none dark:border-slate-700 dark:bg-slate-950/95',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Navigation</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
            aria-label="Close menu"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-1 overflow-y-auto pr-1">
          {visibleNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={`${item.href}?role=${activeRole}`}
                onClick={onClose}
                className={clsx(
                  'block rounded-xl px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-ink text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-ink to-aqua p-4 text-white">
          <p className="text-xs uppercase tracking-[0.14em] text-white/70">Automation Status</p>
          <p className="mt-1 text-lg font-semibold">200+ workflows active</p>
          <p className="mt-2 text-xs text-white/80">
            {canAccessRoute(activeRole, '/automation')
              ? 'Realtime monitors active for attendance, tasks, location, payroll, and approvals.'
              : 'Role has restricted automation controls. Request elevated access from administrator.'}
          </p>
        </div>
      </aside>
    </>
  );
}
