export type ServiceEndpointCapacity = {
  service: string;
  plannedEndpoints: number;
};

export const endpointCapacityPlan: ServiceEndpointCapacity[] = [
  { service: 'auth-service', plannedEndpoints: 24 },
  { service: 'user-service', plannedEndpoints: 32 },
  { service: 'company-service', plannedEndpoints: 28 },
  { service: 'employee-service', plannedEndpoints: 54 },
  { service: 'attendance-service', plannedEndpoints: 42 },
  { service: 'leave-service', plannedEndpoints: 28 },
  { service: 'payroll-service', plannedEndpoints: 46 },
  { service: 'recruitment-service', plannedEndpoints: 58 },
  { service: 'candidate-service', plannedEndpoints: 34 },
  { service: 'recruiter-marketplace-service', plannedEndpoints: 30 },
  { service: 'analytics-service', plannedEndpoints: 44 },
  { service: 'notification-service', plannedEndpoints: 26 },
  { service: 'billing-service', plannedEndpoints: 30 },
  { service: 'ai-engine-service', plannedEndpoints: 36 },
  { service: 'document-center-service', plannedEndpoints: 24 },
  { service: 'employee-services-service', plannedEndpoints: 20 },
  { service: 'workflow-automation-service', plannedEndpoints: 22 },
  { service: 'permission-control-service', plannedEndpoints: 18 },
  { service: 'work-tracking-service', plannedEndpoints: 20 },
  { service: 'location-tracking-service', plannedEndpoints: 18 },
  { service: 'performance-management-service', plannedEndpoints: 20 },
  { service: 'task-management-service', plannedEndpoints: 22 },
];

export const getTotalPlannedEndpoints = () =>
  endpointCapacityPlan.reduce((total, item) => total + item.plannedEndpoints, 0);
