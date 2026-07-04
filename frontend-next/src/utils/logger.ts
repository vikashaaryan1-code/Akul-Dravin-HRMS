/**
 * logger.ts — Structured logging utility for Akul Dravin HRMS frontend.
 *
 * Wraps console.* with:
 *  - Consistent JSON-structured output in production
 *  - Human-readable coloured output in development
 *  - Log level filtering via NEXT_PUBLIC_LOG_LEVEL env var
 *  - Optional correlation ID / request ID propagation
 *  - Sentry/OpenTelemetry hook points (no-op by default)
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('Employee loaded', { employeeId: 'E-001', tenantId: 'tenant-akul' });
 *   logger.error('Payroll fetch failed', error, { cycleId: 'PC-2026-04' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info:  '\x1b[32m', // green
  warn:  '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function getMinLevel(): LogLevel {
  const raw = (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_LOG_LEVEL : undefined) ?? 'info';
  return (['debug', 'info', 'warn', 'error'].includes(raw) ? raw : 'info') as LogLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[getMinLevel()];
}

function formatDev(level: LogLevel, message: string, context?: LogContext, error?: unknown): string {
  const ts = new Date().toTimeString().slice(0, 8);
  const tag = `[${level.toUpperCase().padEnd(5)}]`;
  const color = LEVEL_COLORS[level];
  const parts = [`${color}${ts} ${tag}${RESET} ${message}`];
  if (context && Object.keys(context).length > 0) {
    parts.push(JSON.stringify(context, null, 2));
  }
  if (error) {
    parts.push(error instanceof Error ? error.stack ?? error.message : String(error));
  }
  return parts.join('\n');
}

function formatProd(level: LogLevel, message: string, context?: LogContext, error?: unknown): string {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'akul-dravin-hrms-frontend',
    ...(context ?? {}),
    ...(error instanceof Error
      ? { errorName: error.name, errorMessage: error.message, errorStack: error.stack }
      : error
      ? { error: String(error) }
      : {}),
  });
}

// ── Hook points for external observability ────────────────────────────────────
// Replace these with real Sentry / OpenTelemetry calls in production.
type ObservabilityHooks = {
  onError?: (message: string, error: unknown, context?: LogContext) => void;
  onWarn?: (message: string, context?: LogContext) => void;
};

let hooks: ObservabilityHooks = {};

// ── Logger implementation ─────────────────────────────────────────────────────
const isDev = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

function log(level: LogLevel, message: string, errorOrContext?: unknown, context?: LogContext): void {
  if (!shouldLog(level)) return;

  // Disambiguate overloads
  let err: unknown;
  let ctx: LogContext | undefined;

  if (errorOrContext instanceof Error || (errorOrContext !== null && typeof errorOrContext !== 'object') || errorOrContext === null) {
    err = errorOrContext;
    ctx = context;
  } else if (errorOrContext && typeof errorOrContext === 'object' && !(errorOrContext instanceof Error)) {
    ctx = errorOrContext as LogContext;
    err = undefined;
  } else {
    err = errorOrContext;
    ctx = context;
  }

  const formatted = isDev
    ? formatDev(level, message, ctx, err)
    : formatProd(level, message, ctx, err);

  switch (level) {
    case 'debug': console.debug(formatted); break;
    case 'info':  console.info(formatted);  break;
    case 'warn':  console.warn(formatted);  break;
    case 'error': console.error(formatted); break;
  }

  // Fire observability hooks
  if (level === 'error' && hooks.onError) {
    hooks.onError(message, err, ctx);
  } else if (level === 'warn' && hooks.onWarn) {
    hooks.onWarn(message, ctx);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info:  (message: string, context?: LogContext) => log('info',  message, context),
  warn:  (message: string, context?: LogContext) => log('warn',  message, context),
  error: (message: string, error?: unknown, context?: LogContext) => log('error', message, error, context),

  /** Configure observability hooks (call once at app startup) */
  configure: (newHooks: ObservabilityHooks) => {
    hooks = { ...hooks, ...newHooks };
  },

  /** Create a child logger with pre-bound context */
  child: (baseContext: LogContext) => ({
    debug: (message: string, ctx?: LogContext) => log('debug', message, { ...baseContext, ...ctx }),
    info:  (message: string, ctx?: LogContext) => log('info',  message, { ...baseContext, ...ctx }),
    warn:  (message: string, ctx?: LogContext) => log('warn',  message, { ...baseContext, ...ctx }),
    error: (message: string, error?: unknown, ctx?: LogContext) => log('error', message, error, { ...baseContext, ...ctx }),
  }),
} as const;

export type Logger = typeof logger;
