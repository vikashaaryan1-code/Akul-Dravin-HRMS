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
 avatarUrl?: string | null;
 oauthProvider?: string;
};

type AuthState = {
 accessToken: string | null;
 user: AuthUser | null;
 activeRole: PlatformRole;

 /* Primary setter – used by http-client, TopNavigation, settings */
 setSession: (payload: { accessToken: string; user: Partial<AuthUser> }) => void;

 /* Legacy setter – keeps login / signup pages working without refactor */
 setAuth: (payload: { user: { id: string; email: string; role?: string; fullName?: string; name?: string; tenantId?: string | null }; token: string }) => void;

 setActiveRole: (role: PlatformRole) => void;
 clearSession: () => void;

 /** Compat shim so ProtectedLayout / PlatformShell keep working */
 loadAuth: () => void;
 logout: () => void;

 /** Alias for accessToken – keeps lib/api.ts working */
 token: string | null;
};

const toPlatformRole = (role?: string | null): PlatformRole => {
 const normalized = (role ?? '').toLowerCase();

 if (normalized.includes('company')) return 'company-admin';
 if (normalized.includes('team-manager') || normalized.includes('team manager')) return 'team-manager';
 if (normalized.includes('team-leader') || normalized.includes('team leader')) return 'team-leader';
 if (normalized.includes('sales')) return 'sales-manager';
 if (normalized.includes('hr')) return 'hr-manager';
 if (normalized.includes('recruit')) return 'recruiter';
 if (normalized.includes('employee')) return 'employee';
 if (normalized.includes('guest')) return 'guest';
 return 'platform-admin';
};

export const useAuthStore = create<AuthState>()(
 persist(
 (set, get) => ({
 accessToken: null,
 user: null,
 activeRole: 'platform-admin',

 get token() {
 return get().accessToken;
 },

 setSession: ({ accessToken, user }) =>
 set({
 accessToken,
 user: {
 id: user.id ?? '',
 email: user.email ?? '',
 fullName: user.fullName ?? 'AKUL DRAVIN User',
 tenantId: user.tenantId ?? null,
 role: user.role ?? 'platform-admin',
 avatarUrl: user.avatarUrl ?? null,
 oauthProvider: user.oauthProvider ?? 'email',
 },
 activeRole: toPlatformRole(user.role),
 }),

 setAuth: ({ user, token }) => {
 set({
 accessToken: token,
 user: {
 id: user.id ?? '',
 email: user.email ?? '',
 fullName: (user as any).fullName ?? (user as any).name ?? 'AKUL DRAVIN User',
 tenantId: user.tenantId ?? null,
 role: user.role ?? 'platform-admin',
 avatarUrl: (user as any).avatarUrl ?? null,
 oauthProvider: (user as any).oauthProvider ?? 'email',
 },
 activeRole: toPlatformRole(user.role),
 });
 },

 setActiveRole: (activeRole) => set({ activeRole }),

 clearSession: () => {
 // Clear cookie for middleware
 document.cookie = 'akul-auth-token=; max-age=0; path=/; SameSite=Strict';
 // Clear refresh token
 try { localStorage.removeItem('akul-refresh-token'); } catch { /* ignore */ }
 
 set({
 accessToken: null,
 user: null,
 activeRole: 'platform-admin',
 });
 },

 loadAuth: () => {
 /* zustand/persist handles rehydration automatically – this is a no-op shim */ },

 logout: () => {
 // Clear cookie for middleware
 document.cookie = 'akul-auth-token=; max-age=0; path=/; SameSite=Strict';
 // Clear refresh token
 try { localStorage.removeItem('akul-refresh-token'); } catch { /* ignore */ }

 set({
 accessToken: null,
 user: null,
 activeRole: 'platform-admin',
 });
 },
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
