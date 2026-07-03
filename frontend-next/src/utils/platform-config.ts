import type { PlatformNavItem, PlatformRole } from '@/types/platform';

export const PLATFORM_BRAND = 'AKUL DRAVIN';

const ALL_ROLES: PlatformRole[] = [
 'platform-admin',
 'company-admin',
 'hr-manager',
 'team-manager',
 'team-leader',
 'sales-manager',
 'recruiter',
 'employee',
 'guest',
];

const ADMIN_ROLES: PlatformRole[] = ['platform-admin', 'company-admin', 'hr-manager'];
const TALENT_ROLES: PlatformRole[] = ['platform-admin', 'company-admin', 'hr-manager', 'recruiter'];
const WORKFORCE_ROLES: PlatformRole[] = ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'team-leader', 'sales-manager', 'employee'];
const BILLING_ROLES: PlatformRole[] = ['platform-admin', 'company-admin'];

export const PLATFORM_ROLE_OPTIONS: { role: PlatformRole; label: string }[] = [
 { role: 'platform-admin', label: 'Platform Super Admin' },
 { role: 'company-admin', label: 'Company Admin' },
 { role: 'hr-manager', label: 'HR Manager' },
 { role: 'team-manager', label: 'Team Manager' },
 { role: 'team-leader', label: 'Team Leader' },
 { role: 'sales-manager', label: 'Sales Manager' },
 { role: 'recruiter', label: 'Recruiter' },
 { role: 'employee', label: 'Employee' },
 { role: 'guest', label: 'Guest' },
];

export const TOP_NAV_ITEMS: PlatformNavItem[] = [
 { label: 'Master Dashboard', href: '/master-dashboard' },
 { label: 'Dashboard', href: '/dashboard' },
 { label: 'A2Z Atlas', href: '/a2z-atlas' },
 { label: 'Employees', href: '/employees' },
 { label: 'Attendance', href: '/attendance' },
 { label: 'Tracking', href: '/tracking' },
 { label: 'Tasks', href: '/tasks' },
 { label: 'Payroll', href: '/payroll' },
 { label: 'Performance', href: '/performance' },
 { label: 'Location', href: '/location' },
 { label: 'Recruitment', href: '/recruitment' },
 { label: 'CRM', href: '/crm' },
 { label: 'Sales', href: '/sales' },
 { label: 'Marketing', href: '/marketing' },
 { label: 'Finance', href: '/finance' },
 { label: 'Documents', href: '/documents' },
 { label: 'Services', href: '/services' },
 { label: 'Helpdesk', href: '/helpdesk' },
 { label: 'Procurement', href: '/procurement' },
 { label: 'Analytics', href: '/analytics' },
 { label: 'Permissions', href: '/permissions' },
 { label: 'Revenue Intelligence', href: '/revenue-intelligence' },
 { label: 'Settings', href: '/settings' },
];

const LEGACY_NAV_ITEMS: PlatformNavItem[] = [
 { label: 'Departments', href: '/departments' },
 { label: 'Designations', href: '/designations' },
 { label: 'Onboarding', href: '/onboarding' },
 { label: 'Interviews', href: '/interviews' },
 { label: 'Candidates', href: '/candidates' },
 { label: 'LMS', href: '/lms' },
 { label: 'Gamification', href: '/gamification' },
 { label: 'Leave', href: '/leave' },
 { label: 'Expense', href: '/expense' },
 { label: 'Compliance', href: '/compliance' },
 { label: 'Offboarding', href: '/offboarding' },
 { label: 'AI Hub', href: '/ai-hub' },
 { label: 'Job Board', href: '/job-board' },
 { label: 'Recruiter Hub', href: '/recruiter-hub' },
 { label: 'Recruiter Revenue', href: '/recruiter-revenue' },
 { label: 'Super Admin', href: '/super-admin' },
 { label: 'Plan Catalog', href: '/plan-catalog' },
 { label: 'Subscriptions', href: '/subscriptions' },
 { label: 'Payments', href: '/payments' },
 { label: 'White Label', href: '/white-label' },
];

export const SIDE_NAV_ITEMS: PlatformNavItem[] = [
 ...TOP_NAV_ITEMS,
 { label: 'Automation', href: '/automation' },
 { label: 'Marketplace', href: '/marketplace' },
 ...LEGACY_NAV_ITEMS,
];

export const ROUTE_ACCESS: Record<string, PlatformRole[]> = {
 '/master-dashboard': ['platform-admin', 'company-admin'],
 '/dashboard': ALL_ROLES,
 '/a2z-atlas': ALL_ROLES,
 '/employees': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'recruiter'],
 '/attendance': WORKFORCE_ROLES,
 '/tracking': WORKFORCE_ROLES,
 '/tasks': WORKFORCE_ROLES,
 '/payroll': ['platform-admin', 'company-admin', 'hr-manager', 'sales-manager'],
 '/performance': WORKFORCE_ROLES,
 '/location': WORKFORCE_ROLES,
 '/recruitment': TALENT_ROLES,
 '/crm': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'team-leader', 'sales-manager', 'recruiter'],
 '/sales': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'team-leader', 'sales-manager'],
 '/marketing': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager'],
 '/finance': ['platform-admin', 'company-admin', 'hr-manager', 'sales-manager'],
 '/documents': ['platform-admin', 'company-admin', 'hr-manager', 'recruiter', 'employee'],
 '/services': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'team-leader', 'sales-manager', 'recruiter', 'employee'],
 '/helpdesk': WORKFORCE_ROLES,
 '/procurement': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager'],
 '/analytics': ALL_ROLES,
 '/permissions': ADMIN_ROLES,
 '/revenue-intelligence': BILLING_ROLES,
 '/settings': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'team-leader', 'sales-manager', 'recruiter', 'employee'],
 '/automation': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager'],
 '/marketplace': ['platform-admin', 'company-admin', 'hr-manager', 'recruiter', 'guest'],
 '/departments': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager'],
 '/designations': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager'],
 '/onboarding': TALENT_ROLES,
 '/interviews': TALENT_ROLES,
 '/candidates': TALENT_ROLES,
 '/lms': WORKFORCE_ROLES,
 '/gamification': WORKFORCE_ROLES,
 '/leave': WORKFORCE_ROLES,
 '/expense': ['platform-admin', 'company-admin', 'hr-manager', 'team-manager', 'sales-manager', 'employee'],
 '/compliance': ADMIN_ROLES,
 '/offboarding': TALENT_ROLES,
 '/ai-hub': ['platform-admin', 'company-admin', 'hr-manager', 'sales-manager'],
 '/job-board': TALENT_ROLES,
 '/recruiter-hub': TALENT_ROLES,
 '/recruiter-revenue': ['platform-admin', 'company-admin', 'hr-manager', 'recruiter', 'sales-manager'],
 '/super-admin': ['platform-admin'],
 '/plan-catalog': BILLING_ROLES,
 '/subscriptions': BILLING_ROLES,
 '/payments': BILLING_ROLES,
 '/white-label': BILLING_ROLES,
};

export const ROLE_DESCRIPTION: Record<PlatformRole, string> = {
 'platform-admin': 'Global governance for tenants, permissions, policy security controls, and office operations command.',
 'company-admin': 'Company-wide controls for compliance, organizational policies, workforce budgets, and approvals.',
 'hr-manager': 'Employee lifecycle operations, attendance audits, leave, payroll readiness, and workforce experience.',
 'team-manager': 'Team execution management across attendance, productivity, location visibility, and work allocation.',
 'team-leader': 'Day-to-day squad oversight for task delivery, deadline adherence, and performance coaching.',
 'sales-manager': 'Sales target execution, commission monitoring, CRM pipeline control, and conversion analytics.',
 recruiter: 'Recruitment execution, candidate pipeline velocity, interview flow, and offer closure tracking.',
 employee: 'Self-service workspace for attendance, tasks, documents, performance, salary forecast, and notifications.',
 guest: 'Restricted read-only access to approved pages, reports, and shared organizational data.',
};

export const isPlatformRole = (value: string): value is PlatformRole =>
 PLATFORM_ROLE_OPTIONS.some((item) => item.role === value);

export const toSafePlatformRole = (value: string | PlatformRole | null | undefined): PlatformRole => {
 if (typeof value === 'string' && isPlatformRole(value)) {
 return value;
 }

 return 'platform-admin';
};

export const toRoleLabel = (role: PlatformRole | string) =>
 PLATFORM_ROLE_OPTIONS.find((item) => item.role === toSafePlatformRole(role))?.label ?? 'Platform Super Admin';

const normalizePath = (href: string) => href.split('?')[0];

export const canAccessRoute = (role: PlatformRole | string, href: string) => {
 const path = normalizePath(href);
 const allowedRoles = ROUTE_ACCESS[path];

 if (!allowedRoles) {
 return true;
 }

 return allowedRoles.includes(toSafePlatformRole(role));
};

export const filterNavItemsByRole = (items: PlatformNavItem[], role: PlatformRole | string) =>
 items.filter((item) => canAccessRoute(role, item.href));


