export type PlatformRole =
  | 'platform-admin'
  | 'company-admin'
  | 'hr-manager'
  | 'team-manager'
  | 'team-leader'
  | 'sales-manager'
  | 'recruiter'
  | 'employee'
  | 'guest';

export type ThemeMode = 'light' | 'dark';

export type PlatformNavItem = {
  label: string;
  href: string;
};

export type NotificationType = 'salary' | 'target' | 'leave' | 'system';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
};

export type KpiWidget = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
};

export type TrendPoint = {
  name: string;
  value: number;
};

export type PipelineStage = {
  stage: string;
  count: number;
};

export type RoleDashboardModel = {
  heading: string;
  summary: string;
  kpis: KpiWidget[];
  attendanceTrend: TrendPoint[];
  performanceTrend: TrendPoint[];
  pipeline: PipelineStage[];
  aiInsights: string[];
};

export type EmployeeRecord = {
  id: string;
  name: string;
  department: string;
  designation: string;
  status: 'Active' | 'On Leave' | 'Probation';
  location: string;
  score: number;
};

export type DocumentRecord = {
  id: string;
  name: string;
  category: 'Offer Letter' | 'Experience Letter' | 'Salary Slip' | 'Certificate' | 'ID Card' | 'Visiting Card';
  owner: string;
  updatedAt: string;
  status: 'Generated' | 'Pending Review' | 'Approved';
};

export type JobPosting = {
  id: string;
  title: string;
  department: string;
  openings: number;
  status: 'Open' | 'Interviewing' | 'Closed';
};

export type CandidateRecord = {
  id: string;
  name: string;
  role: string;
  match: number;
  stage: 'Screening' | 'Interview' | 'Offer' | 'Hired';
};

export type SalesPipelineStageCode =
  | 'new-lead'
  | 'contacted'
  | 'qualified'
  | 'proposal-sent'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost';

export type SalesLeadStatus = 'open' | 'nurturing' | 'converted' | 'lost';

export type SalesPipelineStageMeta = {
  code: SalesPipelineStageCode;
  label: string;
};

export type SalesLeadRecord = {
  id: string;
  name: string;
  company: string;
  source: string;
  email: string;
  assignedTo: string;
  score: number;
  pipelineStage: SalesPipelineStageCode;
  status: SalesLeadStatus;
  expectedValue: number;
  lastActivity: string;
};

export type SalesCustomerAccountRecord = {
  id: string;
  accountName: string;
  industry: string;
  ownerName: string;
  accountStatus: 'active' | 'at-risk';
  contactCount: number;
  annualRecurringValue: number;
};

export type SalesDealStatus = 'open' | 'closed-won' | 'closed-lost';

export type SalesDealRecord = {
  id: string;
  leadId: string;
  dealName: string;
  salesRepresentative: string;
  value: number;
  stage: SalesPipelineStageCode;
  status: SalesDealStatus;
  probability: number;
  expectedCloseDate: string;
};

export type SalesTargetRecord = {
  id: string;
  ownerName: string;
  periodLabel: string;
  targetValue: number;
  achievedValue: number;
  achievementPercent: number;
};

export type SalesCommissionPayoutStatus = 'planned' | 'approved' | 'paid';

export type SalesCommissionRecord = {
  id: string;
  employeeName: string;
  calculatedCommission: number;
  payoutStatus: SalesCommissionPayoutStatus;
};

export type SalesTeamPerformanceRecord = {
  id: string;
  employeeName: string;
  wonValue: number;
  winRate: number;
  commissionEarned: number;
};

export type SalesIntegrationPulse = {
  hrmsMappedAgents: number;
  payrollBonusReady: number;
  recruitmentReferrals: number;
  analyticsModels: number;
};

