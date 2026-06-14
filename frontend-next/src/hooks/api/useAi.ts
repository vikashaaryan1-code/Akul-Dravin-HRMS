/**
 * src/hooks/api/useAi.ts
 * React Query hooks for the AI Copilot Workspace.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiFetch } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/keys';
import type { ApiError } from '@/lib/query/client';

// ── DTOs ─────────────────────────────────────────────────────────────────────
export type ModelStatus = 'active' | 'training' | 'idle' | 'error';

export type AiModelDto = {
  id:       string;
  name:     string;
  accuracy: number;    // 0–100
  status:   ModelStatus;
  lastRun:  string;    // human-readable
  version:  string;
};

export type AiPredictionDto = {
  id:         string;
  type:       string;
  entity:     string;
  result:     string;
  confidence: number;   // 0–100
  severity:   'low' | 'medium' | 'high' | 'critical';
  createdAt:  string;
};

export type AiKpiDto = {
  predictionsToday:  number;
  forecastAccuracy:  number;
  attritionFlags:    number;
  modelsActive:      number;
  predictionsTrend:  number;
  accuracyTrend:     number;
  attritionTrend:    number;
};

export type AccuracyTrendPoint = {
  week:       string;
  accuracy:   number;
  confidence: number;
};

export type ChatMessage = {
  id:        string;
  role:      'user' | 'ai';
  text:      string;
  timestamp: string;
};

export type ChatSendBody = {
  message:    string;
  sessionId?: string;
};

export type ChatResponse = {
  id:        string;
  role:      'ai';
  text:      string;
  timestamp: string;
  sessionId: string;
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
export function useAiKpis(): UseQueryResult<AiKpiDto, ApiError> {
  return useQuery<AiKpiDto, ApiError>({
    queryKey: [...queryKeys.ai.all(), 'kpis'],
    queryFn: ({ signal }) => apiFetch<AiKpiDto>('/api/ai/kpis', { signal }),
  });
}

export function useAiModels(): UseQueryResult<AiModelDto[], ApiError> {
  return useQuery<AiModelDto[], ApiError>({
    queryKey: queryKeys.ai.models(),
    queryFn: ({ signal }) => apiFetch<AiModelDto[]>('/api/ai/models', { signal }),
    refetchInterval: 60_000,  // model status can change during training
  });
}

export function useAiPredictions(limit = 10): UseQueryResult<AiPredictionDto[], ApiError> {
  return useQuery<AiPredictionDto[], ApiError>({
    queryKey: [...queryKeys.ai.predictions(), limit],
    queryFn: ({ signal }) =>
      apiFetch<AiPredictionDto[]>(`/api/ai/predictions?limit=${limit}`, { signal }),
    refetchInterval: 30_000,  // predictions update as new data arrives
  });
}

export function useAccuracyTrend(weeks = 6): UseQueryResult<AccuracyTrendPoint[], ApiError> {
  return useQuery<AccuracyTrendPoint[], ApiError>({
    queryKey: [...queryKeys.ai.all(), 'accuracy-trend', weeks],
    queryFn: ({ signal }) =>
      apiFetch<AccuracyTrendPoint[]>(`/api/ai/accuracy-trend?weeks=${weeks}`, { signal }),
  });
}

export function useChatHistory(): UseQueryResult<ChatMessage[], ApiError> {
  return useQuery<ChatMessage[], ApiError>({
    queryKey: queryKeys.ai.chatHistory(),
    queryFn: ({ signal }) => apiFetch<ChatMessage[]>('/api/ai/chat/history', { signal }),
    staleTime: Infinity,  // chat history doesn't go stale — only updated via mutation
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation<ChatResponse, ApiError, ChatSendBody>({
    mutationFn: (body) =>
      apiFetch<ChatResponse>('/api/ai/chat/send', { method: 'POST', body }),
    // Optimistic update — add user message immediately
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: queryKeys.ai.chatHistory() });
      const prev = qc.getQueryData<ChatMessage[]>(queryKeys.ai.chatHistory()) ?? [];
      const optimisticMsg: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        text: variables.message,
        timestamp: new Date().toISOString(),
      };
      qc.setQueryData<ChatMessage[]>(queryKeys.ai.chatHistory(), [...prev, optimisticMsg]);
      return { prev };
    },
    onSuccess: (response) => {
      // Append real AI response
      qc.setQueryData<ChatMessage[]>(
        queryKeys.ai.chatHistory(),
        (msgs = []) => [...msgs.filter((m) => !m.id.startsWith('optimistic-')), {
          id: response.id,
          role: 'ai',
          text: response.text,
          timestamp: response.timestamp,
        }],
      );
    },
    onError: (_err, _vars, context) => {
      // Roll back optimistic update
      if ((context as any)?.prev) {
        qc.setQueryData<ChatMessage[]>(queryKeys.ai.chatHistory(), (context as any).prev);
      }
    },
  });
}

export function useRefreshModel() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, { modelId: string }>({
    mutationFn: ({ modelId }) =>
      apiFetch(`/api/ai/models/${modelId}/refresh`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ai.models() });
    },
  });
}
