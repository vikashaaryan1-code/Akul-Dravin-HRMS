/**
 * src/hooks/api/usePayroll.ts
 * React Query hooks for the Payroll Control Tower.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/keys';
import type { ApiError } from '@/lib/query/client';

// ── DTOs ─────────────────────────────────────────────────────────────────────
export type PayrollCycleStatus = 'draft' | 'review' | 'processing' | 'disbursed' | 'locked';

export type PayrollCycleDto = {
  id:          string;
  month:       string;       // e.g. "April 2026"
  grossAmount: number;       // in rupees
  netAmount:   number;
  tdsAmount:   number;
  status:      PayrollCycleStatus;
  employeeCount: number;
  disputeCount:  number;
  lockedAt?:   string;       // ISO timestamp
};

export type PayrollKpiDto = {
  grossPayroll:     number;
  netDisbursed:     number;
  pendingApprovals: number;
  tdsDeducted:      number;
  grossTrend:       number;
  netTrend:         number;
  pendingTrend:     number;
  tdsTrend:         number;
};

export type PayrollTrendPoint = {
  month: string;
  gross: number;
  net:   number;
  tax:   number;
};

export type PayrollVarianceDto = {
  dept:      string;
  variance:  number;         // positive = over, negative = under (in rupees)
  reason:    string;
  severity:  'info' | 'warning' | 'error';
};

export type PayslipRow = {
  id:       string;
  name:     string;
  dept:     string;
  amount:   number;
  month:    string;
  status:   'disbursed' | 'processing' | 'pending' | 'flagged';
};

export type PayslipListParams = {
  cycleId:  string;
  page?:    number;
  limit?:   number;
  search?:  string;
  status?:  PayslipRow['status'];
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function usePayrollKpis(): UseQueryResult<PayrollKpiDto, ApiError> {
  return useQuery<PayrollKpiDto, ApiError>({
    queryKey: [...queryKeys.payroll.all(), 'kpis'],
    queryFn: ({ signal }) => apiFetch<PayrollKpiDto>('/api/payroll/kpis', { signal }),
  });
}

export function useCurrentCycle(): UseQueryResult<PayrollCycleDto, ApiError> {
  return useQuery<PayrollCycleDto, ApiError>({
    queryKey: [...queryKeys.payroll.cycles(), 'current'],
    queryFn: ({ signal }) => apiFetch<PayrollCycleDto>('/api/payroll/cycles/current', { signal }),
    refetchInterval: 60_000,  // poll cycle status — changes when ops runs batch
  });
}

export function usePayrollTrend(months = 6): UseQueryResult<PayrollTrendPoint[], ApiError> {
  return useQuery<PayrollTrendPoint[], ApiError>({
    queryKey: [...queryKeys.payroll.all(), 'trend', months],
    queryFn: ({ signal }) =>
      apiFetch<PayrollTrendPoint[]>(`/api/payroll/trend?months=${months}`, { signal }),
  });
}

export function usePayrollVariance(cycleId: string): UseQueryResult<PayrollVarianceDto[], ApiError> {
  return useQuery<PayrollVarianceDto[], ApiError>({
    queryKey: queryKeys.payroll.variance(cycleId),
    queryFn: ({ signal }) =>
      apiFetch<PayrollVarianceDto[]>(`/api/payroll/cycles/${cycleId}/variance`, { signal }),
    enabled: !!cycleId,
  });
}

export function usePayslips(params: PayslipListParams): UseQueryResult<PayslipRow[], ApiError> {
  return useQuery<PayslipRow[], ApiError>({
    queryKey: [...queryKeys.payroll.payslips(params.cycleId), params],
    queryFn: ({ signal }) => {
      const { cycleId, ...rest } = params;
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(rest)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ),
      ).toString();
      return apiFetch<PayslipRow[]>(`/api/payroll/cycles/${cycleId}/payslips?${qs}`, { signal });
    },
    enabled: !!params.cycleId,
    placeholderData: (prev) => prev,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useRunPayrollCycle() {
  const qc = useQueryClient();
  return useMutation<PayrollCycleDto, ApiError, { month: string }>({
    mutationFn: (body) =>
      apiFetch<PayrollCycleDto>('/api/payroll/cycles/run', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.all() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.kpis() });
    },
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, { cycleId: string }>({
    mutationFn: ({ cycleId }) =>
      apiFetch(`/api/payroll/cycles/${cycleId}/approve`, { method: 'POST' }),
    onSuccess: (_data, { cycleId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.payroll.cycle(cycleId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
    },
  });
}
