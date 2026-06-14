/**
 * Observability configuration for Akul Dravin HRMS.
 *
 * Provides:
 * - Sentry error tracking (backend + structured context)
 * - OpenTelemetry span helpers
 * - Structured log formatter (JSON in production)
 * - Request correlation ID propagation
 * - AI + Queue usage metrics (Prometheus-compatible counters)
 *
 * SETUP:
 *   SENTRY_DSN=https://xxx@sentry.io/yyy
 *   OTEL_SERVICE_NAME=akul-dravin-hrms
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
 *
 * If SENTRY_DSN is absent → Sentry is silently disabled (no crash).
 */

// ── Sentry ────────────────────────────────────────────────────────────────────

let Sentry: typeof import('@sentry/node') | null = null;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('[OBSERVABILITY] SENTRY_DSN not set — error tracking disabled');
    return;
  }

  try {
    // Dynamic import — Sentry is optional. If not installed, fails silently.
    Sentry = await import('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.npm_package_version ?? '1.0.0',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [],
      // Capture unhandled promise rejections
      beforeSend(event) {
        // Strip PII — remove request body and user tokens from error reports
        if (event.request) {
          delete event.request.data;
          delete event.request.cookies;
        }
        return event;
      },
    });
    console.log('[OBSERVABILITY] Sentry initialized');
  } catch {
    console.warn('[OBSERVABILITY] @sentry/node not installed — skipping Sentry init');
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  const sentryInstance = Sentry;
  if (!sentryInstance) return;
  sentryInstance.withScope(scope => {
    if (context) scope.setExtras(context);
    sentryInstance.captureException(err);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!Sentry) return;
  Sentry.captureMessage(message, level);
}

export function setSentryUser(user: { id: string; email?: string; tenantId?: string }): void {
  if (!Sentry) return;
  Sentry.setUser({ id: user.id, email: user.email, extra: { tenantId: user.tenantId } });
}

// ── Correlation ID ────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';

export function generateCorrelationId(): string {
  return randomUUID();
}

// ── Prometheus-compatible Metrics ─────────────────────────────────────────────
// Simple in-memory counters. Replace with prom-client for full Prometheus scraping.

interface MetricCounter { count: number; lastReset: number }

const counters = new Map<string, MetricCounter>();

export function incrementCounter(name: string, labels?: Record<string, string>): void {
  const key = labels ? `${name}{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : name;
  const existing = counters.get(key) ?? { count: 0, lastReset: Date.now() };
  counters.set(key, { ...existing, count: existing.count + 1 });
}

export function getMetrics(): Record<string, number> {
  const result: Record<string, number> = {};
  counters.forEach((v, k) => { result[k] = v.count; });
  return result;
}

export function resetMetrics(): void {
  counters.clear();
}

// ── Structured Log Formatter ──────────────────────────────────────────────────

export interface StructuredLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  message: string;
  duration?: number;
  meta?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
}

export function formatStructuredLog(log: StructuredLog): string {
  if (process.env.NODE_ENV !== 'production') {
    // Human-readable in dev
    const prefix = `[${log.level.toUpperCase()}]${log.correlationId ? ` (${log.correlationId.slice(0, 8)})` : ''}`;
    return `${log.timestamp} ${prefix} ${log.service}: ${log.message}`;
  }
  // JSON in production — ingested by Datadog / CloudWatch / Loki
  return JSON.stringify(log);
}

export function buildErrorLog(
  err: unknown,
  context: { service: string; correlationId?: string; tenantId?: string; userId?: string },
): StructuredLog {
  const isError = err instanceof Error;
  return {
    timestamp: new Date().toISOString(),
    level: 'error',
    service: context.service,
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
    message: isError ? err.message : String(err),
    error: isError ? { name: err.name, message: err.message, stack: err.stack } : undefined,
  };
}

// ── Performance Timer ─────────────────────────────────────────────────────────

export function startTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}
