export type LegacyModuleKey =
  | 'departments'
  | 'designations'
  | 'onboarding'
  | 'interviews'
  | 'candidates'
  | 'lms'
  | 'gamification'
  | 'leave'
  | 'expense'
  | 'compliance'
  | 'offboarding'
  | 'ai-hub'
  | 'super-admin'
  | 'job-board'
  | 'recruiter-hub'
  | 'recruiter-revenue'
  | 'plan-catalog'
  | 'subscriptions'
  | 'payments'
  | 'white-label';

export type LegacyModuleConfig = {
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string; detail: string }>;
  highlights: string[];
  quickLinks: Array<{ label: string; href: string }>;
  tableTitle: string;
  columns: Array<{ key: 'item' | 'owner' | 'status' | 'updated'; label: string }>;
  rows: Array<{ id: string; item: string; owner: string; status: string; updated: string }>;
};

const columns: LegacyModuleConfig['columns'] = [
  { key: 'item', label: 'Item' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'updated', label: 'Updated' },
];

const createModule = (
  title: string,
  description: string,
  metrics: LegacyModuleConfig['metrics'],
  highlights: string[],
  quickLinks: LegacyModuleConfig['quickLinks'],
  rows: LegacyModuleConfig['rows'],
): LegacyModuleConfig => ({
  title,
  description,
  metrics,
  highlights,
  quickLinks,
  tableTitle: `${title} Snapshot`,
  columns,
  rows,
});

export const legacyModuleConfigs: Record<LegacyModuleKey, LegacyModuleConfig> = {
  departments: createModule('Department Operations Matrix', 'Department hierarchy, headcount planning, and ownership control.', [{ label: 'Departments', value: '12', detail: 'active units' }, { label: 'Open Headcount', value: '64', detail: 'linked with ATS' }], ['Dept policy sync with payroll and attendance.', 'Headcount requests trigger workflow automation.'], [{ label: 'Designations', href: '/designations' }, { label: 'Employees', href: '/employees' }], [{ id: 'dep-1', item: 'Engineering', owner: 'Priya Nair', status: 'Healthy', updated: '06 Mar' }, { id: 'dep-2', item: 'Sales', owner: 'Vikram Singh', status: 'Scaling', updated: '06 Mar' }]),
  designations: createModule('Designation Governance', 'Role ladders, salary bands, and reporting matrix governance.', [{ label: 'Role Profiles', value: '148', detail: 'mapped roles' }, { label: 'Band Compliance', value: '96.9%', detail: 'salary policy' }], ['Designation changes sync with payroll bands.', 'Promotion queue tied with performance cycles.'], [{ label: 'Departments', href: '/departments' }, { label: 'Performance', href: '/performance' }], [{ id: 'des-1', item: 'Senior Engineer L4', owner: 'Engineering', status: 'Active', updated: '05 Mar' }, { id: 'des-2', item: 'HR Manager L4', owner: 'HR', status: 'Active', updated: '05 Mar' }]),
  onboarding: createModule('Onboarding Automation Hub', 'Pre-join to day-one workflows for HR, IT, and payroll readiness.', [{ label: 'New Joinees', value: '34', detail: 'this month' }, { label: 'Completion', value: '94.2%', detail: 'checklist done' }], ['Offer acceptance triggers onboarding chain.', 'Access and document generation are automated.'], [{ label: 'Recruitment', href: '/recruitment' }, { label: 'Offboarding', href: '/offboarding' }], [{ id: 'on-1', item: 'Isha Khanna - Data Analyst', owner: 'HR Ops', status: 'Documentation', updated: '06 Mar' }, { id: 'on-2', item: 'Harsh Verma - Sales Exec', owner: 'Sales HR', status: 'Provisioning', updated: '06 Mar' }]),
  interviews: createModule('Interview Flow Console', 'Panel scheduling, feedback SLAs, and candidate conversion monitoring.', [{ label: 'Scheduled', value: '52', detail: 'next 10 days' }, { label: 'Feedback SLA', value: '9.4h', detail: 'turnaround' }], ['Panel availability is auto-matched.', 'Round-level feedback reminders are enforced.'], [{ label: 'Candidates', href: '/candidates' }, { label: 'Job Board', href: '/job-board' }], [{ id: 'iv-1', item: 'Karan - Backend Engineer', owner: 'Talent Team', status: 'Confirmed', updated: '06 Mar' }, { id: 'iv-2', item: 'Nidhi - Payroll Analyst', owner: 'Finance HR', status: 'Pending Feedback', updated: '06 Mar' }]),
  candidates: createModule('Candidate Intelligence Pool', 'Unified ATS talent pool with AI scoring and stage control.', [{ label: 'Active Candidates', value: '1,946', detail: 'open pipeline' }, { label: 'AI Match', value: '91.3%', detail: 'fit accuracy' }], ['Candidate scoring syncs with interview outcomes.', 'Top-fit alerts surface high-quality profiles.'], [{ label: 'Interviews', href: '/interviews' }, { label: 'Recruitment', href: '/recruitment' }], [{ id: 'cd-1', item: 'Samar Kapoor - Backend', owner: 'Recruiter Team', status: 'Interview', updated: '06 Mar' }, { id: 'cd-2', item: 'Aarohi Sen - HR Manager', owner: 'HR Recruiter', status: 'Offer', updated: '06 Mar' }]),
  lms: createModule('Learning Management Workspace', 'Learning paths, certifications, and upskilling analytics.', [{ label: 'Learning Paths', value: '46', detail: 'active tracks' }, { label: 'Completion', value: '81.7%', detail: 'monthly completion' }], ['Course completion links to appraisal cycles.', 'Certification records sync to documents module.'], [{ label: 'Gamification', href: '/gamification' }, { label: 'Performance', href: '/performance' }], [{ id: 'lm-1', item: 'Leadership Accelerator', owner: 'L&D Team', status: 'Running', updated: '06 Mar' }, { id: 'lm-2', item: 'Payroll Compliance 2026', owner: 'Finance HR', status: 'Running', updated: '05 Mar' }]),
  gamification: createModule('Gamification Engine', 'Points, tiers, rewards, and leaderboard-based engagement controls.', [{ label: 'Challenges', value: '19', detail: 'active boards' }, { label: 'Participation', value: '88.6%', detail: 'eligible users' }], ['Rewards align with attendance and performance.', 'Leaderboards refresh from task and target events.'], [{ label: 'LMS', href: '/lms' }, { label: 'Tasks', href: '/tasks' }], [{ id: 'gm-1', item: 'Sales South', owner: 'Revenue Ops', status: 'Diamond Tier', updated: '06 Mar' }, { id: 'gm-2', item: 'HR Operations', owner: 'People Team', status: 'Platinum Tier', updated: '06 Mar' }]),
  leave: createModule('Leave Governance Center', 'Leave approvals, balances, policy checks, and payroll deductions.', [{ label: 'Pending', value: '43', detail: 'approvals' }, { label: 'Utilization', value: '72.8%', detail: 'quarter to date' }], ['Leave decisions sync with payroll deduction.', 'Escalations trigger after SLA thresholds.'], [{ label: 'Attendance', href: '/attendance' }, { label: 'Payroll', href: '/payroll' }], [{ id: 'lv-1', item: 'Neha Kapoor - Paid Leave', owner: 'HR Manager', status: 'Approved', updated: '06 Mar' }, { id: 'lv-2', item: 'Raghav Menon - Sick Leave', owner: 'Finance Manager', status: 'Pending', updated: '06 Mar' }]),
  expense: createModule('Expense Reimbursement Desk', 'Expense claims, policy validation, and reimbursement payout flow.', [{ label: 'Claims', value: '286', detail: 'this month' }, { label: 'Approval SLA', value: '96.2%', detail: 'on-time' }], ['Claim categories map to finance ledgers.', 'Approved expenses sync with payroll or direct payout.'], [{ label: 'Finance', href: '/finance' }, { label: 'Compliance', href: '/compliance' }], [{ id: 'ex-1', item: 'EXP-2001 Travel Claim', owner: 'Aarav Mehta', status: 'Approved', updated: '06 Mar' }, { id: 'ex-2', item: 'EXP-2002 Client Meal', owner: 'Isha Khanna', status: 'Review', updated: '06 Mar' }]),
  compliance: createModule('Compliance & Audit Control', 'Policy compliance, statutory checks, and audit closure tracking.', [{ label: 'Compliance Score', value: '98.1%', detail: 'consolidated' }, { label: 'Open Audit Points', value: '11', detail: 'pending closure' }], ['Policy controls link to RBAC and workflow logs.', 'High-risk exceptions trigger admin alerts.'], [{ label: 'Permissions', href: '/permissions' }, { label: 'Super Admin', href: '/super-admin' }], [{ id: 'cp-1', item: 'Payroll statutory filing', owner: 'Finance Lead', status: 'Compliant', updated: '06 Mar' }, { id: 'cp-2', item: 'Role access matrix review', owner: 'Security Admin', status: 'Watchlist', updated: '05 Mar' }]),
  offboarding: createModule('Offboarding Execution Center', 'Exit approvals, handover tasks, asset recovery, and FNF controls.', [{ label: 'Exit Cases', value: '18', detail: 'active this month' }, { label: 'Asset Recovery', value: '97.1%', detail: 'completion' }], ['Exit workflow triggers IT, HR, and finance actions.', 'FNF status syncs with payroll processing.'], [{ label: 'Onboarding', href: '/onboarding' }, { label: 'Payroll', href: '/payroll' }], [{ id: 'of-1', item: 'Harish Verma - Engineering', owner: 'IT + HR', status: 'Clearance Pending', updated: '06 Mar' }, { id: 'of-2', item: 'Ruchi Jain - Sales', owner: 'HR Ops', status: 'Closed', updated: '05 Mar' }]),
  'ai-hub': createModule('AI Intelligence Hub', 'Model health, AI predictions, and automation confidence operations.', [{ label: 'AI Models', value: '302', detail: 'active models' }, { label: 'Inference Success', value: '99.1%', detail: 'production' }], ['Attrition, payroll, sales, and fraud models monitored centrally.', 'Drift alerts track retraining requirements.'], [{ label: 'Analytics', href: '/analytics' }, { label: 'Automation', href: '/automation' }], [{ id: 'ai-1', item: 'Attrition Predictor v7', owner: 'AI Team', status: 'Healthy', updated: '06 Mar' }, { id: 'ai-2', item: 'Payroll Anomaly Guard', owner: 'AI + Finance', status: 'Watchlist', updated: '06 Mar' }]),
  'super-admin': createModule('Platform Super Admin Governance', 'Global tenant, security, billing, and policy command center.', [{ label: 'Tenants', value: '468', detail: 'active companies' }, { label: 'Security Posture', value: '99.4%', detail: 'global controls' }], ['Tenant controls include RBAC templates and white-label settings.', 'Global alerts aggregate risks across modules.'], [{ label: 'Plan Catalog', href: '/plan-catalog' }, { label: 'White Label', href: '/white-label' }], [{ id: 'sa-1', item: 'Akul Dravin Technologies', owner: 'Global Admin', status: 'Stable', updated: '06 Mar' }, { id: 'sa-2', item: 'Pilot Corp', owner: 'Global Admin', status: 'Watchlist', updated: '06 Mar' }]),
  'job-board': createModule('Recruitment Job Board', 'Publishing and managing openings with hiring funnel visibility.', [{ label: 'Live Openings', value: '126', detail: 'job posts' }, { label: 'Applications', value: '1,482', detail: 'this week' }], ['Job postings sync with ATS and candidate pipeline.', 'Source analytics supports conversion optimization.'], [{ label: 'Recruitment', href: '/recruitment' }, { label: 'Recruiter Hub', href: '/recruiter-hub' }], [{ id: 'jb-1', item: 'Senior Backend Engineer', owner: 'Talent Team', status: 'Open', updated: '06 Mar' }, { id: 'jb-2', item: 'Enterprise AE', owner: 'Sales Recruiter', status: 'Interviewing', updated: '06 Mar' }]),
  'recruiter-hub': createModule('Recruiter Marketplace Hub', 'Recruiter network performance, quality score, and hiring throughput.', [{ label: 'Active Recruiters', value: '94', detail: 'network size' }, { label: 'Placement Success', value: '41.2%', detail: 'conversion' }], ['Recruiter scorecards combine speed and quality.', 'Partner submissions auto-map to role requirements.'], [{ label: 'Job Board', href: '/job-board' }, { label: 'Recruiter Revenue', href: '/recruiter-revenue' }], [{ id: 'rh-1', item: 'Nisha Verma - Tech Hiring', owner: 'Marketplace Ops', status: '4.7/5', updated: '06 Mar' }, { id: 'rh-2', item: 'Aman Joshi - Sales Hiring', owner: 'Marketplace Ops', status: '4.5/5', updated: '06 Mar' }]),
  'recruiter-revenue': createModule('Recruiter Revenue & Commission', 'Placement commissions, payouts, and recruiter earnings operations.', [{ label: 'Gross Commission', value: 'INR 32.6L', detail: 'quarter to date' }, { label: 'Pending Payout', value: 'INR 8.5L', detail: 'awaiting release' }], ['Commission slabs support tiered payout logic.', 'Closed placements trigger payout workflow automation.'], [{ label: 'Recruiter Hub', href: '/recruiter-hub' }, { label: 'Payroll', href: '/payroll' }], [{ id: 'rr-1', item: 'Nisha Verma - 14 placements', owner: 'Finance Ops', status: 'Partial Paid', updated: '06 Mar' }, { id: 'rr-2', item: 'Aman Joshi - 11 placements', owner: 'Finance Ops', status: 'Paid', updated: '05 Mar' }]),
  'plan-catalog': createModule('Plan Catalog & Packaging', 'Pricing plans, feature limits, and module entitlement management.', [{ label: 'Plans', value: '18', detail: 'active packages' }, { label: 'Add-on Attach', value: '63%', detail: 'AI + automation' }], ['Plan limits control API and AI usage caps.', 'Catalog syncs with subscriptions and billing.'], [{ label: 'Subscriptions', href: '/subscriptions' }, { label: 'Payments', href: '/payments' }], [{ id: 'pc-1', item: 'HR Growth - INR 2,999/mo', owner: 'Product Billing', status: 'Active', updated: '06 Mar' }, { id: 'pc-2', item: 'Global BOS - INR 19,999/mo', owner: 'Product Billing', status: 'Active', updated: '06 Mar' }]),
  subscriptions: createModule('Subscription Lifecycle Desk', 'Renewal, expansion, retention, and contract lifecycle operations.', [{ label: 'Active', value: '452', detail: 'subscriptions' }, { label: 'Renewals 30d', value: '37', detail: 'upcoming' }], ['Contract events trigger renewal task automation.', 'Usage risk signals support proactive retention actions.'], [{ label: 'Plan Catalog', href: '/plan-catalog' }, { label: 'Payments', href: '/payments' }], [{ id: 'sb-1', item: 'Akul Dravin - Global BOS', owner: 'CSM Team', status: 'Active', updated: '06 Mar' }, { id: 'sb-2', item: 'Aster Logistics - HR Growth', owner: 'CSM Team', status: 'At Risk', updated: '06 Mar' }]),
  payments: createModule('Payments & Collections Desk', 'Invoices, receivables, collection status, and payout reconciliation.', [{ label: 'Collected', value: 'INR 3.6Cr', detail: 'this month' }, { label: 'Receivables', value: 'INR 1.1Cr', detail: 'outstanding' }], ['Payment status syncs with subscription and finance modules.', 'Receivable alerts use due-date and risk prioritization.'], [{ label: 'Subscriptions', href: '/subscriptions' }, { label: 'Finance', href: '/finance' }], [{ id: 'pm-1', item: 'INV-2026-1120 CloudWorks', owner: 'Finance Team', status: 'Paid', updated: '06 Mar' }, { id: 'pm-2', item: 'INV-2026-1128 NorthGrid', owner: 'Finance Team', status: 'Pending', updated: '06 Mar' }]),
  'white-label': createModule('White Label Partner Command', 'Partner branding, tenant operations, and partner revenue performance.', [{ label: 'Partners', value: '28', detail: 'active' }, { label: 'Partner MRR', value: 'INR 1.9Cr', detail: 'combined' }], ['Brand packs control logo, domain, and workspace identity.', 'Partner analytics track MRR, clients, and SLA health.'], [{ label: 'Super Admin', href: '/super-admin' }, { label: 'Plan Catalog', href: '/plan-catalog' }], [{ id: 'wl-1', item: 'PeopleOps Global', owner: 'Partner Ops', status: 'Active', updated: '06 Mar' }, { id: 'wl-2', item: 'TalentFlow Partners', owner: 'Partner Ops', status: 'Active', updated: '05 Mar' }]),
};
