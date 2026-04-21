'use client';

import { apiRequest } from './http-client';

export type EmployeeApiRecord = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  status: string;
  createdAt: string;
};

export type AttendanceApiRecord = {
  id: string;
  employeeId: string;
  attendanceDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: string;
};

export type PayrollApiRecord = {
  id: string;
  employeeId: string;
  payrollMonth: string;
  grossPay: string;
  deductions: string;
  netPay: string;
  currency: string;
  status: string;
  generatedAt: string | null;
};

export type RecruitmentJobApiRecord = {
  id: string;
  requisitionCode: string;
  title: string;
  location: string;
  employmentType: string;
  status: string;
};

export type RecruitmentApplicationApiRecord = {
  id: string;
  jobId: string;
  candidateId: string;
  stage: string;
  score: string | null;
  status: string;
};

export type DocumentApiRecord = {
  id: string;
  documentType: string;
  documentName: string;
  templateVersion: string;
  status: string;
  fileUrl: string;
  documentPayload: Record<string, unknown>;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceTicketApiRecord = {
  id: string;
  serviceType: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
};

export type WorkflowApiRecord = {
  id: string;
  workflowCode: string;
  name: string;
  module: string;
  triggerType: string;
  status: string;
  successRate: string;
  runCount: number;
  workflowConfig: Record<string, unknown>;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertApiRecord = {
  code: string;
  severity: string;
  message: string;
};

export type WorkflowTriggerApiRecord = {
  workflowId: string;
  workflowCode: string;
  triggered: boolean;
  triggerReason: string;
  runCount: number;
  successRate: string;
  payload: Record<string, unknown>;
  triggeredAt: string;
  documents: DocumentApiRecord[];
  workflowSummary: Record<string, unknown>;
};

export type AnalyticsDashboardApiRecord = {
  totalEvents: number;
  recentModules: string[];
};

export type AnalyticsEventApiRecord = {
  id: string;
  module: string;
  eventType: string;
  createdAt: string;
};

export type SalesSummaryApiRecord = {
  leadCount: number;
  customerCount: number;
  dealCount: number;
  totalDealValue: number;
  wonDealValue: number;
  closedWonCount: number;
  closedLostCount: number;
  targetAchievementPercent: number;
  totalCommission: number;
  pipelineCounts: Array<{ stage: string; count: number }>;
};

export type SalesTeamApiRecord = {
  employeeId: string;
  dealValue: number;
  closedWon: number;
  totalDeals: number;
  targetValue: number;
  achievedValue: number;
  winRate: number;
  targetAchievementPercent: number;
};

export type SalesLeadApiRecord = {
  id: string;
  firstName: string;
  lastName: string | null;
  organization: string | null;
  source: string;
  email: string;
  assignedTo: string | null;
  score: string;
  pipelineStage: string;
  status: string;
  createdAt: string;
};

export type SalesDealApiRecord = {
  id: string;
  leadId: string | null;
  dealName: string;
  dealValue: string;
  stage: string;
  status: string;
  probability: string;
  expectedCloseDate: string | null;
  salesRepresentativeId: string | null;
};

export type SalesTargetApiRecord = {
  id: string;
  employeeId: string | null;
  targetPeriod: string;
  periodKey: string;
  targetValue: string;
  achievedValue: string;
  status: string;
};

export type SalesCommissionApiRecord = {
  id: string;
  employeeId: string;
  calculatedCommission: string;
  payoutStatus: string;
  bonusTier: string | null;
};

export type NotificationApiRecord = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  status: string;
};

export type MarketplaceJobApiRecord = {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  status: string;
  description: string;
  salaryMin: string | null;
  salaryMax: string | null;
};

export type WorkActivityApiRecord = {
  id: string;
  employeeName: string;
  loginAt: string;
  logoutAt: string;
  tasksCompleted: number;
  productiveHours: number;
  project: string;
};

export type WorkdaySummaryApiRecord = {
  id: string;
  employeeName: string;
  presentDays: number;
  absentDays: number;
  paidLeave: number;
  unpaidLeave: number;
  wfhDays: number;
};

export type LocationSnapshotApiRecord = {
  id: string;
  employeeName: string;
  locationLabel: string;
  zoneType: string;
  status: string;
  lastPingAt: string;
};

export type LocationHistoryApiRecord = {
  name: string;
  value: number;
};

export type PerformanceScoreApiRecord = {
  id: string;
  employeeName: string;
  performanceScore: number;
  targetAchievement: number;
  tasksDelivered: number;
  aiScore: number;
};

export type TeamLeaderboardApiRecord = {
  id: string;
  teamName: string;
  score: number;
  completedTasks: number;
  targetAchieved: number;
};

export type TaskApiRecord = {
  id: string;
  taskName: string;
  assignee: string;
  project: string;
  priority: string;
  status: string;
  dueDate: string;
};

export type ProjectApiRecord = {
  id: string;
  name: string;
  completion: number;
  owner: string;
};

export type PermissionRoleApiRecord = {
  id: string;
  roleName: string;
  canView: string;
  canEdit: string;
  canApprove: string;
  canAccessReports: string;
};

export type PermissionAuditApiRecord = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
};

export type CrmLeadApiRecord = {
  id: string;
  leadName: string;
  organization: string;
  stage: string;
  ownerName: string;
  score: number;
  lastTouch: string;
};

export type CrmCustomerApiRecord = {
  id: string;
  accountName: string;
  industry: string;
  ownerName: string;
  healthStatus: string;
  annualValue: number;
};

export type CrmInteractionApiRecord = {
  id: string;
  customerName: string;
  channel: string;
  interactionType: string;
  happenedAt: string;
  summary: string;
};

export type MarketingCampaignApiRecord = {
  id: string;
  campaignName: string;
  channel: string;
  status: string;
  audienceSize: number;
  reach: number;
  conversions: number;
  spend: number;
};

export type MarketingPerformanceApiRecord = {
  name: string;
  value: number;
};

export type FinanceInvoiceApiRecord = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  dueDate: string;
};

export type FinanceExpenseApiRecord = {
  id: string;
  category: string;
  amount: number;
  ownerName: string;
  status: string;
  expenseDate: string;
};

export type FinanceSummaryApiRecord = {
  totalRevenue: number;
  totalExpenses: number;
  receivables: number;
  gstPayable: number;
  operatingMarginPercent: number;
};

export type BillingSubscriptionApiRecord = {
  id: string;
  tenantId: string | null;
  companyId: string;
  planName: string;
  billingCycle: string;
  price: string;
  features: Record<string, unknown>;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type BillingInvoiceApiRecord = {
  id: string;
  tenantId: string | null;
  subscriptionId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
export type HelpdeskTicketApiRecord = {
  id: string;
  ticketNumber: string;
  requester: string;
  department: string;
  category: string;
  priority: string;
  status: string;
  slaHours: number;
  createdAt: string;
};

export type HelpdeskSlaApiRecord = {
  name: string;
  value: number;
};

export type ProcurementVendorApiRecord = {
  id: string;
  vendorName: string;
  category: string;
  ownerName: string;
  status: string;
  rating: number;
};

export type ProcurementOrderApiRecord = {
  id: string;
  poNumber: string;
  vendorName: string;
  amount: number;
  status: string;
  expectedDeliveryDate: string;
};

export type ProcurementSummaryApiRecord = {
  activeVendors: number;
  openPurchaseOrders: number;
  monthlySpend: number;
  savingsRealized: number;
};

export type SmartPlatformModuleApiRecord = {
  id: string;
  name: string;
  scope: 'full' | 'lite' | 'basic' | 'core';
  status: 'ready' | 'operational' | 'guarded';
  completionPercent: number;
  summary: string;
  functionalWorkflows: string[];
  intentionallyDeferred: string[];
};

export type SmartPlatformReadinessApiRecord = {
  product: string;
  releaseTrack: string;
  readinessLabel: string;
  paidUserReady: boolean;
  stabilityFocus: string[];
  modules: SmartPlatformModuleApiRecord[];
  launchChecklist: Array<{ item: string; done: boolean }>;
};

export const platformApi = {
  getSmartPlatformReadiness: () => apiRequest<SmartPlatformReadinessApiRecord>('/platform/readiness', { auth: false }),

  login: (payload: { email: string; password: string; requestedRole?: string }) =>
    apiRequest<{ accessToken: string; user: { id: string; email: string; fullName: string; tenantId: string | null; role: string } }>(
      '/auth/login',
      { method: 'POST', auth: false, body: payload },
    ),

  getEmployees: () => apiRequest<EmployeeApiRecord[]>('/employees'),
  getAttendance: () => apiRequest<AttendanceApiRecord[]>('/attendance'),
  getPayroll: () => apiRequest<PayrollApiRecord[]>('/payroll'),

  getRecruitmentJobs: () => apiRequest<RecruitmentJobApiRecord[]>('/recruitment/jobs'),
  getRecruitmentApplications: () => apiRequest<RecruitmentApplicationApiRecord[]>('/recruitment/applications'),

  getCrmLeads: () => apiRequest<CrmLeadApiRecord[]>('/crm/leads'),
  createCrmLead: (payload: { leadName: string; organization?: string; stage?: string; ownerName?: string; score?: number }) =>
    apiRequest<CrmLeadApiRecord>('/crm/leads', { method: 'POST', body: payload }),
  updateCrmLeadStage: (id: string, stage: string) =>
    apiRequest<CrmLeadApiRecord>(`/crm/leads/${id}/stage`, { method: 'PATCH', body: { stage } }),
  getCrmCustomers: () => apiRequest<CrmCustomerApiRecord[]>('/crm/customers'),
  getCrmInteractions: () => apiRequest<CrmInteractionApiRecord[]>('/crm/interactions'),

  getSalesSummary: () => apiRequest<SalesSummaryApiRecord>('/sales-automation/analytics/summary'),
  getSalesTeamPerformance: () => apiRequest<SalesTeamApiRecord[]>('/sales-automation/analytics/team-performance'),
  getSalesLeads: () => apiRequest<SalesLeadApiRecord[]>('/sales-automation/leads'),
  getSalesDeals: () => apiRequest<SalesDealApiRecord[]>('/sales-automation/deals'),
  getSalesTargets: () => apiRequest<SalesTargetApiRecord[]>('/sales-automation/targets'),
  getSalesCommissions: () => apiRequest<SalesCommissionApiRecord[]>('/sales-automation/commissions'),

  getMarketingCampaigns: () => apiRequest<MarketingCampaignApiRecord[]>('/marketing/campaigns'),
  getMarketingPerformance: () => apiRequest<MarketingPerformanceApiRecord[]>('/marketing/performance'),

  getFinanceInvoices: () => apiRequest<FinanceInvoiceApiRecord[]>('/finance/invoices'),
  createFinanceInvoice: (payload: { invoiceNumber?: string; customerName: string; amount: number; status?: string; dueDate?: string }) =>
    apiRequest<FinanceInvoiceApiRecord>('/finance/invoices', { method: 'POST', body: payload }),
  updateFinanceInvoiceStatus: (id: string, status: string) =>
    apiRequest<FinanceInvoiceApiRecord>(`/finance/invoices/${id}/status`, { method: 'PATCH', body: { status } }),
  getFinanceExpenses: () => apiRequest<FinanceExpenseApiRecord[]>('/finance/expenses'),
  createFinanceExpense: (payload: { category: string; amount: number; ownerName?: string; status?: string; expenseDate?: string }) =>
    apiRequest<FinanceExpenseApiRecord>('/finance/expenses', { method: 'POST', body: payload }),
  getFinanceSummary: () => apiRequest<FinanceSummaryApiRecord>('/finance/summary'),

  getBillingSubscriptions: () => apiRequest<BillingSubscriptionApiRecord[]>('/billing/subscriptions'),
  createBillingSubscription: (payload: {
    companyId?: string;
    planName?: string;
    billingCycle?: string;
    price?: number | string;
    features?: Record<string, unknown>;
    startDate?: string;
    endDate?: string | null;
    status?: string;
  }) => apiRequest<BillingSubscriptionApiRecord>('/billing/subscriptions', { method: 'POST', body: payload }),
  updateBillingSubscription: (id: string, payload: Partial<Omit<BillingSubscriptionApiRecord, 'id' | 'createdAt' | 'updatedAt'>>) =>
    apiRequest<BillingSubscriptionApiRecord>(`/billing/subscriptions/${id}`, { method: 'PATCH', body: payload }),
  getBillingInvoices: () => apiRequest<BillingInvoiceApiRecord[]>('/billing/invoices'),
  createBillingInvoice: (payload: {
    subscriptionId?: string;
    invoiceNumber?: string;
    amount?: number | string;
    currency?: string;
    dueDate?: string;
    status?: string;
  }) => apiRequest<BillingInvoiceApiRecord>('/billing/invoices', { method: 'POST', body: payload }),
  updateBillingInvoice: (id: string, payload: Partial<Omit<BillingInvoiceApiRecord, 'id' | 'createdAt' | 'updatedAt'>>) =>
    apiRequest<BillingInvoiceApiRecord>(`/billing/invoices/${id}`, { method: 'PATCH', body: payload }),

  getHelpdeskTickets: () => apiRequest<HelpdeskTicketApiRecord[]>('/helpdesk/tickets'),
  getHelpdeskSlaStatus: () => apiRequest<HelpdeskSlaApiRecord[]>('/helpdesk/sla-status'),

  getProcurementVendors: () => apiRequest<ProcurementVendorApiRecord[]>('/procurement/vendors'),
  getProcurementOrders: () => apiRequest<ProcurementOrderApiRecord[]>('/procurement/purchase-orders'),
  getProcurementSummary: () => apiRequest<ProcurementSummaryApiRecord>('/procurement/summary'),

  getDocuments: () => apiRequest<DocumentApiRecord[]>('/documents'),
  generateCertificate: (payload: {
    documentName: string;
    templateVersion?: string;
    payload?: Record<string, unknown>;
  }) =>
    apiRequest<DocumentApiRecord>('/documents/certificates/generate', {
      method: 'POST',
      body: {
        documentType: 'certificate',
        documentName: payload.documentName,
        templateVersion: payload.templateVersion,
        payload: payload.payload,
      },
    }),
  getServiceTickets: () => apiRequest<ServiceTicketApiRecord[]>('/employee-services/tickets'),

  getWorkflows: () => apiRequest<WorkflowApiRecord[]>('/automation/workflows'),
  triggerWorkflow: (id: string, payload: { triggerReason?: string; payload?: Record<string, unknown> }) =>
    apiRequest<WorkflowTriggerApiRecord>(`/automation/workflows/${id}/trigger`, { method: 'POST', body: payload }),
  getAutomationAlerts: () => apiRequest<AlertApiRecord[]>('/automation/alerts'),

  getAnalyticsDashboard: () => apiRequest<AnalyticsDashboardApiRecord>('/analytics/dashboard'),
  getAnalyticsEvents: () => apiRequest<AnalyticsEventApiRecord[]>('/analytics/events'),

  getWorkActivities: () => apiRequest<WorkActivityApiRecord[]>('/work-tracking/activities'),
  getWorkdaySummary: () => apiRequest<WorkdaySummaryApiRecord[]>('/work-tracking/workdays'),

  getLocationSnapshot: () => apiRequest<LocationSnapshotApiRecord[]>('/location-tracking/current'),
  getLocationHistory: () => apiRequest<LocationHistoryApiRecord[]>('/location-tracking/history'),

  getPerformanceScores: () => apiRequest<PerformanceScoreApiRecord[]>('/performance/scores'),
  getTeamLeaderboard: () => apiRequest<TeamLeaderboardApiRecord[]>('/performance/leaderboard'),

  getTasks: () => apiRequest<TaskApiRecord[]>('/tasks'),
  getProjects: () => apiRequest<ProjectApiRecord[]>('/tasks/projects'),

  getPermissionRoles: () => apiRequest<PermissionRoleApiRecord[]>('/permission-control/roles'),
  getPermissionAudits: () => apiRequest<PermissionAuditApiRecord[]>('/permission-control/audits'),

  getNotifications: () => apiRequest<NotificationApiRecord[]>('/notifications'),

  getMarketplaceJobs: () => apiRequest<MarketplaceJobApiRecord[]>('/job-marketplace/jobs', { auth: false }),
};



