'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, ChevronRight, Settings, LogOut,
  User, Command, X, type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb() {
  const pathname = usePathname();
  const segments = (pathname || '').split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5">
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/');
        const label = seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        const isLast = i === segments.length - 1;
        return (
          <React.Fragment key={href}>
            {i > 0 && <ChevronRight className="h-3 w-3 text-slate-700" aria-hidden="true" />}
            {isLast ? (
              <span className="text-xs font-black text-white" aria-current="page">{label}</span>
            ) : (
              <Link href={href} className="text-xs font-semibold text-slate-500 hover:text-white transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ── GlobalSearch ──────────────────────────────────────────────────────────────
function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        id="global-search-trigger"
        aria-label="Open search (Ctrl+K)"
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl surface-base border-subtle text-slate-500 hover:text-white hover:bg-white/8 transition-all duration-200 min-w-[200px]"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-xs font-semibold flex-1 text-left">Search anything…</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 border border-white/8 rounded px-1.5 py-0.5">
          <Command className="h-2.5 w-2.5" aria-hidden="true" />K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-void/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[160] w-full max-w-xl"
              role="dialog"
              aria-label="Global search"
              aria-modal="true"
            >
              <div className="surface-high rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <Search className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search employees, modules, reports…"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                    aria-label="Search"
                  />
                  <button onClick={() => setOpen(false)} aria-label="Close search">
                    <X className="h-4 w-4 text-slate-600 hover:text-white transition-colors" aria-hidden="true" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="section-label text-slate-700 mb-3">Quick access</p>
                  <div className="space-y-1">
                    {[
                      { label: 'Employee Directory', href: '/employees' },
                      { label: 'Payroll Cockpit', href: '/payroll' },
                      { label: 'AI Copilot', href: '/ai-hub' },
                      { label: 'Analytics', href: '/analytics' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── UserMenu ──────────────────────────────────────────────────────────────────
function UserMenu() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return (
    <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
      Sign In
    </Link>
  );

  const initials = (user as any).name
    ? (user as any).name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  type MenuItem = { icon: LucideIcon; label: string; href?: string; action?: () => void; danger?: boolean };

  const menuItems: MenuItem[] = [
    { icon: User, label: 'Profile', href: '/settings/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: LogOut, label: 'Sign Out', action: logout, danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={open}
        className="h-8 w-8 rounded-full bg-gradient-to-br from-gold to-ember flex items-center justify-center text-void text-xs font-black hover:scale-105 transition-transform"
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 surface-high border border-white/10 rounded-2xl shadow-glass overflow-hidden z-50"
            role="menu"
          >
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-black text-white truncate">{(user as any).name ?? 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email ?? ''}</p>
            </div>
            {menuItems.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-white/5 ${
                    item.danger ? 'text-ember hover:text-ember' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={() => { item.action?.(); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-white/5 ${
                    item.danger ? 'text-ember hover:text-ember' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TopCommandBar ─────────────────────────────────────────────────────────────
interface TopCommandBarProps {
  sidebarCollapsed?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

/**
 * TopCommandBar — CyberGlass 2.0
 * Sticky top bar: breadcrumb, global search, notification bell, user menu.
 * Offset respects sidebar width via CSS variable or prop.
 */
export function TopCommandBar({ sidebarCollapsed = false, notificationCount = 0, onNotificationClick }: TopCommandBarProps) {
  const offset = sidebarCollapsed ? 72 : 240;

  return (
    <header
      className="fixed top-0 right-0 z-[70] border-b border-white/[0.05] bg-void/80 backdrop-blur-xl transition-all duration-220"
      style={{ left: offset }}
      role="banner"
    >
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <Breadcrumb />

        <div className="flex items-center gap-3 ml-auto">
          <GlobalSearch />

          <button
            onClick={onNotificationClick}
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
            className="relative h-8 w-8 rounded-xl surface-base border-subtle flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/8 transition-all duration-200"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-ember flex items-center justify-center text-[8px] font-black text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
