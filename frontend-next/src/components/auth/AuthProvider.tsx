'use client';

import { ReactNode } from 'react';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

/**
 * AuthProvider
 *
 * Client-side provider that initializes global authentication listeners
 * like auto-refresh and session sync.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize the token refresh loop and cookie sync
  useTokenRefresh();

  return <>{children}</>;
}
