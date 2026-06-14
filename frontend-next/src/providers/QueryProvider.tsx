'use client';

/**
 * src/providers/QueryProvider.tsx
 * React Query + ReactQueryDevtools provider for the entire platform.
 *
 * - Wraps children with QueryClientProvider using the singleton client
 * - Devtools only loaded in development (dynamic import to avoid bundle impact)
 * - SSR-safe: client is created on first call to getQueryClient()
 *
 * Usage (root layout):
 *   <QueryProvider>
 *     <PlatformShell>{children}</PlatformShell>
 *   </QueryProvider>
 */

import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query/client';

// Lazily import devtools so they are stripped from production bundle
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? React.lazy(() =>
        import('@tanstack/react-query-devtools').then((m) => ({
          default: m.ReactQueryDevtools,
        })),
      )
    : null;

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // getQueryClient() returns the singleton — safe to call here
  const client = getQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
      {ReactQueryDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
}
