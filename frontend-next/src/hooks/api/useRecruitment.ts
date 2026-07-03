/**
 * src/hooks/api/useRecruitment.ts
 * React Query hooks for the ATS & Recruitment Marketplace.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/keys';
import type { ApiError } from '@/lib/query/client';

/* ── DTOs ───────────────────────────────────────────────────────────────────── */ export type CandidateStage = 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
export type OpeningPriority = 'urgent' | 'high' | 'medium' | 'low';

export type AtsKpiDto = {
 openPositions: number;
 totalApplicants: number;
 avgTimeToHire: number; // days
 offerAcceptRate: number; // 0–100
 openPositionsTrend: number;
 applicantsTrend: number;
 timeToHireTrend: number;
 acceptRateTrend: number;
};

export type PipelineFunnelItem = {
 stage: string;
 count: number;
 color: string;
};

export type HireTrendPoint = {
 month: string;
 applied: number;
 hired: number;
};

export type SourceMixItem = {
 name: string;
 value: number;
 color: 'gold' | 'jade' | 'aqua' | 'ember' | 'mist';
};

export type CandidateDto = {
 id: string;
 name: string;
 role: string;
 score: number; // 0–100 AI score
 stage: CandidateStage;
 source: string;
 days: number; /* days in pipeline */ };

export type OpenRoleDto = {
 id: string;
 title: string;
 dept: string;
 applicants: number;
 priority: OpeningPriority;
 postedAt: string;
};

export type CandidateListParams = {
 page?: number;
 limit?: number;
 search?: string;
 stage?: CandidateStage;
 roleId?: string;
};

/* ── Hooks ───────────────────────────────────────────────────────────────────── */ export function useAtsKpis(): UseQueryResult<AtsKpiDto, ApiError> {
 return useQuery<AtsKpiDto, ApiError>({
 queryKey: [...queryKeys.recruitment.all(), 'kpis'],
 queryFn: ({ signal }) => apiFetch<AtsKpiDto>('/api/recruitment/kpis', { signal }),
 });
}

export function usePipelineFunnel(): UseQueryResult<PipelineFunnelItem[], ApiError> {
 return useQuery<PipelineFunnelItem[], ApiError>({
 queryKey: queryKeys.recruitment.pipeline(),
 queryFn: ({ signal }) =>
 apiFetch<PipelineFunnelItem[]>('/api/recruitment/pipeline-funnel', { signal }),
 });
}

export function useHireTrend(months = 6): UseQueryResult<HireTrendPoint[], ApiError> {
 return useQuery<HireTrendPoint[], ApiError>({
 queryKey: [...queryKeys.recruitment.all(), 'hire-trend', months],
 queryFn: ({ signal }) =>
 apiFetch<HireTrendPoint[]>(`/api/recruitment/hire-trend?months=${months}`, { signal }),
 });
}

export function useSourceMix(): UseQueryResult<SourceMixItem[], ApiError> {
 return useQuery<SourceMixItem[], ApiError>({
 queryKey: [...queryKeys.recruitment.all(), 'source-mix'],
 queryFn: ({ signal }) => apiFetch<SourceMixItem[]>('/api/recruitment/source-mix', { signal }),
 });
}

export function useCandidates(params: CandidateListParams = {}): UseQueryResult<{
 data: CandidateDto[];
 total: number;
}, ApiError> {
 return useQuery({
 queryKey: queryKeys.recruitment.candidates(params),
 queryFn: ({ signal }) => {
 const qs = new URLSearchParams(
 Object.fromEntries(
 Object.entries(params)
 .filter(([, v]) => v !== undefined && v !== '')
 .map(([k, v]) => [k, String(v)]),
 ),
 ).toString();
 return apiFetch<{ data: CandidateDto[]; total: number }>(`/api/recruitment/candidates?${qs}`, { signal });
 },
 placeholderData: (prev) => prev,
 });
}

export function useOpenRoles(): UseQueryResult<OpenRoleDto[], ApiError> {
 return useQuery<OpenRoleDto[], ApiError>({
 queryKey: queryKeys.recruitment.openRoles(),
 queryFn: ({ signal }) => apiFetch<OpenRoleDto[]>('/api/recruitment/open-roles', { signal }),
 refetchInterval: 120_000, /* 2-minute poll — openings change infrequently */ });
}

/* ── Mutations ───────────────────────────────────────────────────────────────── */ export type AdvanceCandidateBody = { candidateId: string; toStage: CandidateStage };

export function useAdvanceCandidate() {
 const qc = useQueryClient();
 return useMutation<CandidateDto, ApiError, AdvanceCandidateBody>({
 mutationFn: (body) =>
 apiFetch<CandidateDto>('/api/recruitment/candidates/advance', { method: 'PATCH', body }),
 onSuccess: (_data, { candidateId }) => {
 qc.invalidateQueries({ queryKey: queryKeys.recruitment.candidate(candidateId) });
 qc.invalidateQueries({ queryKey: queryKeys.recruitment.pipeline() });
 qc.invalidateQueries({ queryKey: queryKeys.recruitment.candidates() });
 },
 });
}

export type PostRoleBody = {
 title: string;
 dept: string;
 priority: OpeningPriority;
 description: string;
};

export function usePostRole() {
 const qc = useQueryClient();
 return useMutation<OpenRoleDto, ApiError, PostRoleBody>({
 mutationFn: (body) =>
 apiFetch<OpenRoleDto>('/api/recruitment/open-roles', { method: 'POST', body }),
 onSuccess: () => {
 qc.invalidateQueries({ queryKey: queryKeys.recruitment.openRoles() });
 qc.invalidateQueries({ queryKey: queryKeys.dashboard.kpis() });
 },
 });
}
