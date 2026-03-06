'use client';

import { useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { ModuleLinksBar } from '@/components/modules/ModuleLinksBar';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { canPerformAction } from '@/utils/action-permissions';
import { toRoleLabel } from '@/utils/platform-config';

export function SettingsModuleView() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const activeRole = useUIStore((state) => state.activeRole);

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);

  const canUpdatePreferences = canPerformAction(activeRole, 'settings.update-preferences');

  return (
    <div className="space-y-5">
      <PageTitle
        title="Settings"
        description="Manage account preferences, appearance controls, and operational notification defaults."
      />

      <ModuleLinksBar
        links={[
          { label: 'Dashboard', href: `/dashboard?role=${activeRole}` },
          { label: 'Services', href: `/services?role=${activeRole}` },
          { label: 'Automation', href: `/automation?role=${activeRole}` },
        ]}
        isLive={Boolean(accessToken)}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Appearance</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Current role view: {toRoleLabel(activeRole)}</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              disabled={!canUpdatePreferences}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 dark:bg-slate-100 dark:text-slate-900"
              title={canUpdatePreferences ? 'Toggle Theme' : 'Your role cannot modify preferences.'}
            >
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
            <span className="text-xs text-slate-500">Theme: {theme}</span>
          </div>
          {!canUpdatePreferences ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Preference updates are disabled for your role.</p>
          ) : null}
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notification Preferences</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3 dark:border-slate-700/70">
              <span className="text-sm text-slate-700 dark:text-slate-200">Realtime system alerts</span>
              <input
                type="checkbox"
                checked={alertsEnabled}
                disabled={!canUpdatePreferences}
                onChange={() => setAlertsEnabled((value) => !value)}
                className="h-4 w-4 disabled:cursor-not-allowed"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3 dark:border-slate-700/70">
              <span className="text-sm text-slate-700 dark:text-slate-200">Daily analytics email digest</span>
              <input
                type="checkbox"
                checked={emailDigestEnabled}
                disabled={!canUpdatePreferences}
                onChange={() => setEmailDigestEnabled((value) => !value)}
                className="h-4 w-4 disabled:cursor-not-allowed"
              />
            </label>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Security & Access</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Signed in user: {user?.fullName ?? 'Demo User'}</li>
            <li>User email: {user?.email ?? 'demo@akuldravin.com'}</li>
            <li>Token status: {accessToken ? 'Connected to backend' : 'Demo mode (no token)'}</li>
            <li>Active sessions: 1</li>
          </ul>
          <button
            type="button"
            onClick={clearSession}
            className="mt-4 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Clear Session
          </button>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Workspace Preferences</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Default dashboard period: Last 30 days</li>
            <li>Chart timezone: Asia/Calcutta</li>
            <li>Data export format: CSV + PDF</li>
            <li>Locale: English (India)</li>
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}
