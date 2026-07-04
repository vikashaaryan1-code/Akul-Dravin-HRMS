'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useUIStore } from '@/store/ui-store';
import { toRoleLabel } from '@/utils/platform-config';

type RouteBanner = {
 title: string;
 description: string;
 badge: string;
 imageSrc: string;
 highlights?: string[];
};

const defaultBanner: RouteBanner = {
 title: 'Office Portal Workspace',
 description: 'Unified workforce, attendance, performance, security, and workflow operations panel.',
 badge: 'Enterprise Control',
 imageSrc: '/images/office-portal/dashboard-overview.svg',
 highlights: ['Role-aware workspace', 'Protected operations', 'Connected modules'],
};

const routeBannerMap: Record<string, RouteBanner> = {
 '/dashboard': {
 title: 'Executive Operations Command Mesh',
 description: 'Premium realtime control plane for attendance, productivity, location, tasks, approvals, payroll, and AI-guided governance.',
 badge: 'Realtime Command Grid',
 imageSrc: '/images/office-portal/dashboard-overview.svg',
 highlights: ['Live command telemetry', 'AI guidance', 'Governance posture'],
 },
 '/a2z-atlas': {
 title: 'AKUL DRAVIN A2Z Atlas Workspace',
 description: 'Platform-side atlas route for module mapping, rollout grouping, and role-aware command planning inside AKUL DRAVIN HRMS.',
 badge: 'Atlas Sync',
 imageSrc: '/images/office-portal/dashboard-overview.svg',
 highlights: ['AKUL DRAVIN module map', 'Platform rollout view', 'Command lane visibility'],
 },
 '/employees': {
 title: 'Employee Atlas Command Deck',
 description: 'Premium workforce surface for spotlight profiles, roster intelligence, document readiness, and role-aware employee actions.',
 badge: 'Workforce Atlas',
 imageSrc: '/images/office-portal/dashboard-overview.svg',
 highlights: ['A2Z-inspired roster', 'Spotlight profiles', 'Live workforce visibility'],
 },
 '/attendance': {
 title: 'Attendance & Workday Engine',
 description: 'Monitor check-in, check-out, shifts, overtime, leave deduction, and biometric attendance integrity.',
 badge: 'Attendance Intelligence',
 imageSrc: '/images/office-portal/tracking-activity.svg',
 },
 '/tracking': {
 title: 'Work Activity Tracking',
 description: 'Monitor login time, logout time, tasks completed, project effort, and daily productivity trends.',
 badge: 'Work Monitoring',
 imageSrc: '/images/office-portal/tracking-activity.svg',
 },
 '/tasks': {
 title: 'Task & Project Management',
 description: 'Assign tasks, monitor priorities, manage deadlines, and track project progress by manager hierarchy.',
 badge: 'Execution Hub',
 imageSrc: '/images/office-portal/tasks-flow.svg',
 },
 '/payroll': {
 title: 'Payroll & Compensation',
 description: 'Run monthly payroll, target-based incentives, days-wise salaries, and compliance-ready pay controls.',
 badge: 'Payroll Engine',
 imageSrc: '/images/office-portal/dashboard-overview.svg',
 },
 '/performance': {
 title: 'Performance Management',
 description: 'Evaluate target achievement, task completion, AI performance score, and team leaderboard ranking.',
 badge: 'Performance AI',
 imageSrc: '/images/office-portal/performance-wave.svg',
 },
 '/location': {
 title: 'Location Tracking & Geofencing',
 description: 'Observe office geofence presence, WFH mode, field mobility, and historical movement visibility.',
 badge: 'GPS Monitoring',
 imageSrc: '/images/office-portal/location-map.svg',
 },
 '/recruitment': {
 title: 'Recruitment Operations',
 description: 'Track job pipelines, candidate stages, interview flow, and conversion analytics in realtime.',
 badge: 'Talent Pipeline',
 imageSrc: '/images/office-portal/dashboard-overview.svg',
 },
 '/crm': {
 title: 'CRM Relationship Workspace',
 description: 'Manage leads, customer accounts, contacts, and interaction timelines in one connected CRM panel.',
 badge: 'CRM Core',
 imageSrc: '/images/office-portal/performance-wave.svg',
 },
 '/sales': {
 title: 'Sales Automation & CRM',
 description: 'Control lead funnel, deal progress, target performance, and commission automation tied to payroll.',
 badge: 'Revenue Ops',
 imageSrc: '/images/office-portal/performance-wave.svg',
 },
 '/marketing': {
 title: 'Marketing Automation Control',
 description: 'Run email, SMS, and WhatsApp campaigns with performance tracking and conversion attribution.',
 badge: 'Marketing Ops',
 imageSrc: '/images/office-portal/tasks-flow.svg',
 },
 '/finance': {
 title: 'Finance & Accounting Command',
 description: 'Track invoices, expenses, taxes, and financial KPIs with audit-ready accounting visibility.',
 badge: 'Finance Ops',
 imageSrc: '/images/office-portal/permissions-grid.svg',
 },
 '/documents': {
 title: 'Document & Certificate Center',
 description: 'Generate offer letters, salary slips, certificates, ID cards, and controlled downloadable assets.',
 badge: 'Document Automation',
 imageSrc: '/images/office-portal/permissions-grid.svg',
 },
 '/services': {
 title: 'Employee Service Portal',
 description: 'Manage support requests, service SLAs, and employee issue resolution through guided workflows.',
 badge: 'Service Desk',
 imageSrc: '/images/office-portal/tasks-flow.svg',
 },
 '/helpdesk': {
 title: 'Helpdesk & SLA Command',
 description: 'Track employee support tickets, escalation queues, and SLA compliance in a centralized support desk.',
 badge: 'Helpdesk Ops',
 imageSrc: '/images/office-portal/tasks-flow.svg',
 },
 '/procurement': {
 title: 'Procurement & Vendor Control',
 description: 'Manage vendors, purchase orders, spend governance, and procurement performance with finance alignment.',
 badge: 'Procurement Ops',
 imageSrc: '/images/office-portal/permissions-grid.svg',
 },
 '/analytics': {
 title: 'Workday & Workforce Analytics',
 description: 'Analyze attendance, productivity, payroll signals, performance trends, and operational forecast KPIs.',
 badge: 'Executive BI',
 imageSrc: '/images/office-portal/performance-wave.svg',
 },
 '/automation': {
 title: 'Workflow Automation Monitor',
 description: 'Observe triggered workflows, system alerts, and AI recommendations across all office modules.',
 badge: 'Automation Center',
 imageSrc: '/images/office-portal/tasks-flow.svg',
 },
 '/permissions': {
 title: 'Permission & Access Governance',
 description: 'Grant or revoke role permissions, audit changes, and enforce security controls by business scope.',
 badge: 'RBAC Control',
 imageSrc: '/images/office-portal/permissions-grid.svg',
 },
 '/marketplace': {
 title: 'Recruitment Marketplace',
 description: 'Connect recruiters, talent partners, and hiring pipelines under governed enterprise controls.',
 badge: 'Marketplace',
 imageSrc: '/images/office-portal/dashboard-overview.svg',
 },
 '/settings': {
 title: 'Platform Security & Preferences',
 description: 'Manage role preferences, notification defaults, security posture, and workspace operating modes.',
 badge: 'Security Controls',
 imageSrc: '/images/office-portal/permissions-grid.svg',
 },
};

export function PlatformRouteBanner() {
 const pathname = usePathname();
 const activeRole = useUIStore((state) => state.activeRole);

 const safePath = pathname ?? '';
 const banner = useMemo(() => (safePath && routeBannerMap[safePath] ? routeBannerMap[safePath] : defaultBanner), [safePath]);
 const highlights = banner.highlights ?? defaultBanner.highlights ?? [];

 return (
 <section className="overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-depth-1 to-navy-dark p-4 shadow-lg backdrop-blur shadow-glass sm:p-5">
 <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <p className="inline-flex rounded-full bg-aqua/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-aqua">
 {banner.badge}
 </p>
 <p className="inline-flex rounded-full border border-white/10 bg-navy-light/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 ">
 Active Role: {toRoleLabel(activeRole)}
 </p>
 </div>
 <h2 className="mt-3 text-2xl font-semibold text-white ">{banner.title}</h2>
 <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 ">{banner.description}</p>
 <div className="mt-4 flex flex-wrap gap-2">
 {highlights.map((highlight) => (
 <span
 key={highlight}
 className="rounded-full border border-white/10 bg-navy-light/70 px-3 py-1 text-[11px] font-semibold text-slate-300 "
 >
 {highlight}
 </span>
 ))}
 </div>
 </div>
 <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-navy-light/90 sm:h-44">
 <Image
 src={banner.imageSrc}
 alt={`${banner.title} visual`}
 fill
 priority={false}
 className="object-cover"
 sizes="(max-width: 768px) 100vw, 35vw"
 />
 <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-navy-light/60 p-3 text-white backdrop-blur">
 <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Route Focus</p>
 <p className="mt-1 text-sm font-semibold">{safePath || '/dashboard'}</p>
 </div>
 </div>
 </div>
 </section>
 );
}


