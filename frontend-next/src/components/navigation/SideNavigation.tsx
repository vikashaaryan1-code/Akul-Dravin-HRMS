'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
 X, Search, ChevronDown, ChevronRight,
 LayoutDashboard, Map, BarChart3, LayoutGrid,
 Users, Clock, MapPin, FileCheck, TrendingUp, CheckSquare,
 DollarSign, Landmark, Receipt, CreditCard, Layers,
 Briefcase, UserCheck, Phone, Newspaper, UserPlus, LogIn, LogOut,
 FileText, BookOpen, Gamepad2, Headphones, Wrench, ShieldCheck,
 Crown, Building2, Star, Lock, Tag, Package, Zap, ShoppingBag,
 Navigation, ShoppingCart, Cpu, Brain, Activity,
 LineChart, Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import { canAccessRoute, filterNavItemsByRole } from '@/utils/platform-config';
import type { PlatformRole } from '@/types/platform';

/* ── Nav item with icon ──────────────────────────────────────────────────────── */ type NavItemDef = {
 label: string;
 href: string;
 icon: any;
};

type NavGroup = {
 label: string;
 items: NavItemDef[];
};

/* ── Full nav group definitions ──────────────────────────────────────────────── */ const NAV_GROUPS: NavGroup[] = [
 {
 label: 'Core',
 items: [
 { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
 { label: 'A2Z Atlas', href: '/a2z-atlas', icon: Map },
 { label: 'Analytics', href: '/analytics', icon: BarChart3 },
 { label: 'My Workspace', href: '/my-workspace', icon: LayoutGrid },
 { label: 'Activity', href: '/activity', icon: Activity },
 ],
 },
 {
 label: 'HR Operations',
 items: [
 { label: 'Employees', href: '/employees', icon: Users },
 { label: 'Attendance', href: '/attendance', icon: Clock },
 { label: 'Tracking', href: '/tracking', icon: Navigation },
 { label: 'Leave', href: '/leave', icon: FileCheck },
 { label: 'Performance', href: '/performance', icon: TrendingUp },
 { label: 'Tasks', href: '/tasks', icon: CheckSquare },
 { label: 'Location', href: '/location', icon: MapPin },
 ],
 },
 {
 label: 'Payroll & Finance',
 items: [
 { label: 'Payroll', href: '/payroll', icon: DollarSign },
 { label: 'Finance', href: '/finance', icon: Landmark },
 { label: 'Expense', href: '/expense', icon: Receipt },
 { label: 'Payments', href: '/payments', icon: CreditCard },
 { label: 'Subscriptions', href: '/subscriptions', icon: Layers },
 ],
 },
 {
 label: 'Sales & CRM',
 items: [
 { label: 'CRM', href: '/crm', icon: Briefcase },
 { label: 'Sales', href: '/sales', icon: LineChart },
 { label: 'Marketing', href: '/marketing', icon: Newspaper },
 { label: 'Procurement', href: '/procurement', icon: ShoppingCart },
 { label: 'Recruiter Revenue', href: '/recruiter-revenue', icon: Wallet },
 ],
 },
 {
 label: 'Talent Acquisition',
 items: [
 { label: 'Recruitment', href: '/recruitment', icon: UserPlus },
 { label: 'Candidates', href: '/candidates', icon: UserCheck },
 { label: 'Interviews', href: '/interviews', icon: Phone },
 { label: 'Job Board', href: '/job-board', icon: Newspaper },
 { label: 'Recruiter Hub', href: '/recruiter-hub', icon: Users },
 { label: 'Onboarding', href: '/onboarding', icon: LogIn },
 { label: 'Offboarding', href: '/offboarding', icon: LogOut },
 ],
 },
 {
 label: 'Workforce Tools',
 items: [
 { label: 'Documents', href: '/documents', icon: FileText },
 { label: 'LMS', href: '/lms', icon: BookOpen },
 { label: 'Gamification', href: '/gamification', icon: Gamepad2 },
 { label: 'Helpdesk', href: '/helpdesk', icon: Headphones },
 { label: 'Services', href: '/services', icon: Wrench },
 { label: 'Compliance', href: '/compliance', icon: ShieldCheck },
 ],
 },
 {
 label: 'Platform Admin',
 items: [
 { label: 'Super Admin', href: '/super-admin', icon: Crown },
 { label: 'Departments', href: '/departments', icon: Building2 },
 { label: 'Designations', href: '/designations', icon: Star },
 { label: 'Permissions', href: '/permissions', icon: Lock },
 { label: 'Plan Catalog', href: '/plan-catalog', icon: Tag },
 { label: 'White Label', href: '/white-label', icon: Package },
 { label: 'Automation', href: '/automation', icon: Zap },
 { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
 { label: 'AI Hub', href: '/ai-hub', icon: Brain },
 { label: 'Executive Brain', href: '/executive-brain', icon: Cpu },
 { label: 'Smart Platform', href: '/smart-platform', icon: Cpu },
 ],
 },
];

/* ── Props ───────────────────────────────────────────────────────────────────── */ type SideNavigationProps = {
 activeRole: PlatformRole;
 isOpen: boolean;
 onClose: () => void;
};

/* ── Nav Group Section ───────────────────────────────────────────────────────── */ function NavGroupSection({
 group,
 activeRole,
 pathname,
 onClose,
 defaultOpen = true,
}: {
 group: NavGroup;
 activeRole: PlatformRole;
 pathname: string;
 onClose: () => void;
 defaultOpen?: boolean;
}) {
 const [open, setOpen] = useState(defaultOpen);

 const accessibleItems = group.items.filter((item) =>
 canAccessRoute(activeRole, item.href),
 );

 if (accessibleItems.length === 0) return null;

 return (
 <div>
 <button
 type="button"
 onClick={() => setOpen((v) => !v)}
 className="flex w-full items-center justify-between px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-400 transition-colors"
 >
 {group.label}
 {open
 ? <ChevronDown size={10} className="shrink-0" />
 : <ChevronRight size={10} className="shrink-0" />
 }
 </button>

 {open && (
 <div className="space-y-0.5">
 {accessibleItems.map((item) => {
 const Icon = item.icon;
 const active = pathname === item.href || pathname.startsWith(item.href + '/');
 return (
 <Link
 key={item.href}
 href={`${item.href}?role=${activeRole}`}
 onClick={onClose}
 className={clsx(
 'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-150',
 active
 ? 'bg-navy-light text-white shadow-sm '
 : 'text-slate-300 hover:bg-depth-3 hover:text-white ',
 )}
 >
 <Icon
 size={15}
 className={clsx(
 'shrink-0 transition-colors',
 active
 ? 'text-white '
 : 'text-slate-400 group-hover:text-slate-300 ',
 )}
 />
 <span className="truncate">{item.label}</span>
 {active && (
 <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
 )}
 </Link>
 );
 })}
 </div>
 )}
 </div>
 );
}

/* ── SideNavigation ──────────────────────────────────────────────────────────── */ export function SideNavigation({ activeRole, isOpen, onClose }: SideNavigationProps) {
 const pathname = usePathname();
 const [query, setQuery] = useState('');

 /* Flat filtered list for search mode */ const filteredGroups = useMemo(() => {
 if (!query.trim()) return NAV_GROUPS;
 const q = query.toLowerCase();
 return NAV_GROUPS.map((group) => ({
 ...group,
 items: group.items.filter((item) =>
 item.label.toLowerCase().includes(q) && canAccessRoute(activeRole, item.href),
 ),
 })).filter((g) => g.items.length > 0);
 }, [query, activeRole]);

 /* Count accessible items across all groups */ const totalAccessible = useMemo(
 () => NAV_GROUPS.flatMap((g) => g.items).filter((i) => canAccessRoute(activeRole, i.href)).length,
 [activeRole],
 );

 return (
 <>
 {/* Mobile overlay */}
 <div
 className={clsx(
 'fixed inset-0 z-30 bg-navy-light/50 backdrop-blur-sm transition-opacity lg:hidden',
 isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
 )}
 onClick={onClose}
 aria-hidden="true"
 />

 {/* Sidebar panel */}
 <aside
 className={clsx(
 'fixed left-0 top-0 z-40 flex h-full w-72 flex-col border-r border-white/10 bg-navy/98 shadow-2xl glass-3d-panel !rounded-none !border-y-0 !border-l-0 transition-transform duration-300 lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:shadow-none ',
 isOpen ? 'translate-x-0' : '-translate-x-full',
 )}
 >
 {/* Mobile header */}
 <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden ">
 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Navigation</p>
 <button
 type="button"
 onClick={onClose}
 className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-navy-light "
 aria-label="Close navigation"
 >
 <X size={13} />
 </button>
 </div>

 {/* Search */}
 <div className="shrink-0 px-3 pt-3 pb-2">
 <div className="relative">
 <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
 <input
 type="search"
 placeholder="Search modules..."
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 className="w-full rounded-xl border border-white/10 bg-navy-light py-2 pl-8 pr-3 text-xs text-slate-200 outline-none transition focus:border-slate-400 focus:bg-navy-light "
 aria-label="Search navigation"
 />
 </div>
 </div>

 {/* Nav groups — scrollable */}
 <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 space-y-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
 {filteredGroups.map((group, idx) => (
 <NavGroupSection
 key={group.label}
 group={group}
 activeRole={activeRole}
 pathname={pathname ?? ''}
 onClose={onClose}
 defaultOpen={idx < 3}
 />
 ))}

 {filteredGroups.length === 0 && (
 <div className="py-8 text-center">
 <Search size={20} className="mx-auto mb-2 text-slate-300" />
 <p className="text-xs text-slate-400">No modules found</p>
 </div>
 )}
 </div>

 {/* Footer status card */}
 <div className="shrink-0 border-t border-white/10 p-3 ">
 <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-3 ">
 <div className="flex items-center gap-2 mb-1.5">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-live" aria-hidden="true" />
 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Platform Status</p>
 </div>
 <p className="text-xs font-bold text-white">{totalAccessible} modules accessible</p>
 <p className="mt-0.5 text-[10px] text-slate-400">Role: <span className="text-slate-400 font-semibold">{activeRole}</span></p>
 </div>
 </div>
 </aside>
 </>
 );
}
