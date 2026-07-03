/**
 * src/lib/query/client.ts
 * Central React Query client for the AKUL DRAVIN platform.
 *
 * Features:
 * - 30s stale time for all dashboard data
 * - Exponential back-off retry (max 3 attempts, skip 4xx)
 * - Structured error normalisation
 * - Dev mode React Query Devtools integration slot
 */

import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

/** Normalise any thrown value into a structured ApiError shape */
export type ApiError = {
 status: number;
 message: string;
 code?: string;
};

function isApiError(err: unknown): err is ApiError {
 return typeof err === 'object' && err !== null && 'status' in err;
}

const CLIENT_CONFIG: QueryClientConfig = {
 defaultOptions: {
 queries: {
 staleTime: 30_000, // 30 seconds before background refetch
 gcTime: 5 * 60_000, // 5 min garbage collection window
 refetchOnWindowFocus: true,
 retry: (failureCount, error) => {
 /* Never retry 4xx client errors */ if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
 return failureCount < 3;
 },
 retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
 },
 mutations: {
 retry: false,
 },
 },
};

/* Singleton — shared across the entire app via QueryClientProvider */ let _client: QueryClient | undefined;

export function getQueryClient(): QueryClient {
 if (!_client) _client = new QueryClient(CLIENT_CONFIG);
 return _client;
}
