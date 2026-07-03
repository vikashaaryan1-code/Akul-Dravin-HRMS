/**
 * src/lib/query/index.ts
 * React Query data layer barrel export.
 *
 * Usage:
 * import { queryKeys, apiFetch, getQueryClient } from '@/lib/query';
 */

export { getQueryClient } from './client';
export type { ApiError } from './client';
export { apiFetch } from './fetcher';
export { queryKeys } from './keys';
