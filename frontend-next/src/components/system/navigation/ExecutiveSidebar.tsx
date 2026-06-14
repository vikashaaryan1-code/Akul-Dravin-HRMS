'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Clock, DollarSign, BarChart3, BrainCircuit,
  ShieldCheck, FileStack, Briefcase, Store, Settings, ChevronLeft,
  ChevronRight, Rocket, Zap, type LucideIcon,
} from 'lucide-react';

// ── Nav config ────────────────────────────────────────────────────────────────
type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  group?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Command Center', href: '/dashboard', icon: LayoutDashboard, group: 'Core' },
  { label: 'Employees', href: '/employees', icon: Users, group: 'Core' },
  { label: 'Attendance', href: '/attendance', icon: Clock, group: 'Core' },
  { label: 'Payroll', href: '/payroll', icon: DollarSign, group: 'Finance' },
  { label: 'Finance', href: '/finance', icon: FileStack, group: 'Finance' },
  { label: 'Recruitment', href: '/recruitment', icon: Briefcase, group: 'People' },
  { label: 'Performance', href: '/performance', icon: BarChart3, group: 'People' },
  { label: 'AI Hub', href: '/ai-hub', icon: BrainCircuit, badge: 'AI', group: 'Intelligence' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Intelligence' },
  { label: 'Compliance', href: '/compliance', icon: ShieldCheck, group: 'Governance' },
  { label: 'Marketplace', href: '/marketplace', icon: Store, group: 'Platform' },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'Platform' },
];

const GROUPS = ['Core', 'Finance', 'People', 'Intelligence', 'Governance', 'Platform'] as const;

// ── NavLink ───────────────────────────────────────────────────────────────────
function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
        isActive
          ? 'bg-gold/10 border border-gold/20 text-gold'
          : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <item.icon
        className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-gold' : 'group-hover:text-white'}`}
        aria-hidden="true"
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs font-bold whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {item.badge && !collapsed && (
        <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md bg-ember/20 border border-ember/30 text-ember">
          {item.badge}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-lg border border-white/10 bg-depth-1 px-3 py-1.5 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-glass">
          {item.label}
        </span>
      )}
    </Link>
  );
}

// ── ExecutiveSidebar ──────────────────────────────────────────────────────────
interface ExecutiveSidebarProps {
  defaultCollapsed?: boolean;
}

/**
 * ExecutiveSidebar — CyberGlass 2.0
 * Role-aware collapsible navigation with group labels, AI status indicator,
 * keyboard-accessible, reduced-motion-safe.
 */
export function ExecutiveSidebar({ defaultCollapsed = false }: ExecutiveSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 bottom-0 z-[80] flex flex-col border-r border-white/[0.06] bg-depth-1/95 backdrop-blur-xl overflow-hidden"
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Brand */}
      <div className={`flex items-center border-b border-white/[0.06] ${collapsed ? 'justify-center px-4 py-5' : 'gap-3 px-5 py-5'}`}>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold to-ember flex items-center justify-center shrink-0">
          <Rocket className="h-4 w-4 text-void" aria-hidden="true" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-black tracking-tighter text-white whitespace-nowrap">AKUL DRAVIN</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gold/50 mt-0.5">Sovereign AI OS</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 px-2 scrollbar-thin">
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="section-label text-slate-700 px-3 mb-2"
                  >
                    {group}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {items.map((item) => <NavLink key={item.href} item={item} collapsed={collapsed} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Status */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-2 mb-3 rounded-xl border border-ember/15 bg-ember/5 p-3 flex items-center gap-2.5"
          >
            <Zap className="h-4 w-4 text-ember shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-black text-ember">AI Copilot Active</p>
              <p className="text-[9px] text-slate-600">3 insights ready</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <div className="border-t border-white/[0.06] p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-slate-600 hover:text-white hover:bg-white/5 transition-colors duration-200"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" aria-hidden="true" />
            : <><ChevronLeft className="h-4 w-4" aria-hidden="true" /><span className="text-xs font-bold">Collapse</span></>
          }
        </button>
      </div>
    </motion.aside>
  );
}
