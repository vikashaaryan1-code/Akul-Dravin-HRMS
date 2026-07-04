/**
 * api-client.ts — Typed HTTP client for Akul Dravin HRMS frontend.
 *
 * Features:
 *  - Automatic Authorization header injection from auth store
 *  - Typed responses with generic T
 *  - Consistent error handling with ApiError class
 *  - Request/response logging in development
 *  - Automatic 401 session expiry handling
 *  - Base URL resolution from env
 *
 * Usage:
 *   const employees = await apiClient.get<Employee[]>('/employees');
 *   const result = await apiClient.post<LoginResponse>('/auth/login', { email, password });
 */

import { logger } from '@/utils/logger';

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4100'
).replace(/\/$/, '');

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}: ${statusText}`);
    this.name = 'ApiError';
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isNotFound()     { return this.status === 404; }
  get isServerError()  { return this.status >= 500; }
  get isRateLimited()  { return this.status === 429; }
}

// ── Token resolver ────────────────────────────────────────────────────────────

function getToken(): string | null {
  try {
    // Lazy import to avoid circular deps and SSR issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuthStore } = require('@/store/auth-store') as { useAuthStore: { getState: () => { token?: string | null } } };
    return useAuthStore.getState().token ?? null;
  } catch {
    return null;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Override the base URL for this request */
  baseUrl?: string;
  /** Skip the Authorization header */
  skipAuth?: boolean;
  /** Abort signal timeout in ms (default: 30000) */
  timeoutMs?: number;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    baseUrl = BASE_URL,
    skipAuth = false,
    timeoutMs = 30_000,
    headers: extraHeaders = {},
    ...restOptions
  } = options;

  const resolvedBaseUrl = baseUrl.includes('/api/v1')
    ? baseUrl
    : baseUrl.includes('/api')
      ? baseUrl.replace('/api', '/api/v1')
      : `${baseUrl}/api/v1`;

  const url = `${resolvedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const token = skipAuth ? null : getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders as Record<string, string>),
  };

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeoutMs),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...restOptions,
  };

  const start = Date.now();

  logger.debug(`→ ${method} ${url}`, { method, url });

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    logger.error(`Network error: ${method} ${url}`, err);
    throw err;
  }

  const duration = Date.now() - start;
  logger.debug(`← ${response.status} ${method} ${url} (${duration}ms)`, {
    status: response.status,
    duration,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  const contentType = response.headers.get('content-type') ?? '';

  try {
    data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Auto clear session on 401
    if (response.status === 401) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require('@/store/auth-store') as { useAuthStore: { getState: () => { clearSession?: () => void } } };
        useAuthStore.getState().clearSession?.();
      } catch { /* ignore */ }
    }

    const message = (data && typeof data === 'object' && 'message' in data)
      ? String((data as { message: unknown }).message)
      : response.statusText;

    logger.warn(`API error: ${method} ${url}`, {
      status: response.status,
      message,
    });

    throw new ApiError(response.status, response.statusText, data, message);
  }

  return data as T;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const apiClient = {
  get:    <T>(path: string, opts?: RequestOptions) => request<T>('GET',    path, opts),
  post:   <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST',   path, { ...opts, body }),
  patch:  <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH',  path, { ...opts, body }),
  put:    <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT',    path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),

  /**
   * Upload files using multipart/form-data.
   * Omits Content-Type so the browser sets the boundary automatically.
   */
  upload: <T>(path: string, formData: FormData, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, {
      ...opts,
      body: undefined,
      headers: {
        ...(opts?.headers ?? {}),
        // Don't set Content-Type — browser will set multipart boundary
      },
    }),
} as const;

export type ApiClient = typeof apiClient;
