export type ApiRouteDefinition = {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  module: string;
  auth: 'public' | 'jwt' | 'jwt+rbac';
};

export const apiRoutes: ApiRouteDefinition[] = [
  { method: 'POST', path: '/api/v1/auth/login', module: 'Authentication Service', auth: 'public' },

  { method: 'GET', path: '/api/v1/companies', module: 'Company Management', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/companies/:id', module: 'Company Management', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/companies', module: 'Company Management', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/companies/:id', module: 'Company Management', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/employees', module: 'Employee Management', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/employees/:id', module: 'Employee Management', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/employees', module: 'Employee Management', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/employees/:id', module: 'Employee Management', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/attendance', module: 'Attendance System', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/attendance/:id', module: 'Attendance System', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/attendance', module: 'Attendance System', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/attendance/:id', module: 'Attendance System', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/payroll', module: 'Payroll Engine', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/payroll/:id', module: 'Payroll Engine', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/payroll', module: 'Payroll Engine', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/payroll/:id', module: 'Payroll Engine', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/payroll/calculate/target-based', module: 'Payroll Engine', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/payroll/calculate/days-wise', module: 'Payroll Engine', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/payroll/bonus/sla', module: 'Payroll Engine', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/recruitment/jobs', module: 'Recruitment ATS', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/recruitment/jobs', module: 'Recruitment ATS', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/recruitment/jobs/:id', module: 'Recruitment ATS', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/recruitment/applications', module: 'Recruitment ATS', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/recruitment/applications', module: 'Recruitment ATS', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/recruitment/applications/:id', module: 'Recruitment ATS', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/recruiter-marketplace/profiles', module: 'Recruiter Marketplace', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/recruiter-marketplace/profiles/:id', module: 'Recruiter Marketplace', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/recruiter-marketplace/profiles', module: 'Recruiter Marketplace', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/recruiter-marketplace/profiles/:id', module: 'Recruiter Marketplace', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/candidates', module: 'Candidate Profiles', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/candidates/:id', module: 'Candidate Profiles', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/candidates', module: 'Candidate Profiles', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/candidates/:id', module: 'Candidate Profiles', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/job-marketplace/jobs', module: 'Job Marketplace', auth: 'public' },
  { method: 'GET', path: '/api/v1/job-marketplace/jobs/:id', module: 'Job Marketplace', auth: 'public' },
  { method: 'POST', path: '/api/v1/job-marketplace/jobs', module: 'Job Marketplace', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/job-marketplace/jobs/:id', module: 'Job Marketplace', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/billing/subscriptions', module: 'Subscription & Billing', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/billing/subscriptions', module: 'Subscription & Billing', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/billing/subscriptions/:id', module: 'Subscription & Billing', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/billing/invoices', module: 'Subscription & Billing', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/billing/invoices', module: 'Subscription & Billing', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/billing/invoices/:id', module: 'Subscription & Billing', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/analytics/events', module: 'Analytics Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/analytics/events', module: 'Analytics Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/analytics/dashboard', module: 'Analytics Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/notifications', module: 'Notification Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/notifications/:id', module: 'Notification Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/notifications', module: 'Notification Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/notifications/:id', module: 'Notification Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/ai-engine/insights', module: 'AI Engine Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/ai-engine/insights/:id', module: 'AI Engine Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/ai-engine/insights', module: 'AI Engine Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/ai-engine/insights/:id', module: 'AI Engine Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/ai-engine/recommendations', module: 'AI Engine Service', auth: 'jwt+rbac' },


  { method: 'GET', path: '/api/v1/documents', module: 'Document Center Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/documents/:id', module: 'Document Center Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/documents/generate', module: 'Document Center Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/documents/certificates/generate', module: 'Document Center Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/documents/:id/status', module: 'Document Center Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/employee-services/tickets', module: 'Employee Services Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/employee-services/tickets/:id', module: 'Employee Services Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/employee-services/tickets', module: 'Employee Services Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/employee-services/tickets/:id', module: 'Employee Services Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/employee-services/tickets/:id/resolve', module: 'Employee Services Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/automation/workflows', module: 'Workflow Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/automation/workflows/:id', module: 'Workflow Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/automation/workflows', module: 'Workflow Automation Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/automation/workflows/:id', module: 'Workflow Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/automation/workflows/:id/trigger', module: 'Workflow Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/automation/alerts', module: 'Workflow Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/leads', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/leads/:id', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/leads/capture', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/leads/import', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/sales-automation/leads/:id', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/pipeline', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/sales-automation/pipeline/stage', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/customers/accounts', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/customers/accounts', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/sales-automation/customers/accounts/:id', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/customers/contacts', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/customers/contacts', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/sales-automation/customers/contacts/:id', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/deals', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/deals', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/sales-automation/deals/:id', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/targets', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/targets', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/sales-automation/targets/:id', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/commissions', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/commissions/calculate', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/sales-automation/commissions/:id/sync-payroll', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/analytics/summary', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/sales-automation/analytics/team-performance', module: 'Sales Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/crm/leads', module: 'CRM Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/crm/customers', module: 'CRM Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/crm/interactions', module: 'CRM Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/marketing/campaigns', module: 'Marketing Automation Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/marketing/performance', module: 'Marketing Automation Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/finance/invoices', module: 'Finance Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/finance/expenses', module: 'Finance Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/finance/summary', module: 'Finance Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/helpdesk/tickets', module: 'Helpdesk Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/helpdesk/sla-status', module: 'Helpdesk Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/procurement/vendors', module: 'Procurement Vendor Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/procurement/purchase-orders', module: 'Procurement Vendor Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/procurement/summary', module: 'Procurement Vendor Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/permission-control/roles', module: 'Permission Control Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/permission-control/audits', module: 'Permission Control Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/permission-control/roles/:id', module: 'Permission Control Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/work-tracking/activities', module: 'Work Tracking Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/work-tracking/workdays', module: 'Work Tracking Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/location-tracking/current', module: 'Location Tracking Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/location-tracking/history', module: 'Location Tracking Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/performance/scores', module: 'Performance Management Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/performance/leaderboard', module: 'Performance Management Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/tasks', module: 'Task Management Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/tasks/projects', module: 'Task Management Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/users', module: 'User Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/users/:id', module: 'User Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/users', module: 'User Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/users/:id', module: 'User Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/leave/types', module: 'Leave Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/leave/types', module: 'Leave Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/leave/requests', module: 'Leave Service', auth: 'jwt+rbac' },
  { method: 'GET', path: '/api/v1/leave/requests/:id', module: 'Leave Service', auth: 'jwt+rbac' },
  { method: 'POST', path: '/api/v1/leave/requests', module: 'Leave Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/leave/requests/:id/status', module: 'Leave Service', auth: 'jwt+rbac' },

  { method: 'GET', path: '/api/v1/marketplace/listings', module: 'Marketplace Service', auth: 'public' },
  { method: 'GET', path: '/api/v1/marketplace/listings/:id', module: 'Marketplace Service', auth: 'public' },
  { method: 'POST', path: '/api/v1/marketplace/listings', module: 'Marketplace Service', auth: 'jwt+rbac' },
  { method: 'PATCH', path: '/api/v1/marketplace/listings/:id', module: 'Marketplace Service', auth: 'jwt+rbac' },
];








