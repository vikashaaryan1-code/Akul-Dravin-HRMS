/**
 * lib/observability/sentry.ts
 * Sentry + OpenTelemetry integration scaffold for Phase 4.
 *
 * Installation (run after reviewing):
 *   npm install @sentry/nextjs --legacy-peer-deps
 *
 * Wiring (after install):
 *   1. Add `instrumentation.ts` to project root (Next.js 15 convention)
 *   2. Add `sentry.client.config.ts` / `sentry.server.config.ts`
 *   3. Wrap `next.config.ts` with `withSentryConfig`
 *
 * This file provides:
 *   - `captureApiError()`  — normalised error capture with tenant context
 *   - `captureUIError()`   — boundary-originated error capture
 *   - `setUserContext()`   — enriches every event with auth user + tenant
 *   - `startSpan()`        — thin wrapper for OpenTelemetry manual spans
 *   - Feature flags for gradual rollout (env-gated)
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export type ObservabilityUser = {
  id:       string;
  email:    string;
  tenantId: string;
  role:     string;
};

export type ApiErrorContext = {
  endpoint:   string;
  method:     string;
  statusCode: number;
  tenantId?:  string;
  traceId?:   string;
};

// ── Feature gate ──────────────────────────────────────────────────────────────
const SENTRY_ENABLED =
  typeof window !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN;

// ── Lazy Sentry import — only loads when DSN is configured ────────────────────
async function getSentry() {
  if (!SENTRY_ENABLED) return null;
  // Dynamically imported so Sentry doesn't bloat the bundle when not configured
  return import('@sentry/nextjs');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enrich all subsequent Sentry events with the authenticated user and tenant.
 * Call once after successful auth resolution (in AuthProvider).
 */
export async function setUserContext(user: ObservabilityUser): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) return;
  Sentry.setUser({ id: user.id, email: user.email });
  Sentry.setTag('tenant_id', user.tenantId);
  Sentry.setTag('user_role',  user.role);
}

/**
 * Capture an API-layer error with structured context.
 * Call from `apiFetch()` on non-2xx responses.
 */
export async function captureApiError(
  error:   Error,
  context: ApiErrorContext,
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ObservabilityApiError]', context, error);
    }
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(context.statusCode >= 500 ? 'error' : 'warning');
    scope.setContext('api_request', {
      endpoint:    context.endpoint,
      method:      context.method,
      status_code: context.statusCode,
      trace_id:    context.traceId ?? 'unknown',
    });
    if (context.tenantId) scope.setTag('tenant_id', context.tenantId);
    Sentry.captureException(error);
  });
}

/**
 * Capture a React render error from ErrorBoundary.
 * Call in `componentDidCatch` or `onError` callbacks.
 */
export async function captureUIError(
  error:   Error,
  context: string,
  info?:   { componentStack?: string },
): Promise<void> {
  const Sentry = await getSentry();
  if (!Sentry) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ObservabilityUIError:${context}]`, error);
    }
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('ui_context', context);
    if (info?.componentStack) {
      scope.setContext('react', { component_stack: info.componentStack });
    }
    Sentry.captureException(error);
  });
}

/**
 * Wrap an async operation in an OpenTelemetry span (via Sentry tracing).
 * Use for manual instrumentation of critical business operations
 * (e.g., payroll run, AI inference, bulk export).
 *
 * @example
 * const result = await startSpan('payroll.run', async () => runPayrollCycle(cycleId));
 */
export async function startSpan<T>(
  name:      string,
  operation: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const Sentry = await getSentry();
  if (!Sentry) return operation();

  return Sentry.startSpan(
    { name, attributes: attributes as Record<string, string | number | boolean> },
    operation,
  );
}

// ── Client-side performance mark helpers ──────────────────────────────────────

/**
 * Mark the start of a dashboard render for Web Vitals attribution.
 * Call at the top of heavy dashboard components.
 */
export function markDashboardRender(dashboardName: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(`dashboard:${dashboardName}:start`);
}

/**
 * Measure dashboard render duration and log to console in dev.
 * In production, this will be picked up by Sentry Performance.
 */
export function measureDashboardRender(dashboardName: string): void {
  if (typeof performance === 'undefined') return;
  try {
    performance.measure(
      `dashboard:${dashboardName}`,
      `dashboard:${dashboardName}:start`,
    );
    if (process.env.NODE_ENV === 'development') {
      const [entry] = performance.getEntriesByName(`dashboard:${dashboardName}`);
      if (entry) {
        console.debug(`[Perf] ${dashboardName} rendered in ${entry.duration.toFixed(1)}ms`);
      }
    }
  } catch {
    // measureDashboardRender is best-effort — never throw
  }
}
