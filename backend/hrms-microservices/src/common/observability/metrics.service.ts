import { Injectable, Logger } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import type { Counter, Histogram, Gauge } from 'prom-client';

/**
 * PROMETHEUS METRICS SERVICE
 *
 * Provides typed metric instruments used throughout the platform.
 * All metrics are namespaced under `hrms_` prefix.
 *
 * Exposed at: GET /metrics (plain text, Prometheus format)
 *
 * NOTE: metrics are registered via PrometheusModule.register() in app.module.ts
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectMetric('hrms_http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,

    @InjectMetric('hrms_http_request_duration_seconds')
    private readonly httpDurationHistogram: Histogram<string>,

    @InjectMetric('hrms_payroll_batches_total')
    private readonly payrollBatchesTotal: Counter<string>,

    @InjectMetric('hrms_active_employees_total')
    private readonly activeEmployeesGauge: Gauge<string>,

    @InjectMetric('hrms_leave_requests_total')
    private readonly leaveRequestsTotal: Counter<string>,

    @InjectMetric('hrms_ai_requests_total')
    private readonly aiRequestsTotal: Counter<string>,

    @InjectMetric('hrms_queue_jobs_total')
    private readonly queueJobsTotal: Counter<string>,
  ) {}

  // ─── HTTP ─────────────────────────────────────────────────────────────────

  recordHttpRequest(method: string, path: string, status: number, durationMs: number) {
    this.httpRequestsTotal.inc({ method, path, status: String(status) });
    this.httpDurationHistogram.observe(
      { method, path, status: String(status) },
      durationMs / 1000,
    );
  }

  // ─── Payroll ──────────────────────────────────────────────────────────────

  recordPayrollBatch(tenantId: string, status: 'initiated' | 'completed' | 'failed') {
    this.payrollBatchesTotal.inc({ tenant_id: tenantId, status });
  }

  // ─── Employees ────────────────────────────────────────────────────────────

  setActiveEmployees(tenantId: string, count: number) {
    this.activeEmployeesGauge.set({ tenant_id: tenantId }, count);
  }

  // ─── Leave ───────────────────────────────────────────────────────────────

  recordLeaveRequest(tenantId: string, status: 'pending' | 'approved' | 'rejected') {
    this.leaveRequestsTotal.inc({ tenant_id: tenantId, status });
  }

  // ─── AI Engine ────────────────────────────────────────────────────────────

  recordAiRequest(provider: string, type: string) {
    this.aiRequestsTotal.inc({ provider, type });
  }

  // ─── Queues ───────────────────────────────────────────────────────────────

  recordQueueJob(queue: string, status: 'completed' | 'failed' | 'delayed') {
    this.queueJobsTotal.inc({ queue, status });
  }
}

// ─── Metric Definitions (register in PrometheusModule.register()) ─────────────

export const HRMS_METRICS = [
  {
    name: 'hrms_http_requests_total',
    help: 'Total HTTP requests handled by HRMS API',
    type: 'Counter' as const,
    labelNames: ['method', 'path', 'status'],
  },
  {
    name: 'hrms_http_request_duration_seconds',
    help: 'HTTP request duration in seconds (p50, p95, p99)',
    type: 'Histogram' as const,
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  },
  {
    name: 'hrms_payroll_batches_total',
    help: 'Total payroll batches by tenant and status',
    type: 'Counter' as const,
    labelNames: ['tenant_id', 'status'],
  },
  {
    name: 'hrms_active_employees_total',
    help: 'Current count of active employees per tenant',
    type: 'Gauge' as const,
    labelNames: ['tenant_id'],
  },
  {
    name: 'hrms_leave_requests_total',
    help: 'Total leave requests by tenant and status',
    type: 'Counter' as const,
    labelNames: ['tenant_id', 'status'],
  },
  {
    name: 'hrms_ai_requests_total',
    help: 'Total AI API calls by provider and type',
    type: 'Counter' as const,
    labelNames: ['provider', 'type'],
  },
  {
    name: 'hrms_queue_jobs_total',
    help: 'Total BullMQ job executions by queue and status',
    type: 'Counter' as const,
    labelNames: ['queue', 'status'],
  },
];
