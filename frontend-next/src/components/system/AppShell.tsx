'use client';

import React, { useState, type ReactNode } from 'react';
import { ExecutiveSidebar } from './navigation/ExecutiveSidebar';
import { TopCommandBar } from './navigation/TopCommandBar';
import { NotificationRail } from './navigation/NotificationRail';
import { AppErrorBoundary } from './ErrorBoundary';

// ── DashboardLayout ───────────────────────────────────────────────────────────
interface DashboardLayoutProps {
  children: ReactNode;
  /** Override sidebar default collapsed state */
  defaultSidebarCollapsed?: boolean;
}

/**
 * DashboardLayout — Phase 3A AppShell
 *
 * Orchestrates:
 *   - ExecutiveSidebar (collapsible, role-aware)
 *   - TopCommandBar (breadcrumb, search, notifications, user menu)
 *   - NotificationRail (slide-over panel)
 *   - Main content area with correct offset, top padding and error boundary
 *
 * Sidebar width: 240px expanded / 72px collapsed
 * Top bar height: 53px (h-[53px])
 */
export function DashboardLayout({ children, defaultSidebarCollapsed = false }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed);
  const [notifOpen, setNotifOpen] = useState(false);

  // We listen to sidebar state via a simple state lift.
  // The sidebar calls onCollapseChange; we pass it as a prop.
  const sidebarOffset = sidebarCollapsed ? 72 : 240;

  return (
    <div className="min-h-screen bg-void text-white" id="app-shell">
      {/* Sidebar */}
      <ExecutiveSidebar
        defaultCollapsed={defaultSidebarCollapsed}
      />

      {/* Top bar */}
      <TopCommandBar
        sidebarCollapsed={sidebarCollapsed}
        notificationCount={2}
        onNotificationClick={() => setNotifOpen(true)}
      />

      {/* Notification slide-over */}
      <NotificationRail open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Main content */}
      <main
        id="main-content"
        className="min-h-screen transition-all duration-220"
        style={{
          marginLeft: sidebarOffset,
          paddingTop: '53px', // TopCommandBar height
        }}
        tabIndex={-1}
      >
        <AppErrorBoundary context="DashboardLayout">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </AppErrorBoundary>
      </main>
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────
interface AppShellProps {
  children: ReactNode;
  variant?: 'dashboard' | 'minimal';
}

/**
 * AppShell — Top-level layout switcher.
 * 'dashboard' variant: full sidebar + topbar layout.
 * 'minimal' variant: content-only (for modals, onboarding, etc.)
 */
export function AppShell({ children, variant = 'dashboard' }: AppShellProps) {
  if (variant === 'minimal') {
    return (
      <div className="min-h-screen bg-void text-white">
        <AppErrorBoundary context="AppShell">
          {children}
        </AppErrorBoundary>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
