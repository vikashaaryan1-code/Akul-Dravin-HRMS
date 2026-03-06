'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlatformRole } from '@/types/platform';

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  tenantId: string | null;
  role: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  activeRole: PlatformRole;
  setSession: (payload: { accessToken: string; user: Partial<AuthUser> }) => void;
  setActiveRole: (role: PlatformRole) => void;
  clearSession: () => void;
};

const toPlatformRole = (role?: string | null): PlatformRole => {
  const normalized = (role ?? '').toLowerCase();

  if (normalized.includes('company')) {
    return 'company-admin';
  }

  if (normalized.includes('team-manager') || normalized.includes('team manager')) {
    return 'team-manager';
  }

  if (normalized.includes('team-leader') || normalized.includes('team leader')) {
    return 'team-leader';
  }

  if (normalized.includes('sales')) {
    return 'sales-manager';
  }

  if (normalized.includes('hr')) {
    return 'hr-manager';
  }

  if (normalized.includes('recruit')) {
    return 'recruiter';
  }

  if (normalized.includes('employee')) {
    return 'employee';
  }

  if (normalized.includes('guest')) {
    return 'guest';
  }

  return 'platform-admin';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      activeRole: 'platform-admin',
      setSession: ({ accessToken, user }) =>
        set({
          accessToken,
          user: {
            id: user.id ?? '',
            email: user.email ?? '',
            fullName: user.fullName ?? 'AKUL DRAVIN User',
            tenantId: user.tenantId ?? null,
            role: user.role ?? 'platform-admin',
          },
          activeRole: toPlatformRole(user.role),
        }),
      setActiveRole: (activeRole) => set({ activeRole }),
      clearSession: () =>
        set({
          accessToken: null,
          user: null,
          activeRole: 'platform-admin',
        }),
    }),
    {
      name: 'akul-dravin-auth-state',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        activeRole: state.activeRole,
      }),
    },
  ),
);

export const selectIsAuthenticated = (state: AuthState) => Boolean(state.accessToken);
