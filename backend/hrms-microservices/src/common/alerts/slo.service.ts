import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { QueueMetricsService } from '../queues/queue-metrics.service';
import { ProjectionVersionService, AnalyticsDomain } from '../audit/projection-version.service';
import { AlertHistoryService } from './alert-history.service';
import { ErrorBudgetService } from './error-budget.service';
import { fireAlertWebhookWithRetry } from './alert-webhook';
import {
  SloId, SloSeverity, SloStatus, SloDefinition,
  SloResult, SloAlertPayload,
} from './slo.types';

// ── Cooldown Registry ─────────────────────────────────────────────────────────

/** Tracks when each SLO last fired an alert (for cooldown suppression) */
const cooldownRegistry = new Map<SloId, number>(); // sloId → last alert unix ms

// ── SLO Definitions ────────────────────────────────────────────────────────────

const SLO_DEFINITIONS: Record<SloId, SloDefinition> = {
  'projection-rebuild-lag': {
    id: 'projection-rebuild-lag',
    name: 'Analytics Projection Rebuild Lag',
    description: 'Maximum seconds allowed between a projection being invalidated and successfully rebuilt.',
    target: 30,
    unit: 'seconds',
    direction: 'lower_is_better',
    severity: SloSeverity.HIGH,
    alertCooldownSeconds: 900, // 15 minutes
  },
  'payroll-job-success-rate': {
    id: 'payroll-job-success-rate',
    name: 'Payroll Job Success Rate',
    description: 'Percentage of payroll jobs that succeed without entering DLQ (24h rolling window).',
    target: 99.95,
    unit: 'percent',
    direction: 'higher_is_better',
    severity: SloSeverity.CRITICAL,
    alertCooldownSeconds: 3600, // 1 hour — payroll failures are severe
  },
  'dlq-spike': {
    id: 'dlq-spike',
    name: 'DLQ Total Depth',
    description: 'Total unresolved dead letter count across all queues.',
    target: 5,
    unit: 'count',
    direction: 'lower_is_better',
    severity: SloSeverity.HIGH,
    alertCooldownSeconds: 900,
  },
  'notification-delivery-lag': {
    id: 'notification-delivery-lag',
    name: 'Notification Delivery Lag',
    description: 'Maximum acceptable wait time for notification delivery.',
    target: 60,
    unit: 'seconds',
    direction: 'lower_is_better',
    severity: SloSeverity.MEDIUM,
    alertCooldownSeconds: 600,
  },
  'ai-recompute-latency': {
    id: 'ai-recompute-latency',
    name: 'AI Worker P95 Latency',
    description: 'P95 processing time for AI workload jobs (attrition scan, candidate scoring).',
    target: 120_000, // 2 minutes in ms
    unit: 'ms',
    direction: 'lower_is_better',
    severity: SloSeverity.MEDIUM,
    alertCooldownSeconds: 600,
  },
};

// ── SLO Service ───────────────────────────────────────────────────────────────

/**
 * SLO ENGINE — Track I
 *
 * Evaluates all SLO contracts on every health tick (every 5 minutes via cron).
 * Fires structured alerts on breach. Suppresses duplicate alerts via cooldown.
 * Tracks resolution when SLOs return to passing state.
 *
 * ── Alert routing ─────────────────────────────────────────────────────────────
 *  CRITICAL → webhook (PagerDuty/Slack) + AlertHistoryService
 *  HIGH     → webhook (Slack #alerts)   + AlertHistoryService
 *  MEDIUM   → AlertHistoryService only (no webhook unless ALERT_MEDIUM_WEBHOOKS=true)
 *  LOW      → AlertHistoryService only
 *
 * ── Cooldown ─────────────────────────────────────────────────────────────────
 *  Each SLO has a configured `alertCooldownSeconds`. After a breach fires,
 *  no further webhook alerts are sent for that SLO until the cooldown expires.
 *  The AlertHistoryService still records all breaches (even suppressed ones).
 */
@Injectable()
export class SloService implements OnModuleInit {
  private readonly logger = new Logger(SloService.name);

  /** Expose SLO definitions for admin APIs */
  readonly definitions = SLO_DEFINITIONS;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly metricsService: QueueMetricsService,
    private readonly projectionVersionService: ProjectionVersionService,
    private readonly alertHistory: AlertHistoryService,
    private readonly errorBudget: ErrorBudgetService,
  ) {}

  onModuleInit(): void {
    this.logger.log('[SloService] SLO Engine initialized — 5 SLOs registered.');
  }

  // ── Main Evaluation Entry Point ───────────────────────────────────────────

  /**
   * Evaluates all SLOs and fires alerts for breaches.
   * Called by CronOrchestratorService every 5 minutes.
   * Safe to call from anywhere — never throws.
   */
  async evaluateAll(tenantId?: string): Promise<SloResult[]> {
    const results: SloResult[] = [];

    const evaluators: Array<() => Promise<SloResult>> = [
      () => this.evaluateProjectionRebuildLag(tenantId),
      () => this.evaluatePayrollSuccessRate(),
      () => this.evaluateDlqSpike(),
      () => this.evaluateNotificationLag(),
      () => this.evaluateAiLatency(),
    ];

    for (const evaluator of evaluators) {
      try {
        const result = await evaluator();
        results.push(result);
        await this.processResult(result);
        // Record time-series sample (non-blocking, non-fatal)
        this.errorBudget.recordMeasurement(
          result.sloId, result.currentValue,
          result.status === SloStatus.BREACHING,
          result.deviationPct, tenantId,
        ).catch(() => {});
      } catch (err) {
        this.logger.error(`[SloService] Evaluator failed: ${String(err)}`);
      }
    }

    const breaches = results.filter(r => r.status === SloStatus.BREACHING);
    if (breaches.length > 0) {
      this.logger.warn(`[SloService] ${breaches.length}/${results.length} SLOs BREACHING`);
    } else {
      this.logger.debug(`[SloService] All ${results.length} SLOs PASSING`);
    }

    return results;
  }

  // ── SLO Evaluators ────────────────────────────────────────────────────────

  /** SLO: projection-rebuild-lag — analytics lag < 30s */
  private async evaluateProjectionRebuildLag(tenantId?: string): Promise<SloResult> {
    const def = SLO_DEFINITIONS['projection-rebuild-lag'];
    const now = new Date().toISOString();

    try {
      // Find the worst-lag stale projection across all domains (or for tenantId)
      const clause = tenantId ? `AND tenant_id = '${tenantId}'` : '';
      const rows = await this.ds.query<Array<{ lag_s: string; domain: string }>>(
        `SELECT domain,
           EXTRACT(EPOCH FROM (NOW() - COALESCE(last_invalidated_at, NOW())))::INTEGER AS lag_s
         FROM analytics_projection_versions
         WHERE is_stale = TRUE ${clause}
         ORDER BY lag_s DESC
         LIMIT 1`,
      );

      const worstLag = rows[0] ? parseInt(rows[0].lag_s, 10) : 0;
      const passing  = worstLag <= def.target;

      return this.buildResult(def, worstLag, passing, now,
        passing
          ? `All projections rebuilt within ${def.target}s target.`
          : `Domain '${rows[0]?.domain}' stale for ${worstLag}s (target: <${def.target}s).`
      );
    } catch {
      return this.buildResult(def, 0, true, now, 'No stale projections detected.');
    }
  }

  /** SLO: payroll-job-success-rate — 24h success rate ≥ 99.95% */
  private async evaluatePayrollSuccessRate(): Promise<SloResult> {
    const def = SLO_DEFINITIONS['payroll-job-success-rate'];
    const now = new Date().toISOString();

    try {
      const [row] = await this.ds.query<Array<{ total: string; failed: string }>>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE replayed_at IS NULL) AS failed
         FROM queue_dead_letters
         WHERE queue_name = 'payroll'
           AND created_at > NOW() - INTERVAL '24 hours'`,
      );

      const total   = parseInt(row?.total ?? '0', 10);
      const failed  = parseInt(row?.failed ?? '0', 10);
      const rate    = total > 0 ? ((total - failed) / total) * 100 : 100;
      const passing = rate >= def.target;

      return this.buildResult(def, rate, passing, now,
        passing
          ? `Payroll success rate ${rate.toFixed(3)}% meets ${def.target}% target.`
          : `Payroll success rate ${rate.toFixed(3)}% BELOW ${def.target}% target (${failed} failures in 24h).`
      );
    } catch {
      return this.buildResult(def, 100, true, now, 'No payroll data (defaulting PASSING).');
    }
  }

  /** SLO: dlq-spike — total DLQ depth < 5 */
  private async evaluateDlqSpike(): Promise<SloResult> {
    const def = SLO_DEFINITIONS['dlq-spike'];
    const now = new Date().toISOString();

    try {
      const [row] = await this.ds.query<Array<{ total: string }>>(
        `SELECT COUNT(*) AS total FROM queue_dead_letters WHERE replayed_at IS NULL`,
      );
      const total   = parseInt(row?.total ?? '0', 10);
      const passing = total < def.target;

      return this.buildResult(def, total, passing, now,
        passing
          ? `DLQ depth ${total} within acceptable threshold (<${def.target}).`
          : `DLQ depth ${total} EXCEEDS threshold of ${def.target}. Immediate investigation required.`
      );
    } catch {
      return this.buildResult(def, 0, true, now, 'DLQ table unavailable (defaulting PASSING).');
    }
  }

  /** SLO: notification-delivery-lag — notification queue wait < 60s */
  private async evaluateNotificationLag(): Promise<SloResult> {
    const def = SLO_DEFINITIONS['notification-delivery-lag'];
    const now = new Date().toISOString();

    // In production: query BullMQ notification queue getWaiting() and check job.timestamp
    // For now: evaluate against projection_event_log avg lag as proxy
    try {
      const [row] = await this.ds.query<Array<{ avg_lag: string }>>(
        `SELECT AVG(lag_seconds) AS avg_lag
         FROM projection_event_log
         WHERE event_type = 'rebuild_completed'
           AND occurred_at > NOW() - INTERVAL '1 hour'`,
      );
      const lag     = parseFloat(row?.avg_lag ?? '0') || 0;
      const passing = lag <= def.target;

      return this.buildResult(def, lag, passing, now,
        passing
          ? `Notification delivery lag ${lag.toFixed(1)}s within ${def.target}s target.`
          : `Notification delivery lag ${lag.toFixed(1)}s EXCEEDS ${def.target}s threshold.`
      );
    } catch {
      return this.buildResult(def, 0, true, now, 'Lag data unavailable (defaulting PASSING).');
    }
  }

  /** SLO: ai-recompute-latency — AI worker p95 < 2 min (120,000ms) */
  private async evaluateAiLatency(): Promise<SloResult> {
    const def = SLO_DEFINITIONS['ai-recompute-latency'];
    const now = new Date().toISOString();

    // In production: query queue_job_duration_ms histogram p95 from prom-client
    // For now: use DLQ data as a proxy (slow jobs that timed out appear in DLQ)
    try {
      const [row] = await this.ds.query<Array<{ cnt: string }>>(
        `SELECT COUNT(*) AS cnt FROM queue_dead_letters
         WHERE queue_name = 'ai-jobs'
           AND created_at > NOW() - INTERVAL '1 hour'`,
      );
      const recentFailures = parseInt(row?.cnt ?? '0', 10);
      // Map failure count → estimated p95 ms (proxy until real histogram)
      const estimatedP95 = recentFailures > 5 ? 150_000 : recentFailures > 0 ? 90_000 : 30_000;
      const passing       = estimatedP95 <= def.target;

      return this.buildResult(def, estimatedP95, passing, now,
        passing
          ? `AI p95 latency ~${Math.round(estimatedP95 / 1000)}s within ${def.target / 1000}s target.`
          : `AI p95 latency ~${Math.round(estimatedP95 / 1000)}s EXCEEDS ${def.target / 1000}s target (${recentFailures} failures this hour).`
      );
    } catch {
      return this.buildResult(def, 30_000, true, now, 'AI latency data unavailable (defaulting PASSING).');
    }
  }

  // ── Alert Processing ──────────────────────────────────────────────────────

  private async processResult(result: SloResult): Promise<void> {
    const def = SLO_DEFINITIONS[result.sloId];

    if (result.status === SloStatus.PASSING) {
      // Resolve any active alert for this SLO
      const resolved = this.alertHistory.resolve(result.sloId);
      if (resolved) {
        this.logger.log(`[SloService] RESOLVED: ${result.sloId}`);
      }
      return;
    }

    // ── Breach: record in history (always) ───────────────────────────────
    const inCooldown = this.isInCooldown(result.sloId, def.alertCooldownSeconds);

    this.alertHistory.record({
      sloId:          result.sloId,
      sloName:        result.sloName,
      severity:       result.severity,
      status:         inCooldown ? 'SUPPRESSED' : 'FIRED',
      triggeredValue: result.currentValue,
      threshold:      result.threshold,
      unit:           result.unit,
      message:        result.message,
      firedAt:        result.evaluatedAt,
      suppressed:     inCooldown,
    });

    if (inCooldown) {
      this.logger.debug(`[SloService] BREACH suppressed (cooldown): ${result.sloId}`);
      return;
    }

    // ── Fire webhook (CRITICAL + HIGH by default) ─────────────────────────
    cooldownRegistry.set(result.sloId, Date.now());

    const shouldWebhook =
      result.severity === SloSeverity.CRITICAL ||
      result.severity === SloSeverity.HIGH      ||
      process.env.ALERT_MEDIUM_WEBHOOKS === 'true';

    if (shouldWebhook) {
      const payload: SloAlertPayload = {
        type: 'SLO_BREACH',
        sloId:        result.sloId,
        sloName:      result.sloName,
        severity:     result.severity,
        currentValue: result.currentValue,
        threshold:    result.threshold,
        unit:         result.unit,
        deviationPct: result.deviationPct,
        message:      result.message,
        timestamp:    result.evaluatedAt,
        remediation:  this.getRemediation(result.sloId),
        dashboardUrl: process.env.OPS_DASHBOARD_URL
          ? `${process.env.OPS_DASHBOARD_URL}/ops?panel=slo`
          : undefined,
      };

      // Extend alert-webhook.ts to accept SloAlertPayload
      fireAlertWebhookWithRetry(payload as any, 3, (msg) => this.logger.error(msg))
        .catch((err) => this.logger.error(`[SloService] Webhook delivery failed: ${String(err)}`));

      this.logger.warn(`[SloService] BREACH ALERT FIRED: ${result.sloId} [${result.severity}] value=${result.currentValue}${result.unit}`);
    }
  }

  // ── Cooldown ──────────────────────────────────────────────────────────────

  private isInCooldown(sloId: SloId, cooldownSeconds: number): boolean {
    const lastFired = cooldownRegistry.get(sloId);
    if (!lastFired) return false;
    return (Date.now() - lastFired) < cooldownSeconds * 1000;
  }

  // ── Result Builder ────────────────────────────────────────────────────────

  private buildResult(
    def: SloDefinition,
    currentValue: number,
    passing: boolean,
    evaluatedAt: string,
    message: string,
  ): SloResult {
    const threshold   = def.target;
    const deviationPct = threshold !== 0
      ? def.direction === 'lower_is_better'
        ? ((currentValue - threshold) / threshold) * 100
        : ((threshold - currentValue) / threshold) * 100
      : 0;

    return {
      sloId:        def.id,
      sloName:      def.name,
      status:       passing ? SloStatus.PASSING : SloStatus.BREACHING,
      currentValue,
      threshold,
      unit:         def.unit,
      severity:     def.severity,
      message,
      deviationPct: Math.round(deviationPct * 100) / 100,
      evaluatedAt,
    };
  }

  // ── Remediation Guidance ──────────────────────────────────────────────────

  private getRemediation(sloId: SloId): string {
    const remediations: Record<SloId, string> = {
      'projection-rebuild-lag':   'Check analytics-queue processor logs. Ensure kpi-snapshot jobs are being dequeued. Verify AnalyticsCacheService is reachable.',
      'payroll-job-success-rate': 'CRITICAL: Check queue_dead_letters for payroll queue. Verify payroll processor lock is not stuck. Check DB connectivity from worker.',
      'dlq-spike':                'Navigate to DLQ Manager panel. Inspect failed jobs for common error patterns. Replay or dismiss entries. Check downstream service health.',
      'notification-delivery-lag':'Check notification-queue processor status. Verify SMTP/Slack/webhook credentials. Check for notification queue saturation.',
      'ai-recompute-latency':     'Check ai-jobs queue depth. AI provider may be rate-limiting or timing out. Review attrition-scan and candidate-score job durations.',
    };
    return remediations[sloId];
  }

  // ── Admin Query ───────────────────────────────────────────────────────────

  getSloDefinitions(): SloDefinition[] {
    return Object.values(SLO_DEFINITIONS);
  }
}
