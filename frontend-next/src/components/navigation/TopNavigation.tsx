'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, MoonStar, Search, Sun, UserCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { PLATFORM_BRAND, PLATFORM_ROLE_OPTIONS, TOP_NAV_ITEMS, filterNavItemsByRole, toSafePlatformRole } from '@/utils/platform-config';
import { getInitials } from '@/utils/formatters';
import { selectUnreadCount, useNotificationStore } from '@/store/notification-store';
import { useUIStore } from '@/store/ui-store';
import { selectIsAuthenticated, useAuthStore } from '@/store/auth-store';
import { CommandPalette, useCommandPalette } from '@/components/ui/CommandPalette';

type TopNavigationProps = {
  onMenuClick: () => void;
};

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  const unreadCount = useNotificationStore(selectUnreadCount);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const activeRole = useUIStore((state) => state.activeRole);
  const setActiveRole = useUIStore((state) => state.setActiveRole);
  const notificationPanelOpen = useUIStore((state) => state.notificationPanelOpen);
  const setNotificationPanelOpen = useUIStore((state) => state.setNotificationPanelOpen);

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const safeRole = toSafePlatformRole(activeRole);

  useEffect(() => {
    if (safeRole !== activeRole) {
      setActiveRole(safeRole);
    }
  }, [activeRole, safeRole, setActiveRole]);

  const userName = user?.fullName || 'Akul Dravin Admin';
  const initials = useMemo(() => getInitials(userName), [userName]);
  const visibleNavItems = useMemo(() => filterNavItemsByRole(TOP_NAV_ITEMS, safeRole), [safeRole]);
  const quickNavItems = useMemo(() => visibleNavItems.slice(0, 7), [visibleNavItems]);
  const overflowNavItems = useMemo(() => visibleNavItems.slice(7), [visibleNavItems]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/80 glass-3d-panel !rounded-none !border-x-0 !border-t-0 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-2 px-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Menu size={18} />
        </button>

        <Link href={`/dashboard?role=${safeRole}`} className="inline-flex shrink-0 items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ember to-amber text-xs font-bold text-white">
            AD
          </span>
          <span className="hidden text-sm font-bold tracking-[0.18em] text-slate-900 sm:inline dark:text-slate-100">{PLATFORM_BRAND}</span>
        </Link>

        <nav className="hidden min-w-0 max-w-[34rem] items-center gap-1 overflow-x-auto 2xl:flex [&::-webkit-scrollbar]:hidden">
          {quickNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={`${item.href}?role=${safeRole}`}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {overflowNavItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                More ▾
              </button>
              {moreOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 max-h-96 overflow-y-auto">
                  {overflowNavItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={`${item.href}?role=${safeRole}`}
                        onClick={() => setMoreOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Search → Command Palette trigger */}
        <button
          onClick={() => setCmdOpen(true)}
          className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 lg:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 transition cursor-pointer"
          aria-label="Open command palette"
        >
          <Search size={15} className="shrink-0" />
          <span className="flex-1 text-left min-w-0 text-slate-400 text-sm">Search anything...</span>
          <kbd className="hidden xl:flex gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400">⌘K</kbd>
        </button>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] xl:inline-flex ${
            isAuthenticated
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
          }`}
        >
          {isAuthenticated ? 'API Connected' : 'Demo Mode'}
        </span>

        <select
          value={safeRole}
          onChange={(event) => setActiveRole(event.target.value as typeof safeRole)}
          className="hidden max-w-[190px] shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none lg:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          aria-label="Active role"
        >
          {PLATFORM_ROLE_OPTIONS.map((option) => (
            <option key={option.role} value={option.role}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonStar size={16} /> : <Sun size={16} />}
        </button>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 ? (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>
          <NotificationPanel />
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className="inline-flex h-10 w-10 overflow-hidden items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
            aria-label="User profile menu"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={userName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
          {profileOpen ? (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <p className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{userName}</p>
              <Link href={`/settings?role=${safeRole}`} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                Account Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  router.push('/login');
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut size={14} />
                Sign Out
              </button>
              {!isAuthenticated ? (
                <Link href="/login" className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-aqua hover:bg-aqua/10">
                  <UserCircle2 size={14} />
                  Connect Backend
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
