/**
 * src/hooks/api/useDashboard.ts
 * React Query hooks for the Executive Command Center.
 *
 * Phase 3C: These replace DTO-shaped mocks in ExecutiveCommandCenter.tsx.
 * Each hook is individually suspense-ready and returns ApiError on failure.
 */

import { useQuery, useSuspenseQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/keys';
import type { ApiError } from '@/lib/query/client';

/* ── DTOs ───────────────────────────────────────────────────────────────────── */ export type DashboardKpiDto = {
 totalHeadcount: number;
 monthlyPayroll: number; // in rupees
 complianceScore: number; // 0–100
 activePositions: number;
 headcountTrend: number; // % change vs last month
 payrollTrend: number;
 complianceTrend: number;
 positionsTrend: number;
};

export type HeadcountDataPoint = {
 month: string;
 headcount: number;
 exits: number;
};

export type DeptBreakdownItem = {
 name: string;
 value: number;
 color: 'gold' | 'aqua' | 'jade' | 'ember' | 'mist';
};

export type AiInsightDto = {
 id: string;
 severity: 'info' | 'success' | 'warning' | 'ai';
 title: string;
 body: string;
 action: string;
 href?: string;
};

export type PendingApprovalDto = {
 id: string;
 type: string;
 name: string;
 dept: string;
 time: string;
 urgency: 'low' | 'medium' | 'high';
 href: string;
};

/* ── Hooks ───────────────────────────────────────────────────────────────────── */ export function useDashboardKpis(): UseQueryResult<DashboardKpiDto, ApiError> {
 return useQuery<DashboardKpiDto, ApiError>({
 queryKey: queryKeys.dashboard.kpis(),
 queryFn: ({ signal }) => apiFetch<DashboardKpiDto>('/api/dashboard/kpis', { signal }),
 });
}

export function useHeadcountTrend(months = 6): UseQueryResult<HeadcountDataPoint[], ApiError> {
 return useQuery<HeadcountDataPoint[], ApiError>({
 queryKey: [...queryKeys.dashboard.metrics(), 'headcount', months],
 queryFn: ({ signal }) =>
 apiFetch<HeadcountDataPoint[]>(`/api/dashboard/headcount-trend?months=${months}`, { signal }),
 });
}

export function useDeptBreakdown(): UseQueryResult<DeptBreakdownItem[], ApiError> {
 return useQuery<DeptBreakdownItem[], ApiError>({
 queryKey: [...queryKeys.dashboard.metrics(), 'dept-breakdown'],
 queryFn: ({ signal }) => apiFetch<DeptBreakdownItem[]>('/api/dashboard/dept-breakdown', { signal }),
 });
}

export function useAiInsights(): UseQueryResult<AiInsightDto[], ApiError> {
 return useQuery<AiInsightDto[], ApiError>({
 queryKey: queryKeys.dashboard.aiInsights(),
 queryFn: ({ signal }) => apiFetch<AiInsightDto[]>('/api/ai/insights', { signal }),
 staleTime: 60_000, /* AI insights: 1 minute stale time */ });
}

export function usePendingApprovals(): UseQueryResult<PendingApprovalDto[], ApiError> {
 return useQuery<PendingApprovalDto[], ApiError>({
 queryKey: queryKeys.dashboard.pendingApprovals(),
 queryFn: ({ signal }) => apiFetch<PendingApprovalDto[]>('/api/dashboard/pending-approvals', { signal }),
 refetchInterval: 30_000, /* Poll every 30s — approvals are time-sensitive */ });
}

// ── Suspense variants ─────────────────────────────────────────────────────────
export function useDashboardKpisSuspense() {
 return useSuspenseQuery<DashboardKpiDto, ApiError>({
 queryKey: queryKeys.dashboard.kpis(),
 queryFn: ({ signal }) => apiFetch<DashboardKpiDto>('/api/dashboard/kpis', { signal }),
 });
}
