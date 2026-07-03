import type {
 CandidateRecord,
 DocumentRecord,
 EmployeeRecord,
 JobPosting,
 NotificationItem,
 PlatformRole,
 RoleDashboardModel,
 SalesCommissionRecord,
 SalesCustomerAccountRecord,
 SalesDealRecord,
 SalesIntegrationPulse,
 SalesLeadRecord,
 SalesPipelineStageMeta,
 SalesTargetRecord,
 SalesTeamPerformanceRecord,
 TrendPoint,
} from '@/types/platform';

const monthlyTrend: TrendPoint[] = [
 { name: 'Jan', value: 72 },
 { name: 'Feb', value: 75 },
 { name: 'Mar', value: 77 },
 { name: 'Apr', value: 80 },
 { name: 'May', value: 84 },
 { name: 'Jun', value: 87 },
 { name: 'Jul', value: 85 },
 { name: 'Aug', value: 89 },
 { name: 'Sep', value: 91 },
 { name: 'Oct', value: 93 },
 { name: 'Nov', value: 95 },
 { name: 'Dec', value: 96 },
];

const engagementTrend: TrendPoint[] = [
 { name: 'Jan', value: 68 },
 { name: 'Feb', value: 71 },
 { name: 'Mar', value: 73 },
 { name: 'Apr', value: 74 },
 { name: 'May', value: 78 },
 { name: 'Jun', value: 79 },
 { name: 'Jul', value: 81 },
 { name: 'Aug', value: 84 },
 { name: 'Sep', value: 85 },
 { name: 'Oct', value: 87 },
 { name: 'Nov', value: 89 },
 { name: 'Dec', value: 90 },
];

export const roleDashboardData: Record<PlatformRole, RoleDashboardModel> = {
 'platform-admin': {
 heading: 'Platform Super Admin Command Center',
 summary: 'Control permissions, office automation, audit security, and global workforce telemetry from one cockpit.',
 kpis: [
 { id: 'k1', label: 'Active Companies', value: '468', trend: '+14 this month', trendDirection: 'up' },
 { id: 'k2', label: 'Tracked Employees', value: '108,420', trend: '+9.2%', trendDirection: 'up' },
 { id: 'k3', label: 'Security Alerts', value: '12', trend: '-18%', trendDirection: 'up' },
 { id: 'k4', label: 'Workflow SLA', value: '99.3%', trend: '+0.7%', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Pending Approvals', count: 48 },
 { stage: 'Policy Audits', count: 19 },
 { stage: 'Permission Requests', count: 34 },
 { stage: 'Completed Actions', count: 1240 },
 ],
 aiInsights: [
 'Location anomaly detected for 3 field teams after geofence cutoff.',
 'Permission drift identified in one tenant role template.',
 'Automation health stable with 99%+ success for attendance sync workflows.',
 ],
 },
 'company-admin': {
 heading: 'Company Admin Operations Dashboard',
 summary: 'Track attendance, productivity, payroll readiness, and office compliance across departments.',
 kpis: [
 { id: 'k1', label: 'Total Employees', value: '8,945', trend: '+5.7%', trendDirection: 'up' },
 { id: 'k2', label: 'Present Today', value: '92.6%', trend: '-0.6%', trendDirection: 'down' },
 { id: 'k3', label: 'Workday Compliance', value: '96.4%', trend: '+1.9%', trendDirection: 'up' },
 { id: 'k4', label: 'Performance Avg', value: '4.3 / 5', trend: '+0.2', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Attendance Reviews', count: 28 },
 { stage: 'Manager Approvals', count: 17 },
 { stage: 'Escalation Cases', count: 9 },
 { stage: 'Closed Cases', count: 301 },
 ],
 aiInsights: [
 'Work-from-home trend increased by 6% week-over-week.',
 'Overtime cost variance is concentrated in Ops and Support units.',
 'Top 3 teams by output also show the highest attendance stability.',
 ],
 },
 'hr-manager': {
 heading: 'HR Manager Workforce Hub',
 summary: 'Run employee lifecycle, attendance governance, payroll audit checks, and performance cycles.',
 kpis: [
 { id: 'k1', label: 'Employees Managed', value: '2,110', trend: '+42', trendDirection: 'up' },
 { id: 'k2', label: 'Attendance Today', value: '95.3%', trend: '+1.1%', trendDirection: 'up' },
 { id: 'k3', label: 'Payroll Readiness', value: '86%', trend: 'In Progress', trendDirection: 'neutral' },
 { id: 'k4', label: 'Performance Reviews', value: '122', trend: '+18', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Onboarding', count: 38 },
 { stage: 'Attendance Exceptions', count: 24 },
 { stage: 'Review Cycles', count: 122 },
 { stage: 'Resolved', count: 428 },
 ],
 aiInsights: [
 'Biometric mismatch alerts dropped after device firmware update.',
 'Leave conversion to unpaid leave is elevated in one department.',
 'Performance review completion rate has reached 91%.',
 ],
 },
 'team-manager': {
 heading: 'Team Manager Delivery Dashboard',
 summary: 'Monitor task progress, work logs, team attendance, and weekly productivity outcomes.',
 kpis: [
 { id: 'k1', label: 'Team Members', value: '38', trend: '+2 new joiners', trendDirection: 'up' },
 { id: 'k2', label: 'Tasks Completed', value: '146', trend: '+11%', trendDirection: 'up' },
 { id: 'k3', label: 'Avg Work Hours', value: '8.4h', trend: '+0.3h', trendDirection: 'up' },
 { id: 'k4', label: 'Deadline Risk', value: '7 tasks', trend: '-3', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Assigned Tasks', count: 96 },
 { stage: 'In Progress', count: 44 },
 { stage: 'Blocked', count: 7 },
 { stage: 'Completed', count: 146 },
 ],
 aiInsights: [
 'Team velocity is 9% above previous sprint baseline.',
 'Two members require workload rebalance to avoid overtime risk.',
 'Morning check-in adherence correlates with on-time task closure.',
 ],
 },
 'team-leader': {
 heading: 'Team Leader Productivity Board',
 summary: 'Track day-to-day execution, attendance, and operational blockers for your squad.',
 kpis: [
 { id: 'k1', label: 'Squad Members', value: '12', trend: 'Stable', trendDirection: 'neutral' },
 { id: 'k2', label: 'Daily Check-ins', value: '11/12', trend: '+1 vs yesterday', trendDirection: 'up' },
 { id: 'k3', label: 'Active Tasks', value: '27', trend: '-4', trendDirection: 'up' },
 { id: 'k4', label: 'Escalations', value: '2', trend: '-1', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Backlog', count: 18 },
 { stage: 'In Progress', count: 27 },
 { stage: 'QA', count: 9 },
 { stage: 'Done', count: 54 },
 ],
 aiInsights: [
 'Most missed deadlines are linked to unplanned dependency tasks.',
 'Two employees show sustained high performance and mentoring potential.',
 'Location compliance score remains above 97% this week.',
 ],
 },
 'sales-manager': {
 heading: 'Sales Manager Performance Console',
 summary: 'Align pipeline, targets, commissions, and team productivity for revenue execution.',
 kpis: [
 { id: 'k1', label: 'Pipeline Value', value: '$2.9M', trend: '+13%', trendDirection: 'up' },
 { id: 'k2', label: 'Target Achievement', value: '88.7%', trend: '+4.1%', trendDirection: 'up' },
 { id: 'k3', label: 'Commission Ready', value: '17 reps', trend: '+3', trendDirection: 'up' },
 { id: 'k4', label: 'Win Rate', value: '41.8%', trend: '+2.4%', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'New Leads', count: 128 },
 { stage: 'Qualified Deals', count: 74 },
 { stage: 'Negotiation', count: 22 },
 { stage: 'Closed Won', count: 46 },
 ],
 aiInsights: [
 'Team South is at 96% quarterly target pace and ahead of projection.',
 'Three high-value deals are at risk due to delayed legal approvals.',
 'Commission payout variance reduced after payroll sync automation.',
 ],
 },
 recruiter: {
 heading: 'Recruiter Pipeline Dashboard',
 summary: 'Optimize job postings, candidate quality, and interview velocity with AI scoring.',
 kpis: [
 { id: 'k1', label: 'Open Jobs', value: '64', trend: '+7', trendDirection: 'up' },
 { id: 'k2', label: 'Candidates', value: '1,940', trend: '+18%', trendDirection: 'up' },
 { id: 'k3', label: 'Interview Conversion', value: '42.1%', trend: '+2.3%', trendDirection: 'up' },
 { id: 'k4', label: 'Offer Acceptance', value: '73%', trend: '-1.1%', trendDirection: 'down' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Screening', count: 384 },
 { stage: 'Interview', count: 176 },
 { stage: 'Offer', count: 74 },
 { stage: 'Hired', count: 39 },
 ],
 aiInsights: [
 'AI shortlist reduced screening time by 37%.',
 'Candidate drop-off increased after third interview round.',
 'Compensation mismatch is the main rejection reason this month.',
 ],
 },
 employee: {
 heading: 'Employee Office Portal',
 summary: 'Check attendance, assigned tasks, performance score, salary forecast, and service requests in one portal.',
 kpis: [
 { id: 'k1', label: 'Attendance Today', value: 'Present', trend: '9:07 AM check-in', trendDirection: 'up' },
 { id: 'k2', label: 'Tasks Due Today', value: '3', trend: '2 completed', trendDirection: 'up' },
 { id: 'k3', label: 'Performance Score', value: '4.4/5', trend: '+0.3', trendDirection: 'up' },
 { id: 'k4', label: 'Salary Forecast', value: '$4,920', trend: '+$280 bonus', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Assigned Tasks', count: 6 },
 { stage: 'In Review', count: 2 },
 { stage: 'Completed', count: 24 },
 { stage: 'Learning Goals', count: 5 },
 ],
 aiInsights: [
 'Your attendance consistency is in top 12% of your department.',
 'Complete 2 pending tasks before Friday to keep score above 4.5.',
 'Salary forecast includes target achievement bonus projection.',
 ],
 },
 guest: {
 heading: 'Guest Read-Only Workspace',
 summary: 'Limited visibility to approved dashboards, reports, and compliance highlights.',
 kpis: [
 { id: 'k1', label: 'Accessible Reports', value: '24', trend: 'View only', trendDirection: 'neutral' },
 { id: 'k2', label: 'Public Insights', value: '11', trend: '+2 new', trendDirection: 'up' },
 { id: 'k3', label: 'Restricted Modules', value: '12', trend: 'Locked', trendDirection: 'neutral' },
 { id: 'k4', label: 'Session Security', value: 'Protected', trend: 'MFA enforced', trendDirection: 'up' },
 ],
 attendanceTrend: monthlyTrend,
 performanceTrend: engagementTrend,
 pipeline: [
 { stage: 'Shared Dashboards', count: 8 },
 { stage: 'Open Reports', count: 11 },
 { stage: 'Pending Access Requests', count: 2 },
 { stage: 'Approved Access', count: 6 },
 ],
 aiInsights: [
 'Guest access is scoped to read-only policy-compliant datasets.',
 'Request elevated permissions through manager approval workflow.',
 'All guest sessions are logged in security audit trails.',
 ],
 },
};

export const employeeRecords: EmployeeRecord[] = [
 {
 id: 'EMP-1042',
 name: 'Ananya Rao',
 department: 'Engineering',
 designation: 'Senior Software Engineer',
 status: 'Active',
 location: 'Bengaluru',
 score: 91,
 },
 {
 id: 'EMP-1093',
 name: 'Raghav Menon',
 department: 'Finance',
 designation: 'Payroll Specialist',
 status: 'Active',
 location: 'Mumbai',
 score: 88,
 },
 {
 id: 'EMP-1180',
 name: 'Neha Kapoor',
 department: 'HR',
 designation: 'Talent Partner',
 status: 'On Leave',
 location: 'Delhi',
 score: 86,
 },
 {
 id: 'EMP-1206',
 name: 'Siddharth Iyer',
 department: 'Operations',
 designation: 'Process Manager',
 status: 'Probation',
 location: 'Hyderabad',
 score: 79,
 },
 {
 id: 'EMP-1215',
 name: 'Meera Joshi',
 department: 'Sales',
 designation: 'Enterprise AE',
 status: 'Active',
 location: 'Pune',
 score: 93,
 },
];

export const attendanceHeatMap = [
 { name: 'Mon', present: 2015, absent: 72, leave: 23 },
 { name: 'Tue', present: 2038, absent: 64, leave: 18 },
 { name: 'Wed', present: 2045, absent: 59, leave: 20 },
 { name: 'Thu', present: 2029, absent: 74, leave: 21 },
 { name: 'Fri', present: 2052, absent: 57, leave: 16 },
];

export const payrollSummary = [
 { name: 'Base Salary', value: 720000 },
 { name: 'Bonus', value: 124000 },
 { name: 'Allowances', value: 98000 },
 { name: 'Deductions', value: 91000 },
];

export const monthlyPayrollTrend = [
 { name: 'Jan', value: 690000 },
 { name: 'Feb', value: 703000 },
 { name: 'Mar', value: 711000 },
 { name: 'Apr', value: 724000 },
 { name: 'May', value: 733000 },
 { name: 'Jun', value: 745000 },
];

export const jobPostings: JobPosting[] = [
 { id: 'JOB-301', title: 'Senior Frontend Engineer', department: 'Engineering', openings: 4, status: 'Open' },
 { id: 'JOB-302', title: 'HR Operations Lead', department: 'HR', openings: 2, status: 'Interviewing' },
 { id: 'JOB-303', title: 'Payroll Analyst', department: 'Finance', openings: 1, status: 'Open' },
 { id: 'JOB-304', title: 'Talent Acquisition Specialist', department: 'Recruitment', openings: 3, status: 'Closed' },
];

export const candidateRecords: CandidateRecord[] = [
 { id: 'CAN-881', name: 'Kabir Shah', role: 'Senior Frontend Engineer', match: 94, stage: 'Interview' },
 { id: 'CAN-884', name: 'Priya Nair', role: 'Payroll Analyst', match: 91, stage: 'Offer' },
 { id: 'CAN-888', name: 'Aditi Jain', role: 'HR Operations Lead', match: 89, stage: 'Screening' },
 { id: 'CAN-893', name: 'Mohit Arora', role: 'TA Specialist', match: 86, stage: 'Hired' },
];

export const documentRecords: DocumentRecord[] = [
 {
 id: 'DOC-2001',
 name: 'Offer Letter - Priya Nair',
 category: 'Offer Letter',
 owner: 'Recruitment Team',
 updatedAt: '2026-03-03T08:42:00.000Z',
 status: 'Approved',
 },
 {
 id: 'DOC-2002',
 name: 'Experience Letter - Arjun Singh',
 category: 'Experience Letter',
 owner: 'HR Operations',
 updatedAt: '2026-03-02T11:15:00.000Z',
 status: 'Generated',
 },
 {
 id: 'DOC-2003',
 name: 'Salary Slip - February 2026',
 category: 'Salary Slip',
 owner: 'Payroll Team',
 updatedAt: '2026-03-01T18:05:00.000Z',
 status: 'Generated',
 },
 {
 id: 'DOC-2004',
 name: 'Employee Excellence Certificate',
 category: 'Certificate',
 owner: 'People Success',
 updatedAt: '2026-02-28T10:21:00.000Z',
 status: 'Pending Review',
 },
 {
 id: 'DOC-2005',
 name: 'Corporate ID Card - New Joiners',
 category: 'ID Card',
 owner: 'Admin Services',
 updatedAt: '2026-03-04T09:30:00.000Z',
 status: 'Approved',
 },
 {
 id: 'DOC-2006',
 name: 'Visiting Cards - Sales Team',
 category: 'Visiting Card',
 owner: 'Brand Operations',
 updatedAt: '2026-03-04T14:45:00.000Z',
 status: 'Generated',
 },
];

export const analyticsBreakdown = [
 { name: 'Employee Analytics', value: 35 },
 { name: 'Payroll Analytics', value: 22 },
 { name: 'Recruitment Analytics', value: 27 },
 { name: 'AI Predictions', value: 16 },
];

export const automationState = [
 { stage: 'Auto Workflows', count: 200 },
 { stage: 'Triggered Documents', count: 150 },
 { stage: 'System Alerts', count: 26 },
 { stage: 'AI Recommendations', count: 340 },
];

export const initialNotifications: NotificationItem[] = [
 {
 id: 'NTF-1',
 title: 'Salary update processed',
 message: 'March payroll batch for Engineering has been successfully processed.',
 type: 'salary',
 createdAt: '2026-03-05T08:25:00.000Z',
 read: false,
 },
 {
 id: 'NTF-2',
 title: 'Target achievement milestone',
 message: 'Sales North achieved 104% target and bonus projections are refreshed.',
 type: 'target',
 createdAt: '2026-03-05T07:55:00.000Z',
 read: false,
 },
 {
 id: 'NTF-3',
 title: 'Leave approval completed',
 message: '4 leave requests have been approved by HR Manager.',
 type: 'leave',
 createdAt: '2026-03-05T07:10:00.000Z',
 read: true,
 },
];

const randomTemplates = [
 {
 title: 'System alert raised',
 message: 'Workflow retry threshold exceeded in document automation.',
 type: 'system' as const,
 },
 {
 title: 'Salary update posted',
 message: 'Target-based bonus recalculation completed for Sales team.',
 type: 'salary' as const,
 },
 {
 title: 'Leave request approved',
 message: 'Manager approved a leave request from Engineering.',
 type: 'leave' as const,
 },
 {
 title: 'Target achievement pulse',
 message: 'Quarterly achievement crossed 90% for Customer Success.',
 type: 'target' as const,
 },
];

export const buildRandomNotification = (): NotificationItem => {
 const template = randomTemplates[Math.floor(Math.random() * randomTemplates.length)];
 return {
 id: `NTF-${Date.now()}`,
 title: template.title,
 message: template.message,
 type: template.type,
 createdAt: new Date().toISOString(),
 read: false,
 };
};


export const salesPipelineStages: SalesPipelineStageMeta[] = [
 { code: 'new-lead', label: 'New Lead' },
 { code: 'contacted', label: 'Contacted' },
 { code: 'qualified', label: 'Qualified' },
 { code: 'proposal-sent', label: 'Proposal Sent' },
 { code: 'negotiation', label: 'Negotiation' },
 { code: 'closed-won', label: 'Closed Won' },
 { code: 'closed-lost', label: 'Closed Lost' },
];

export const salesLeadRecords: SalesLeadRecord[] = [
 {
 id: 'LEAD-401',
 name: 'Aarav Mehta',
 company: 'Nexon Retail Group',
 source: 'Website Demo Form',
 email: 'aarav@nexonretail.com',
 assignedTo: 'Ananya Rao',
 score: 88,
 pipelineStage: 'qualified',
 status: 'nurturing',
 expectedValue: 190000,
 lastActivity: '2026-03-05T09:10:00.000Z',
 },
 {
 id: 'LEAD-402',
 name: 'Nisha Verma',
 company: 'Aster Logistics',
 source: 'Campaign Landing Page',
 email: 'nisha@asterlogistics.com',
 assignedTo: 'Meera Joshi',
 score: 81,
 pipelineStage: 'proposal-sent',
 status: 'nurturing',
 expectedValue: 240000,
 lastActivity: '2026-03-05T08:32:00.000Z',
 },
 {
 id: 'LEAD-403',
 name: 'Ritesh Tandon',
 company: 'Magnus Finserve',
 source: 'Marketplace Referral',
 email: 'ritesh@magnusfinserve.com',
 assignedTo: 'Siddharth Iyer',
 score: 73,
 pipelineStage: 'contacted',
 status: 'nurturing',
 expectedValue: 98000,
 lastActivity: '2026-03-04T16:25:00.000Z',
 },
 {
 id: 'LEAD-404',
 name: 'Priya Bansal',
 company: 'CloudWorks Asia',
 source: 'Website Demo Form',
 email: 'priya@cloudworks.asia',
 assignedTo: 'Meera Joshi',
 score: 94,
 pipelineStage: 'negotiation',
 status: 'nurturing',
 expectedValue: 320000,
 lastActivity: '2026-03-05T10:05:00.000Z',
 },
 {
 id: 'LEAD-405',
 name: 'Karan Malhotra',
 company: 'VistaMed Systems',
 source: 'Email Outreach',
 email: 'karan@vistamed.com',
 assignedTo: 'Ananya Rao',
 score: 66,
 pipelineStage: 'new-lead',
 status: 'open',
 expectedValue: 84000,
 lastActivity: '2026-03-05T07:15:00.000Z',
 },
 {
 id: 'LEAD-406',
 name: 'Devika Sinha',
 company: 'NorthGrid Energy',
 source: 'Partner Referral',
 email: 'devika@northgrid.com',
 assignedTo: 'Siddharth Iyer',
 score: 92,
 pipelineStage: 'closed-won',
 status: 'converted',
 expectedValue: 410000,
 lastActivity: '2026-03-03T14:40:00.000Z',
 },
 {
 id: 'LEAD-407',
 name: 'Rahul Nayar',
 company: 'Prime Habitat',
 source: 'Conference Booth',
 email: 'rahul@primehabitat.com',
 assignedTo: 'Neha Kapoor',
 score: 58,
 pipelineStage: 'closed-lost',
 status: 'lost',
 expectedValue: 67000,
 lastActivity: '2026-03-02T09:20:00.000Z',
 },
 {
 id: 'LEAD-408',
 name: 'Sonal Arora',
 company: 'Helios Digital Labs',
 source: 'Website Demo Form',
 email: 'sonal@helioslabs.com',
 assignedTo: 'Meera Joshi',
 score: 86,
 pipelineStage: 'qualified',
 status: 'nurturing',
 expectedValue: 175000,
 lastActivity: '2026-03-05T06:30:00.000Z',
 },
];

export const salesCustomerAccounts: SalesCustomerAccountRecord[] = [
 {
 id: 'ACC-201',
 accountName: 'CloudWorks Asia',
 industry: 'Technology',
 ownerName: 'Meera Joshi',
 accountStatus: 'active',
 contactCount: 4,
 annualRecurringValue: 520000,
 },
 {
 id: 'ACC-202',
 accountName: 'NorthGrid Energy',
 industry: 'Energy',
 ownerName: 'Siddharth Iyer',
 accountStatus: 'active',
 contactCount: 3,
 annualRecurringValue: 470000,
 },
 {
 id: 'ACC-203',
 accountName: 'Aster Logistics',
 industry: 'Logistics',
 ownerName: 'Ananya Rao',
 accountStatus: 'active',
 contactCount: 5,
 annualRecurringValue: 390000,
 },
 {
 id: 'ACC-204',
 accountName: 'Prime Habitat',
 industry: 'Real Estate',
 ownerName: 'Neha Kapoor',
 accountStatus: 'at-risk',
 contactCount: 2,
 annualRecurringValue: 125000,
 },
];

export const salesDealRecords: SalesDealRecord[] = [
 {
 id: 'DEAL-701',
 leadId: 'LEAD-401',
 dealName: 'Nexon HRMS Multi-Entity Rollout',
 salesRepresentative: 'Ananya Rao',
 value: 190000,
 stage: 'qualified',
 status: 'open',
 probability: 61,
 expectedCloseDate: '2026-04-10T00:00:00.000Z',
 },
 {
 id: 'DEAL-702',
 leadId: 'LEAD-402',
 dealName: 'Aster Logistics Payroll Automation',
 salesRepresentative: 'Meera Joshi',
 value: 240000,
 stage: 'proposal-sent',
 status: 'open',
 probability: 67,
 expectedCloseDate: '2026-04-24T00:00:00.000Z',
 },
 {
 id: 'DEAL-703',
 leadId: 'LEAD-404',
 dealName: 'CloudWorks Global Workforce Stack',
 salesRepresentative: 'Meera Joshi',
 value: 320000,
 stage: 'negotiation',
 status: 'open',
 probability: 78,
 expectedCloseDate: '2026-03-28T00:00:00.000Z',
 },
 {
 id: 'DEAL-704',
 leadId: 'LEAD-406',
 dealName: 'NorthGrid Enterprise ERP Suite',
 salesRepresentative: 'Siddharth Iyer',
 value: 410000,
 stage: 'closed-won',
 status: 'closed-won',
 probability: 100,
 expectedCloseDate: '2026-03-01T00:00:00.000Z',
 },
 {
 id: 'DEAL-705',
 leadId: 'LEAD-407',
 dealName: 'Prime Habitat HR Transformation',
 salesRepresentative: 'Neha Kapoor',
 value: 67000,
 stage: 'closed-lost',
 status: 'closed-lost',
 probability: 0,
 expectedCloseDate: '2026-02-26T00:00:00.000Z',
 },
 {
 id: 'DEAL-706',
 leadId: 'LEAD-408',
 dealName: 'Helios Digital AI Workforce Analytics',
 salesRepresentative: 'Meera Joshi',
 value: 175000,
 stage: 'qualified',
 status: 'open',
 probability: 56,
 expectedCloseDate: '2026-04-18T00:00:00.000Z',
 },
];

export const salesTargetRecords: SalesTargetRecord[] = [
 {
 id: 'TGT-301',
 ownerName: 'Sales Team North',
 periodLabel: 'Monthly - March 2026',
 targetValue: 780000,
 achievedValue: 632000,
 achievementPercent: 81,
 },
 {
 id: 'TGT-302',
 ownerName: 'Sales Team South',
 periodLabel: 'Monthly - March 2026',
 targetValue: 690000,
 achievedValue: 604000,
 achievementPercent: 87.5,
 },
 {
 id: 'TGT-303',
 ownerName: 'Meera Joshi',
 periodLabel: 'Quarterly - Q1 2026',
 targetValue: 540000,
 achievedValue: 476000,
 achievementPercent: 88.1,
 },
 {
 id: 'TGT-304',
 ownerName: 'Ananya Rao',
 periodLabel: 'Quarterly - Q1 2026',
 targetValue: 430000,
 achievedValue: 349000,
 achievementPercent: 81.2,
 },
 {
 id: 'TGT-305',
 ownerName: 'Enterprise Sales Org',
 periodLabel: 'Annual - FY 2026',
 targetValue: 6600000,
 achievedValue: 5340000,
 achievementPercent: 80.9,
 },
];

export const salesCommissionRecords: SalesCommissionRecord[] = [
 {
 id: 'COM-9101',
 employeeName: 'Meera Joshi',
 calculatedCommission: 26800,
 payoutStatus: 'approved',
 },
 {
 id: 'COM-9102',
 employeeName: 'Ananya Rao',
 calculatedCommission: 18200,
 payoutStatus: 'planned',
 },
 {
 id: 'COM-9103',
 employeeName: 'Siddharth Iyer',
 calculatedCommission: 31200,
 payoutStatus: 'paid',
 },
 {
 id: 'COM-9104',
 employeeName: 'Neha Kapoor',
 calculatedCommission: 7400,
 payoutStatus: 'planned',
 },
 {
 id: 'COM-9105',
 employeeName: 'Raghav Menon',
 calculatedCommission: 5600,
 payoutStatus: 'approved',
 },
];

export const salesRevenueTrend: TrendPoint[] = [
 { name: 'Jan', value: 410000 },
 { name: 'Feb', value: 468000 },
 { name: 'Mar', value: 523000 },
 { name: 'Apr', value: 584000 },
 { name: 'May', value: 629000 },
 { name: 'Jun', value: 690000 },
 { name: 'Jul', value: 744000 },
 { name: 'Aug', value: 812000 },
 { name: 'Sep', value: 854000 },
 { name: 'Oct', value: 903000 },
 { name: 'Nov', value: 965000 },
 { name: 'Dec', value: 1034000 },
];

export const salesTeamPerformance: SalesTeamPerformanceRecord[] = [
 {
 id: 'STP-1',
 employeeName: 'Meera Joshi',
 wonValue: 612000,
 winRate: 46,
 commissionEarned: 51200,
 },
 {
 id: 'STP-2',
 employeeName: 'Ananya Rao',
 wonValue: 488000,
 winRate: 42,
 commissionEarned: 38400,
 },
 {
 id: 'STP-3',
 employeeName: 'Siddharth Iyer',
 wonValue: 442000,
 winRate: 39,
 commissionEarned: 36500,
 },
 {
 id: 'STP-4',
 employeeName: 'Neha Kapoor',
 wonValue: 287000,
 winRate: 31,
 commissionEarned: 21400,
 },
 {
 id: 'STP-5',
 employeeName: 'Raghav Menon',
 wonValue: 198000,
 winRate: 28,
 commissionEarned: 14200,
 },
];

export const salesIntegrationPulse: SalesIntegrationPulse = {
 hrmsMappedAgents: 46,
 payrollBonusReady: 17,
 recruitmentReferrals: 34,
 analyticsModels: 22,
};


export const workActivityRecords = [
 {
 id: 'ACT-101',
 employeeName: 'Ananya Rao',
 loginAt: '09:05',
 logoutAt: '18:22',
 tasksCompleted: 9,
 productiveHours: 8.4,
 project: 'Workforce Command UI',
 },
 {
 id: 'ACT-102',
 employeeName: 'Meera Joshi',
 loginAt: '08:57',
 logoutAt: '18:08',
 tasksCompleted: 7,
 productiveHours: 7.9,
 project: 'Sales CRM Automation',
 },
 {
 id: 'ACT-103',
 employeeName: 'Raghav Menon',
 loginAt: '09:18',
 logoutAt: '17:54',
 tasksCompleted: 6,
 productiveHours: 7.2,
 project: 'Payroll Compliance Engine',
 },
 {
 id: 'ACT-104',
 employeeName: 'Neha Kapoor',
 loginAt: '09:12',
 logoutAt: '18:10',
 tasksCompleted: 8,
 productiveHours: 7.8,
 project: 'Talent Operations Sprint',
 },
 {
 id: 'ACT-105',
 employeeName: 'Siddharth Iyer',
 loginAt: '09:00',
 logoutAt: '19:02',
 tasksCompleted: 10,
 productiveHours: 8.9,
 project: 'Automation Reliability Program',
 },
];

export const workHourTrend: TrendPoint[] = [
 { name: 'Week 1', value: 39 },
 { name: 'Week 2', value: 41 },
 { name: 'Week 3', value: 43 },
 { name: 'Week 4', value: 42 },
 { name: 'Week 5', value: 44 },
 { name: 'Week 6', value: 45 },
];

export const workdaySummaryRecords = [
 { id: 'WD-1', employeeName: 'Ananya Rao', presentDays: 21, absentDays: 1, paidLeave: 1, unpaidLeave: 0, wfhDays: 6 },
 { id: 'WD-2', employeeName: 'Meera Joshi', presentDays: 20, absentDays: 0, paidLeave: 2, unpaidLeave: 0, wfhDays: 8 },
 { id: 'WD-3', employeeName: 'Raghav Menon', presentDays: 19, absentDays: 1, paidLeave: 1, unpaidLeave: 1, wfhDays: 4 },
 { id: 'WD-4', employeeName: 'Neha Kapoor', presentDays: 18, absentDays: 2, paidLeave: 2, unpaidLeave: 0, wfhDays: 7 },
];

export const taskRecords = [
 {
 id: 'TSK-701',
 taskName: 'Finalize payroll variance report',
 assignee: 'Raghav Menon',
 project: 'Payroll Governance',
 priority: 'High',
 status: 'In Progress',
 dueDate: '2026-03-08',
 },
 {
 id: 'TSK-702',
 taskName: 'Review geofence exception alerts',
 assignee: 'Siddharth Iyer',
 project: 'Location Monitoring',
 priority: 'Medium',
 status: 'Blocked',
 dueDate: '2026-03-09',
 },
 {
 id: 'TSK-703',
 taskName: 'Complete Q1 performance calibration',
 assignee: 'Neha Kapoor',
 project: 'Performance Cycle',
 priority: 'High',
 status: 'In Review',
 dueDate: '2026-03-10',
 },
 {
 id: 'TSK-704',
 taskName: 'Close proposal negotiation: CloudWorks',
 assignee: 'Meera Joshi',
 project: 'Sales Acceleration',
 priority: 'High',
 status: 'Completed',
 dueDate: '2026-03-06',
 },
 {
 id: 'TSK-705',
 taskName: 'Deploy manager permission template',
 assignee: 'Ananya Rao',
 project: 'RBAC Hardening',
 priority: 'Medium',
 status: 'In Progress',
 dueDate: '2026-03-11',
 },
];

export const projectRecords = [
 { id: 'PRJ-1', name: 'RBAC Hardening', completion: 76, owner: 'Ananya Rao' },
 { id: 'PRJ-2', name: 'Location Monitoring', completion: 68, owner: 'Siddharth Iyer' },
 { id: 'PRJ-3', name: 'Performance Cycle', completion: 82, owner: 'Neha Kapoor' },
 { id: 'PRJ-4', name: 'Sales Acceleration', completion: 88, owner: 'Meera Joshi' },
];

export const locationSnapshotRecords = [
 {
 id: 'LOC-401',
 employeeName: 'Ananya Rao',
 locationLabel: 'Bengaluru HQ',
 zoneType: 'office',
 status: 'inside-geofence',
 lastPingAt: '2026-03-05T13:11:00.000Z',
 },
 {
 id: 'LOC-402',
 employeeName: 'Meera Joshi',
 locationLabel: 'Pune - Client Site',
 zoneType: 'field',
 status: 'field-visit',
 lastPingAt: '2026-03-05T13:09:00.000Z',
 },
 {
 id: 'LOC-403',
 employeeName: 'Raghav Menon',
 locationLabel: 'Mumbai - Home Office',
 zoneType: 'wfh',
 status: 'wfh-active',
 lastPingAt: '2026-03-05T13:08:00.000Z',
 },
 {
 id: 'LOC-404',
 employeeName: 'Neha Kapoor',
 locationLabel: 'Delhi HQ',
 zoneType: 'office',
 status: 'inside-geofence',
 lastPingAt: '2026-03-05T13:07:00.000Z',
 },
 {
 id: 'LOC-405',
 employeeName: 'Siddharth Iyer',
 locationLabel: 'Hyderabad - Corridor C',
 zoneType: 'office',
 status: 'inside-geofence',
 lastPingAt: '2026-03-05T13:06:00.000Z',
 },
];

export const locationHistoryTrend = [
 { name: 'Office', value: 62 },
 { name: 'WFH', value: 24 },
 { name: 'Field', value: 14 },
];

export const performanceScoreRecords = [
 { id: 'PERF-1', employeeName: 'Meera Joshi', performanceScore: 94, targetAchievement: 112, tasksDelivered: 48, aiScore: 93 },
 { id: 'PERF-2', employeeName: 'Ananya Rao', performanceScore: 91, targetAchievement: 104, tasksDelivered: 42, aiScore: 90 },
 { id: 'PERF-3', employeeName: 'Siddharth Iyer', performanceScore: 88, targetAchievement: 98, tasksDelivered: 40, aiScore: 87 },
 { id: 'PERF-4', employeeName: 'Neha Kapoor', performanceScore: 86, targetAchievement: 95, tasksDelivered: 37, aiScore: 85 },
 { id: 'PERF-5', employeeName: 'Raghav Menon', performanceScore: 84, targetAchievement: 92, tasksDelivered: 35, aiScore: 83 },
];

export const teamLeaderboardRecords = [
 { id: 'LDB-1', teamName: 'Sales South', score: 92, completedTasks: 176, targetAchieved: 108 },
 { id: 'LDB-2', teamName: 'HR Operations', score: 89, completedTasks: 154, targetAchieved: 101 },
 { id: 'LDB-3', teamName: 'Engineering Core', score: 87, completedTasks: 162, targetAchieved: 98 },
 { id: 'LDB-4', teamName: 'Finance & Payroll', score: 84, completedTasks: 133, targetAchieved: 96 },
];

export const permissionRoleRecords = [
 {
 id: 'PRM-1',
 roleName: 'Platform Super Admin',
 canView: 'All modules',
 canEdit: 'All modules',
 canApprove: 'Global approvals',
 canAccessReports: 'Executive + Audit',
 },
 {
 id: 'PRM-2',
 roleName: 'Company Admin',
 canView: 'Company scope',
 canEdit: 'Company scope',
 canApprove: 'Company approvals',
 canAccessReports: 'Org + Compliance',
 },
 {
 id: 'PRM-3',
 roleName: 'HR Manager',
 canView: 'HR + Payroll + Docs',
 canEdit: 'HR operations',
 canApprove: 'Leave + HR requests',
 canAccessReports: 'HR analytics',
 },
 {
 id: 'PRM-4',
 roleName: 'Team Manager',
 canView: 'Team data',
 canEdit: 'Tasks + schedules',
 canApprove: 'Timesheets',
 canAccessReports: 'Team performance',
 },
 {
 id: 'PRM-5',
 roleName: 'Guest',
 canView: 'Approved read-only pages',
 canEdit: 'None',
 canApprove: 'None',
 canAccessReports: 'Limited shared',
 },
];

export const permissionAuditRecords = [
 {
 id: 'AUD-1',
 actor: 'Platform Super Admin',
 action: 'Granted Performance Dashboard access to Team Manager role',
 timestamp: '2026-03-05T09:30:00.000Z',
 },
 {
 id: 'AUD-2',
 actor: 'Company Admin',
 action: 'Revoked payroll edit access from Team Leader role',
 timestamp: '2026-03-05T08:50:00.000Z',
 },
 {
 id: 'AUD-3',
 actor: 'HR Manager',
 action: 'Enabled attendance approval permission for Sales Manager role',
 timestamp: '2026-03-05T08:12:00.000Z',
 },
];

export const crmLeadRecords = [
 {
 id: 'CRM-LEAD-1',
 leadName: 'Ishita Khanna',
 organization: 'Vertex Retail Group',
 stage: 'Qualified',
 ownerName: 'Meera Joshi',
 score: 91,
 lastTouch: '2026-03-05T11:20:00.000Z',
 },
 {
 id: 'CRM-LEAD-2',
 leadName: 'Arjun Sethi',
 organization: 'BlueOrbit Logistics',
 stage: 'Proposal Sent',
 ownerName: 'Ananya Rao',
 score: 86,
 lastTouch: '2026-03-05T10:42:00.000Z',
 },
 {
 id: 'CRM-LEAD-3',
 leadName: 'Nidhi Goel',
 organization: 'Astra Medtech',
 stage: 'Negotiation',
 ownerName: 'Siddharth Iyer',
 score: 94,
 lastTouch: '2026-03-04T18:02:00.000Z',
 },
 {
 id: 'CRM-LEAD-4',
 leadName: 'Kunal Batra',
 organization: 'North Arc Energy',
 stage: 'Contacted',
 ownerName: 'Neha Kapoor',
 score: 74,
 lastTouch: '2026-03-05T09:35:00.000Z',
 },
];

export const crmCustomerRecords = [
 {
 id: 'CRM-CUST-1',
 accountName: 'CloudWorks Asia',
 industry: 'Technology',
 ownerName: 'Meera Joshi',
 healthStatus: 'Healthy',
 annualValue: 520000,
 },
 {
 id: 'CRM-CUST-2',
 accountName: 'NorthGrid Energy',
 industry: 'Energy',
 ownerName: 'Siddharth Iyer',
 healthStatus: 'Healthy',
 annualValue: 470000,
 },
 {
 id: 'CRM-CUST-3',
 accountName: 'Prime Habitat',
 industry: 'Real Estate',
 ownerName: 'Neha Kapoor',
 healthStatus: 'At Risk',
 annualValue: 125000,
 },
];

export const crmInteractionRecords = [
 {
 id: 'CRM-INT-1',
 customerName: 'CloudWorks Asia',
 channel: 'Email',
 interactionType: 'Proposal Discussion',
 happenedAt: '2026-03-05T08:40:00.000Z',
 summary: 'Security and integration checklist reviewed.',
 },
 {
 id: 'CRM-INT-2',
 customerName: 'NorthGrid Energy',
 channel: 'Call',
 interactionType: 'Pricing Review',
 happenedAt: '2026-03-05T07:55:00.000Z',
 summary: 'Annual pricing revised with volume commitment.',
 },
 {
 id: 'CRM-INT-3',
 customerName: 'Prime Habitat',
 channel: 'Meeting',
 interactionType: 'Escalation',
 happenedAt: '2026-03-04T17:10:00.000Z',
 summary: 'Deployment delay mitigation plan shared.',
 },
];

export const marketingCampaignRecords = [
 {
 id: 'MKT-1',
 campaignName: 'Q1 HR Automation Launch',
 channel: 'Email',
 status: 'Running',
 audienceSize: 18000,
 reach: 15240,
 conversions: 412,
 spend: 5400,
 },
 {
 id: 'MKT-2',
 campaignName: 'Payroll Intelligence Webinar',
 channel: 'WhatsApp',
 status: 'Running',
 audienceSize: 9200,
 reach: 7600,
 conversions: 286,
 spend: 2200,
 },
 {
 id: 'MKT-3',
 campaignName: 'BOS v2000 Product Tour',
 channel: 'SMS',
 status: 'Scheduled',
 audienceSize: 12000,
 reach: 0,
 conversions: 0,
 spend: 1800,
 },
 {
 id: 'MKT-4',
 campaignName: 'Finance Automation Nurture',
 channel: 'Email',
 status: 'Completed',
 audienceSize: 10500,
 reach: 9680,
 conversions: 238,
 spend: 3100,
 },
];

export const marketingChannelPerformance = [
 { name: 'Email', value: 54 },
 { name: 'WhatsApp', value: 28 },
 { name: 'SMS', value: 18 },
];

export const financeInvoiceRecords = [
 {
 id: 'FIN-INV-1',
 invoiceNumber: 'INV-2026-1102',
 customerName: 'CloudWorks Asia',
 amount: 184000,
 status: 'Paid',
 dueDate: '2026-03-10',
 },
 {
 id: 'FIN-INV-2',
 invoiceNumber: 'INV-2026-1107',
 customerName: 'NorthGrid Energy',
 amount: 246000,
 status: 'Pending',
 dueDate: '2026-03-14',
 },
 {
 id: 'FIN-INV-3',
 invoiceNumber: 'INV-2026-1111',
 customerName: 'Aster Logistics',
 amount: 162000,
 status: 'Overdue',
 dueDate: '2026-03-02',
 },
];

export const financeExpenseRecords = [
 {
 id: 'FIN-EXP-1',
 category: 'Cloud Infrastructure',
 amount: 96000,
 ownerName: 'Finance Ops',
 status: 'Approved',
 expenseDate: '2026-03-03',
 },
 {
 id: 'FIN-EXP-2',
 category: 'Performance Marketing',
 amount: 42000,
 ownerName: 'Marketing Team',
 status: 'Approved',
 expenseDate: '2026-03-04',
 },
 {
 id: 'FIN-EXP-3',
 category: 'Recruitment Events',
 amount: 18000,
 ownerName: 'Talent Team',
 status: 'Submitted',
 expenseDate: '2026-03-05',
 },
];

export const financeSummary = {
 totalRevenue: 1294000,
 totalExpenses: 546000,
 receivables: 408000,
 gstPayable: 116000,
 operatingMarginPercent: 57.8,
};

export const helpdeskTicketRecords = [
 {
 id: 'HD-1',
 ticketNumber: 'TCK-2026-4101',
 requester: 'Ananya Rao',
 department: 'Engineering',
 category: 'Access Control',
 priority: 'High',
 status: 'Open',
 slaHours: 6,
 createdAt: '2026-03-05T09:20:00.000Z',
 },
 {
 id: 'HD-2',
 ticketNumber: 'TCK-2026-4102',
 requester: 'Raghav Menon',
 department: 'Finance',
 category: 'Payroll Query',
 priority: 'Medium',
 status: 'In Progress',
 slaHours: 12,
 createdAt: '2026-03-05T08:40:00.000Z',
 },
 {
 id: 'HD-3',
 ticketNumber: 'TCK-2026-4103',
 requester: 'Neha Kapoor',
 department: 'HR',
 category: 'Document Request',
 priority: 'Low',
 status: 'Resolved',
 slaHours: 24,
 createdAt: '2026-03-04T17:25:00.000Z',
 },
 {
 id: 'HD-4',
 ticketNumber: 'TCK-2026-4104',
 requester: 'Siddharth Iyer',
 department: 'Operations',
 category: 'System Alert',
 priority: 'Critical',
 status: 'Escalated',
 slaHours: 2,
 createdAt: '2026-03-05T10:10:00.000Z',
 },
];

export const helpdeskSlaRecords = [
 { name: 'Within SLA', value: 78 },
 { name: 'Near Breach', value: 14 },
 { name: 'Breached', value: 8 },
];

export const procurementVendorRecords = [
 {
 id: 'VND-1',
 vendorName: 'CloudStack Infra',
 category: 'Cloud Services',
 ownerName: 'Finance Ops',
 status: 'Active',
 rating: 4.6,
 },
 {
 id: 'VND-2',
 vendorName: 'TalentEdge Events',
 category: 'Recruitment',
 ownerName: 'HR Ops',
 status: 'Active',
 rating: 4.3,
 },
 {
 id: 'VND-3',
 vendorName: 'ReachBoost Media',
 category: 'Marketing',
 ownerName: 'Growth Team',
 status: 'Under Review',
 rating: 3.8,
 },
];

export const procurementOrderRecords = [
 {
 id: 'PO-1',
 poNumber: 'PO-2026-1901',
 vendorName: 'CloudStack Infra',
 amount: 126000,
 status: 'Approved',
 expectedDeliveryDate: '2026-03-21',
 },
 {
 id: 'PO-2',
 poNumber: 'PO-2026-1902',
 vendorName: 'TalentEdge Events',
 amount: 48000,
 status: 'Pending Approval',
 expectedDeliveryDate: '2026-03-18',
 },
 {
 id: 'PO-3',
 poNumber: 'PO-2026-1903',
 vendorName: 'ReachBoost Media',
 amount: 62000,
 status: 'Raised',
 expectedDeliveryDate: '2026-03-26',
 },
];

export const procurementSummary = {
 activeVendors: 2,
 openPurchaseOrders: 2,
 monthlySpend: 236000,
 savingsRealized: 18400,
};
