/**
 * src/hooks/api/useEmployees.ts
 * React Query hooks for HRMS Intelligence dashboard.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/keys';
import type { ApiError } from '@/lib/query/client';

/* ── DTOs ───────────────────────────────────────────────────────────────────── */ export type EmployeeStatus = 'active' | 'probation' | 'notice' | 'offboarded';

export type EmployeeListItem = {
 id: string;
 name: string;
 dept: string;
 role: string;
 joined: string; // ISO date string
 status: EmployeeStatus;
 avatarUrl?: string;
};

export type EmployeeListParams = {
 page?: number;
 limit?: number;
 search?: string;
 dept?: string;
 status?: EmployeeStatus;
};

export type PaginatedEmployees = {
 data: EmployeeListItem[];
 total: number;
 page: number;
 totalPages: number;
};

export type AttendanceWeekPoint = {
 week: string;
 present: number;
 absent: number;
 wfh: number;
};

export type LeaveTypePoint = {
 name: string;
 value: number;
 color: 'aqua' | 'ember' | 'jade' | 'gold';
};

export type HrmsKpiDto = {
 activeEmployees: number;
 newThisMonth: number;
 onLeaveToday: number;
 documentsPending: number;
 activeEmployeesTrend: number;
 newThisMonthTrend: number;
 onLeaveTrend: number;
 documentsTrend: number;
};

/* ── Hooks ───────────────────────────────────────────────────────────────────── */ export function useHrmsKpis(): UseQueryResult<HrmsKpiDto, ApiError> {
 return useQuery<HrmsKpiDto, ApiError>({
 queryKey: ['hrms', 'kpis'],
 queryFn: ({ signal }) => apiFetch<HrmsKpiDto>('/api/hrms/kpis', { signal }),
 });
}

export function useEmployeeList(
 params: EmployeeListParams = {},
): UseQueryResult<PaginatedEmployees, ApiError> {
 return useQuery<PaginatedEmployees, ApiError>({
 queryKey: queryKeys.employees.list(params),
 queryFn: ({ signal }) => {
 const qs = new URLSearchParams(
 Object.fromEntries(
 Object.entries(params)
 .filter(([, v]) => v !== undefined && v !== '')
 .map(([k, v]) => [k, String(v)]),
 ),
 ).toString();
 return apiFetch<PaginatedEmployees>(`/api/employees?${qs}`, { signal });
 },
 placeholderData: (prev) => prev, /* keep previous data during pagination */ });
}

export function useAttendanceTrend(weeks = 6): UseQueryResult<AttendanceWeekPoint[], ApiError> {
 return useQuery<AttendanceWeekPoint[], ApiError>({
 queryKey: ['hrms', 'attendance-trend', weeks],
 queryFn: ({ signal }) =>
 apiFetch<AttendanceWeekPoint[]>(`/api/hrms/attendance-trend?weeks=${weeks}`, { signal }),
 });
}

export function useLeaveByType(): UseQueryResult<LeaveTypePoint[], ApiError> {
 return useQuery<LeaveTypePoint[], ApiError>({
 queryKey: ['hrms', 'leave-by-type'],
 queryFn: ({ signal }) => apiFetch<LeaveTypePoint[]>('/api/hrms/leave-by-type', { signal }),
 });
}

/* ── Mutations ───────────────────────────────────────────────────────────────── */ export type ApproveLeaveBody = { leaveRequestId: string };

export function useApproveLeave() {
 const qc = useQueryClient();
 return useMutation<void, ApiError, ApproveLeaveBody>({
 mutationFn: (body) =>
 apiFetch('/api/hrms/leave/approve', { method: 'POST', body }),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: queryKeys.employees.all() });
 qc.invalidateQueries({ queryKey: queryKeys.dashboard.pendingApprovals() });
 },
 });
}
