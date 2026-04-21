'use client';

import { useAuthStore } from '@/store/auth-store';

type Primitive = string | number | boolean;

type RequestOptions = {
  auth?: boolean;
  query?: Record<string, Primitive | undefined>;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4001/api/v1').replace(/\/$/, '');

const createUrl = (path: string, query?: Record<string, Primitive | undefined>) => {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${safePath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  if (options.auth !== false && !token) {
    throw new Error('Authentication token not available. Please login first.');
  }

  const response = await fetch(createUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.auth !== false && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message?: string }).message)
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const isApiBaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
