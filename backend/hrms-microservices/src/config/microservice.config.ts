export type MicroserviceDefinition = {
  name: string;
  port: number;
};

export const microserviceDefinitions: MicroserviceDefinition[] = [
  { name: 'auth-service', port: Number(process.env.AUTH_SERVICE_PORT ?? 4301) },
  { name: 'company-service', port: Number(process.env.COMPANY_SERVICE_PORT ?? 4302) },
  { name: 'user-service', port: Number(process.env.USER_SERVICE_PORT ?? 4314) },
  { name: 'employee-service', port: Number(process.env.EMPLOYEE_SERVICE_PORT ?? 4303) },
  { name: 'attendance-service', port: Number(process.env.ATTENDANCE_SERVICE_PORT ?? 4304) },
  { name: 'leave-service', port: Number(process.env.LEAVE_SERVICE_PORT ?? 4315) },
  { name: 'payroll-service', port: Number(process.env.PAYROLL_SERVICE_PORT ?? 4305) },
  { name: 'recruitment-ats-service', port: Number(process.env.RECRUITMENT_ATS_SERVICE_PORT ?? 4306) },
  { name: 'recruiter-marketplace-service', port: Number(process.env.RECRUITER_MARKETPLACE_SERVICE_PORT ?? 4307) },
  { name: 'candidate-service', port: Number(process.env.CANDIDATE_SERVICE_PORT ?? 4308) },
  { name: 'job-marketplace-service', port: Number(process.env.JOB_MARKETPLACE_SERVICE_PORT ?? 4309) },
  { name: 'marketplace-service', port: Number(process.env.MARKETPLACE_SERVICE_PORT ?? 4316) },
  { name: 'subscription-billing-service', port: Number(process.env.SUBSCRIPTION_BILLING_SERVICE_PORT ?? 4310) },
  { name: 'analytics-service', port: Number(process.env.ANALYTICS_SERVICE_PORT ?? 4311) },
  { name: 'notification-service', port: Number(process.env.NOTIFICATION_SERVICE_PORT ?? 4312) },
  { name: 'document-service', port: Number(process.env.DOCUMENT_SERVICE_PORT ?? 4317) },
  { name: 'employee-services-service', port: Number(process.env.EMPLOYEE_SERVICES_SERVICE_PORT ?? 4318) },
  { name: 'workflow-automation-service', port: Number(process.env.WORKFLOW_AUTOMATION_SERVICE_PORT ?? 4319) },
  { name: 'sales-automation-service', port: Number(process.env.SALES_AUTOMATION_SERVICE_PORT ?? 4320) },
  { name: 'ai-engine-service', port: Number(process.env.AI_ENGINE_SERVICE_PORT ?? 4313) },
];



