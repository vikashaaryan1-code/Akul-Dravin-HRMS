'use client';
/**
 * Domain hooks — thin wrappers around useApiResource for common platform entities.
 * All hooks gracefully degrade to empty arrays when the backend is offline.
 */
import { useApiResource } from './useApiResource';
import { platformApi, EmployeeApiRecord } from '@/services/api/platform-api';

export function useEmployees() {
  const { data, loading, error, refresh, isLive } = useApiResource<EmployeeApiRecord[]>({
    loader: async () => {
      const records = await platformApi.getEmployees();
      return records.map(e => ({ ...e, name: `${e.firstName} ${e.lastName}`.trim() || e.email }));
    },
    fallback: [],
    label: 'Employees',
    errorToast: false,
  });
  return { employees: data, loading, error, refresh, isLive };
}


export function useLeaveRequests() {
  const { data, loading, error, refresh } = useApiResource({
    loader: platformApi.getLeaveRequests,
    fallback: [],
    label: 'Leave',
    errorToast: false,
  });
  return { leaveRequests: data, loading, error, refresh };
}

export function useLeaveTypes() {
  const { data, loading } = useApiResource({
    loader: platformApi.getLeaveTypes,
    fallback: [],
    label: 'Leave Types',
    errorToast: false,
  });
  return { leaveTypes: data, loading };
}

export function useRecruitmentJobs() {
  const { data, loading, error, refresh } = useApiResource({
    loader: platformApi.getRecruitmentJobs,
    fallback: [],
    label: 'Jobs',
    errorToast: false,
  });
  return { jobs: data, loading, error, refresh };
}

export function useRecruitmentApplications() {
  const { data, loading, error, refresh } = useApiResource({
    loader: platformApi.getRecruitmentApplications,
    fallback: [],
    label: 'Applications',
    errorToast: false,
  });
  return { applications: data, loading, error, refresh };
}

export function useMarketplaceJobs() {
  const { data, loading, error, refresh } = useApiResource({
    loader: platformApi.getMarketplaceJobs,
    fallback: [],
    label: 'Job Board',
    errorToast: false,
  });
  return { jobs: data, loading, error, refresh };
}

export function useNotifications() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getNotifications,
    fallback: [],
    label: 'Notifications',
    errorToast: false,
  });
  return { notifications: data, loading, refresh };
}

export function useBillingSubscriptions() {
  const { data, loading, error, refresh } = useApiResource({
    loader: platformApi.getBillingSubscriptions,
    fallback: [],
    label: 'Subscriptions',
    errorToast: false,
  });
  return { subscriptions: data, loading, error, refresh };
}

export function useBillingInvoices() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getBillingInvoices,
    fallback: [],
    label: 'Invoices',
    errorToast: false,
  });
  return { invoices: data, loading, refresh };
}

export function useFinanceInvoices() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getFinanceInvoices,
    fallback: [],
    label: 'Finance Invoices',
    errorToast: false,
  });
  return { invoices: data, loading, refresh };
}

export function useFinanceExpenses() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getFinanceExpenses,
    fallback: [],
    label: 'Expenses',
    errorToast: false,
  });
  return { expenses: data, loading, refresh };
}

export function useHelpdeskTickets() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getHelpdeskTickets,
    fallback: [],
    label: 'Helpdesk',
    errorToast: false,
  });
  return { tickets: data, loading, refresh };
}

export function useSalesSummary() {
  const { data, loading } = useApiResource({
    loader: platformApi.getSalesSummary,
    fallback: { leadCount: 0, customerCount: 0, dealCount: 0, totalDealValue: 0, wonDealValue: 0, closedWonCount: 0, closedLostCount: 0, targetAchievementPercent: 0, totalCommission: 0, pipelineCounts: [] },
    label: 'Sales Summary',
    errorToast: false,
  });
  return { summary: data, loading };
}

export function useSalesCommissions() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getSalesCommissions,
    fallback: [],
    label: 'Commissions',
    errorToast: false,
  });
  return { commissions: data, loading, refresh };
}

export function useRecruiterProfiles() {
  const { data, loading, refresh } = useApiResource({
    loader: () => fetch('/api/placeholder').then(() => [] as never[]),
    fallback: [] as never[],
    label: 'Recruiters',
    errorToast: false,
  });
  return { profiles: data, loading, refresh };
}

export function useTasks() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getTasks,
    fallback: [],
    label: 'Tasks',
    errorToast: false,
  });
  return { tasks: data, loading, refresh };
}

export function usePerformanceScores() {
  const { data, loading, refresh } = useApiResource({
    loader: platformApi.getPerformanceScores,
    fallback: [],
    label: 'Performance',
    errorToast: false,
  });
  return { scores: data, loading, refresh };
}
