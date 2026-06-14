import * as promClient from 'prom-client';

/**
 * MetricsRegistry — single source of truth for all Prometheus metrics.
 *
 * Design:
 *  - One `Registry` per process (default singleton).
 *  - All metrics use the `hrms_` prefix to avoid collisions with node/prom defaults.
 *  - Labels are bounded enums — no tenant IDs, no dynamic strings.
 *    Cardinality ceiling: ~60 series (3 queues × 4 states × 5 metrics).
 *
 * Usage:
 *   import { metricsRegistry } from './metrics.registry';
 *   metricsRegistry.jobsTotal.inc({ queue: 'payroll', status: 'completed' });
 */
export const metricsRegistry = new promClient.Registry();

// ── Collect default Node.js process metrics (memory, event loop, GC) ─────────
promClient.collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'hrms_node_',
});

// ─────────────────────────────────────────────────────────────────────────────
// Job lifecycle counters
// ─────────────────────────────────────────────────────────────────────────────

/**
 * hrms_jobs_total{queue, status}
 *   status: 'started' | 'completed' | 'failed' | 'retried'
 */
export const jobsTotal = new promClient.Counter({
  name: 'hrms_jobs_total',
  help: 'Total number of BullMQ jobs by queue and lifecycle status',
  labelNames: ['queue', 'status'] as const,
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// Job duration histogram
// ─────────────────────────────────────────────────────────────────────────────

/**
 * hrms_job_duration_seconds{queue}
 *   Buckets match expected processing times:
 *   - notifications: sub-second
 *   - rollout stages: 0.5–5s each
 *   - payroll batch: up to 30s for large tenants
 */
export const jobDurationSeconds = new promClient.Histogram({
  name: 'hrms_job_duration_seconds',
  help: 'BullMQ job processing duration in seconds',
  labelNames: ['queue'] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// Queue depth gauge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * hrms_queue_depth{queue, state}
 *   state: 'waiting' | 'active' | 'failed' | 'completed' | 'delayed'
 *   Updated on every /internal/metrics scrape via QueueDepthService.syncGauges()
 */
export const queueDepth = new promClient.Gauge({
  name: 'hrms_queue_depth',
  help: 'Current BullMQ job count by queue and state',
  labelNames: ['queue', 'state'] as const,
  registers: [metricsRegistry],
});

// ─────────────────────────────────────────────────────────────────────────────
// Export all metric objects together for convenience
// ─────────────────────────────────────────────────────────────────────────────

export const metrics = {
  registry:           metricsRegistry,
  jobsTotal,
  jobDurationSeconds,
  queueDepth,
} as const;
