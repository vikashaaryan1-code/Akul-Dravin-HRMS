/**
 * src/lib/query/fetcher.ts
 * Centralised HTTP fetch wrapper for all React Query hooks.
 *
 * Features:
 *   - Automatic Bearer token injection from auth store
 *   - Structured ApiError normalisation (4xx / 5xx / network)
 *   - Tenant-ID header injection
 *   - AbortSignal passthrough for React Query cancellation
 *   - JSON + text response detection
 */

import { useAuthStore } from '@/store/auth-store';
import type { ApiError } from './client';

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4001'
).replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

export type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

/**
 * apiFetch — typed fetch wrapper.
 * Throws `ApiError` on non-2xx responses so React Query can classify them.
 *
 * @example
 *   const data = await apiFetch<DashboardKpiDto>('/api/dashboard/kpis', { signal });
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, headers: extraHeaders = {} } = options;

  // Auth token from Zustand store (safe to call outside React — it's a store subscription)
  const token = useAuthStore.getState().token;
  const tenantId = useAuthStore.getState().user?.tenantId ?? '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
    ...extraHeaders,
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (networkError) {
    const err: ApiError = { status: 0, message: 'Network error — check your connection.' };
    throw err;
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    let code: string | undefined;
    try {
      const json = await response.json();
      message = json?.message ?? json?.error ?? message;
      code = json?.code;
    } catch {
      // non-JSON error body — use default message
    }
    const err: ApiError = { status: response.status, message, code };
    throw err;
  }

  // Detect JSON vs text responses
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as T;
}
