'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlatformRole, ThemeMode } from '@/types/platform';

type UIState = {
 theme: ThemeMode;
 activeRole: PlatformRole;
 notificationPanelOpen: boolean;
 setTheme: (theme: ThemeMode) => void;
 toggleTheme: () => void;
 setActiveRole: (role: PlatformRole) => void;
 setNotificationPanelOpen: (open: boolean) => void;
};

const validRoles: PlatformRole[] = [
 'platform-admin',
 'company-admin',
 'hr-manager',
 'team-manager',
 'team-leader',
 'sales-manager',
 'recruiter',
 'employee',
 'guest',
];

const normalizeRole = (value: unknown): PlatformRole => {
 if (typeof value === 'string' && validRoles.includes(value as PlatformRole)) {
 return value as PlatformRole;
 }

 return 'platform-admin';
};

const normalizeTheme = (value: unknown): ThemeMode => (value === 'dark' ? 'dark' : 'light');

export const useUIStore = create<UIState>()(
 persist(
 (set) => ({
 theme: 'light',
 activeRole: 'platform-admin',
 notificationPanelOpen: false,
 setTheme: (theme) => set({ theme }),
 toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
 setActiveRole: (role) => set({ activeRole: role }),
 setNotificationPanelOpen: (notificationPanelOpen) => set({ notificationPanelOpen }),
 }),
 {
 name: 'akul-dravin-ui-state',
 partialize: (state) => ({
 theme: state.theme,
 activeRole: state.activeRole,
 }),
 merge: (persistedState, currentState) => {
 const persisted = (persistedState ?? {}) as Partial<UIState>;

 return {
 ...currentState,
 ...persisted,
 theme: normalizeTheme(persisted.theme),
 activeRole: normalizeRole(persisted.activeRole),
 };
 },
 },
 ),
);
