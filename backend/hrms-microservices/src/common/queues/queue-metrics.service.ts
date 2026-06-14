import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * QUEUE METRICS SERVICE
 *
 * prom-client based metrics for all BullMQ queue operations.
 * Surfaces at GET /metrics via MetricsController.
 *
 * ── Metrics exposed ───────────────────────────────────────────────────────────
 *
 *  queue_jobs_total{queue, job_name, status}           Counter
 *    Total jobs processed, labelled by completion status:
 *    'completed' | 'failed' | 'skipped_duplicate' | 'final_failure'
 *
 *  queue_job_duration_ms{queue, job_name}              Histogram (ms)
 *    Processing time distribution per queue+job combination.
 *    Buckets: 100ms, 250ms, 500ms, 1s, 2s, 5s, 10s, 30s, 60s, +Inf
 *
 *  queue_dlq_depth{queue}                              Gauge
 *    Current count of unresolved dead letters per queue.
 *    Queried from `queue_dead_letters` at scrape time.
 *
 *  queue_idempotency_skip_total{queue}                 Counter
 *    Jobs skipped due to duplicate idempotency key detection.
 *    High values indicate retry storms or duplicate producers.
 *
 *  projection_lag_seconds{domain}                      Gauge
 *    Seconds since last successful projection rebuild per analytics domain.
 *    > 300s (5 min) indicates projection staleness.
 *
 *  projection_stale_total{domain}                      Counter
 *    Total times a domain projection was marked stale.
 *
 *  analytics_cache_operations_total{operation}         Counter
 *    Cache hits and misses from AnalyticsCacheService.
 *    operation: 'hit' | 'miss' | 'invalidate'
 *
 * ── Design ────────────────────────────────────────────────────────────────────
 *  Uses prom-client (already in package.json) for real histogram support.
 *  Gracefully falls back to in-memory counters if prom-client fails to import.
 */
@Injectable()
export class QueueMetricsService implements OnModuleInit {
  private readonly logger = new Logger(QueueMetricsService.name);

  // prom-client types (loaded dynamically to avoid hard dep)
  private registry: any = null;
  private jobsTotal: any = null;
  private jobDurationMs: any = null;
  private dlqDepth: any = null;
  private idempotencySkips: any = null;
  private projectionLag: any = null;
  private projectionStale: any = null;
  private cacheOps: any = null;

  // Fallback in-memory counters (used when prom-client unavailable)
  private readonly fallback = {
    jobsTotal:         new Map<string, number>(),
    jobDurationBuckets: new Map<string, number[]>(),
    dlqDepth:          new Map<string, number>(),
    idemSkips:         new Map<string, number>(),
    projLag:           new Map<string, number>(),
    projStale:         new Map<string, number>(),
    cacheOps:          new Map<string, number>(),
  };

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      const client = await import('prom-client');
      this.registry = new client.Registry();

      this.jobsTotal = new client.Counter({
        name: 'queue_jobs_total',
        help: 'Total BullMQ jobs processed by status',
        labelNames: ['queue', 'job_name', 'status'],
        registers: [this.registry],
      });

      this.jobDurationMs = new client.Histogram({
        name: 'queue_job_duration_ms',
        help: 'BullMQ job processing duration in milliseconds',
        labelNames: ['queue', 'job_name'],
        buckets: [100, 250, 500, 1000, 2000, 5000, 10000, 30000, 60000],
        registers: [this.registry],
      });

      this.dlqDepth = new client.Gauge({
        name: 'queue_dlq_depth',
        help: 'Unresolved dead letter count per queue',
        labelNames: ['queue'],
        registers: [this.registry],
        async collect() {
          // Gauge.collect() is called at scrape time — see refreshDlqGauges()
        },
      });

      this.idempotencySkips = new client.Counter({
        name: 'queue_idempotency_skip_total',
        help: 'Jobs skipped due to duplicate idempotency key',
        labelNames: ['queue'],
        registers: [this.registry],
      });

      this.projectionLag = new client.Gauge({
        name: 'projection_lag_seconds',
        help: 'Seconds since last successful projection rebuild per analytics domain',
        labelNames: ['domain'],
        registers: [this.registry],
      });

      this.projectionStale = new client.Counter({
        name: 'projection_stale_total',
        help: 'Total domain projection staleness events',
        labelNames: ['domain'],
        registers: [this.registry],
      });

      this.cacheOps = new client.Counter({
        name: 'analytics_cache_operations_total',
        help: 'Analytics cache operation counts',
        labelNames: ['operation'],
        registers: [this.registry],
      });

      this.logger.log('[QueueMetrics] prom-client initialized — full histogram support active');
    } catch {
      this.logger.warn('[QueueMetrics] prom-client unavailable — falling back to in-memory counters');
    }
  }

  // ── Job Lifecycle Hooks (called by processors) ────────────────────────────

  recordJobCompleted(queue: string, jobName: string, durationMs: number): void {
    if (this.jobsTotal) {
      this.jobsTotal.inc({ queue, job_name: jobName, status: 'completed' });
      this.jobDurationMs.observe({ queue, job_name: jobName }, durationMs);
    } else {
      this.fbIncr(this.fallback.jobsTotal, `${queue}:${jobName}:completed`);
    }
  }

  recordJobFailed(queue: string, jobName: string, isFinal: boolean): void {
    const status = isFinal ? 'final_failure' : 'failed';
    if (this.jobsTotal) {
      this.jobsTotal.inc({ queue, job_name: jobName, status });
    } else {
      this.fbIncr(this.fallback.jobsTotal, `${queue}:${jobName}:${status}`);
    }
  }

  recordIdempotencySkip(queue: string): void {
    if (this.idempotencySkips) {
      this.idempotencySkips.inc({ queue });
    } else {
      this.fbIncr(this.fallback.idemSkips, queue);
    }
  }

  // ── Projection Metrics ────────────────────────────────────────────────────

  recordProjectionStale(domain: string): void {
    if (this.projectionStale) {
      this.projectionStale.inc({ domain });
    } else {
      this.fbIncr(this.fallback.projStale, domain);
    }
  }

  setProjectionLag(domain: string, lagSeconds: number): void {
    if (this.projectionLag) {
      this.projectionLag.set({ domain }, lagSeconds);
    } else {
      this.fallback.projLag.set(domain, lagSeconds);
    }
  }

  // ── Cache Metrics ─────────────────────────────────────────────────────────

  recordCacheOperation(operation: 'hit' | 'miss' | 'invalidate'): void {
    if (this.cacheOps) {
      this.cacheOps.inc({ operation });
    } else {
      this.fbIncr(this.fallback.cacheOps, operation);
    }
  }

  // ── DLQ Depth (called during metrics scrape) ──────────────────────────────

  async refreshDlqDepth(queues: string[]): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    try {
      const rows: Array<{ queue_name: string; cnt: string }> = await this.ds.query(
        `SELECT queue_name, COUNT(*) AS cnt
         FROM queue_dead_letters
         WHERE replayed_at IS NULL
         GROUP BY queue_name`,
      );
      for (const row of rows) {
        result[row.queue_name] = parseInt(row.cnt, 10);
        if (this.dlqDepth) {
          this.dlqDepth.set({ queue: row.queue_name }, parseInt(row.cnt, 10));
        }
      }
      // Zero-out queues with no DLQ entries
      for (const q of queues) {
        if (!result[q]) {
          result[q] = 0;
          if (this.dlqDepth) this.dlqDepth.set({ queue: q }, 0);
        }
      }
    } catch (err) {
      this.logger.warn(`[QueueMetrics] DLQ depth query failed: ${String(err)}`);
    }
    return result;
  }

  // ── Prometheus text output ────────────────────────────────────────────────

  async getPrometheusOutput(): Promise<string> {
    if (this.registry) {
      return this.registry.metrics();
    }
    // Fallback: emit basic counter lines
    const lines: string[] = ['# HELP queue_jobs_total BullMQ job totals (fallback)', '# TYPE queue_jobs_total counter'];
    this.fallback.jobsTotal.forEach((v, k) => {
      const [queue, job_name, status] = k.split(':');
      lines.push(`queue_jobs_total{queue="${queue}",job_name="${job_name}",status="${status}"} ${v}`);
    });
    return lines.join('\n') + '\n';
  }

  // ── Snapshot for Frontend ─────────────────────────────────────────────────

  async getQueueSnapshot(): Promise<{
    queues: Array<{ name: string; dlqDepth: number }>;
    totalJobsProcessed: number;
    totalFinalFailures: number;
  }> {
    const dlqMap = await this.refreshDlqDepth([
      'ai-jobs', 'analytics', 'payroll', 'notifications', 'governance',
    ]);
    let totalJobs = 0;
    let totalFails = 0;
    this.fallback.jobsTotal.forEach((v, k) => {
      totalJobs += v;
      if (k.includes(':final_failure')) totalFails += v;
    });
    return {
      queues: Object.entries(dlqMap).map(([name, dlqDepth]) => ({ name, dlqDepth })),
      totalJobsProcessed: totalJobs,
      totalFinalFailures: totalFails,
    };
  }

  // ── Fallback helper ───────────────────────────────────────────────────────

  private fbIncr(map: Map<string, number>, key: string): void {
    map.set(key, (map.get(key) ?? 0) + 1);
  }
}
