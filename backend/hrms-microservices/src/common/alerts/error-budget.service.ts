import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SloId, SloWindow, SloDefinition,
  ErrorBudget, BurnRate, DualWindowBurnAlert, SloSeverity,
} from './slo.types';
import { fireAlertWebhookWithRetry } from './alert-webhook';
import { AlertHistoryService } from './alert-history.service';

// ── Window configuration ──────────────────────────────────────────────────────

const WINDOW_MINUTES: Record<SloWindow, number> = {
  '1h':  60,
  '6h':  360,
  '24h': 1440,
  '7d':  10080,
  '30d': 43200,
};

/**
 * Fast-burn: budget consumed at a rate that exhausts it in < 2 days.
 * Computed as: window_minutes / (2_days_minutes) / error_rate.
 * For a 99.95% SLO on 1h window: 60 / 2880 / 0.0005 = 41.67 → ≈14x is standard.
 *
 * Slow-burn: exhausts in < 7 days.
 */
const FAST_BURN_DAYS = 2;
const SLOW_BURN_DAYS = 7;

// ── Cooldown for burn rate alerts (separate from point-in-time) ───────────────

const burnRateCooldown = new Map<string, number>(); // `${sloId}:${alertClass}` → last fired ms

// ── Error Budget Service ──────────────────────────────────────────────────────

/**
 * ERROR BUDGET SERVICE — Track M
 *
 * Computes error budget consumption and burn rates from the `slo_measurements`
 * time-series table populated by SloService after each evaluation tick.
 *
 * ── Core concepts ─────────────────────────────────────────────────────────────
 *
 *  error_budget = (1 - slo_target) × window_duration
 *    The total allowed failure time before the SLO is broken.
 *
 *  burn_rate = actual_violation_rate / (1 - slo_target)
 *    A multiplier: 1.0 = exactly sustainable pace, 14.0 = exhausting budget
 *    14× faster than sustainable (Google SRE fast-burn threshold).
 *
 *  fast_burn = burn_rate ≥ windowMinutes / (FAST_BURN_DAYS × 1440) / errorRate
 *    Means: budget exhausts within 2 days at this rate → immediate page.
 *
 *  slow_burn = burn_rate ≥ windowMinutes / (SLOW_BURN_DAYS × 1440) / errorRate
 *    Means: budget exhausts within 7 days → investigation alert.
 *
 * ── Forecast ──────────────────────────────────────────────────────────────────
 *  forecastExhaustionMin = budgetRemainingMin / (burnRate × errorBudgetPerMin)
 *    Answers: "at current rate, when does the budget run out?"
 *
 * ── SLO target → error rate mapping ──────────────────────────────────────────
 *  'projection-rebuild-lag':   treated as 95%  SLO → 5%   error rate  (time-based)
 *  'payroll-job-success-rate': 99.95%          SLO → 0.05% error rate (count-based)
 *  'dlq-spike':                threshold=5     → 0.1%  error rate  (normalized)
 *  'notification-delivery-lag': 99%            SLO → 1%    error rate (time-based)
 *  'ai-recompute-latency':     95%             SLO → 5%    error rate (time-based)
 */
@Injectable()
export class ErrorBudgetService {
  private readonly logger = new Logger(ErrorBudgetService.name);

  // Effective error rates per SLO (1 - target as fraction)
  private readonly ERROR_RATES: Record<SloId, number> = {
    'projection-rebuild-lag':    0.05,   // 95% of projections rebuilt within 30s
    'payroll-job-success-rate':  0.0005, // 99.95% success
    'dlq-spike':                 0.001,  // normalized: DLQ threshold as error proxy
    'notification-delivery-lag': 0.01,   // 99% delivered within 60s
    'ai-recompute-latency':      0.05,   // 95% within 2 min
  };

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly alertHistory: AlertHistoryService,
  ) {}

  // ── Error Budget Computation ──────────────────────────────────────────────

  async computeErrorBudget(sloId: SloId, window: SloWindow, sloName: string): Promise<ErrorBudget> {
    const windowMin   = WINDOW_MINUTES[window];
    const errorRate   = this.ERROR_RATES[sloId];
    const budgetTotal = windowMin * errorRate; // total allowed error-minutes
    const now         = new Date().toISOString();

    try {
      // Count breach samples in the window
      const intervalSql = this.windowToInterval(window);
      const [row] = await this.ds.query<Array<{ breach_count: string; total_count: string }>>(
        `SELECT
           COUNT(*) FILTER (WHERE is_breach = TRUE) AS breach_count,
           COUNT(*)                                  AS total_count
         FROM slo_measurements
         WHERE slo_id = $1
           AND sampled_at > NOW() - INTERVAL '${intervalSql}'`,
        [sloId],
      );

      const breachCount = parseInt(row?.breach_count ?? '0', 10);
      const totalCount  = parseInt(row?.total_count  ?? '0', 10);

      // Each sample represents 5 minutes (cron interval)
      const breachMinutes    = breachCount * 5;
      const budgetUsed       = Math.min(breachMinutes, budgetTotal * 3); // cap at 3× for display
      const budgetRemaining  = budgetTotal - budgetUsed;
      const budgetConsumedPct = budgetTotal > 0 ? budgetUsed / budgetTotal : 0;
      const overdraftMin     = Math.max(0, budgetUsed - budgetTotal);

      return {
        sloId, sloName, window, windowMinutes: windowMin,
        budgetTotalMin: Math.round(budgetTotal * 100) / 100,
        budgetUsedMin:  Math.round(budgetUsed  * 100) / 100,
        budgetRemainingMin: Math.round(budgetRemaining * 100) / 100,
        budgetConsumedPct:  Math.round(budgetConsumedPct * 10000) / 10000,
        overdraftMin:   Math.round(overdraftMin * 100) / 100,
        computedAt: now,
      };
    } catch (err) {
      this.logger.warn(`[ErrorBudget] computeErrorBudget failed for ${sloId}/${window}: ${String(err)}`);
      return {
        sloId, sloName, window, windowMinutes: windowMin,
        budgetTotalMin: budgetTotal, budgetUsedMin: 0,
        budgetRemainingMin: budgetTotal, budgetConsumedPct: 0, overdraftMin: 0,
        computedAt: now,
      };
    }
  }

  // ── Burn Rate Computation ─────────────────────────────────────────────────

  async computeBurnRate(sloId: SloId, window: SloWindow): Promise<BurnRate> {
    const windowMin   = WINDOW_MINUTES[window];
    const errorRate   = this.ERROR_RATES[sloId];
    const now         = new Date().toISOString();
    const intervalSql = this.windowToInterval(window);

    // Thresholds (minutes of budget to exhaust in N days at sustained rate)
    const fastBurnThreshold = (windowMin / (FAST_BURN_DAYS * 1440)) / errorRate;
    const slowBurnThreshold = (windowMin / (SLOW_BURN_DAYS * 1440)) / errorRate;

    try {
      const [current, previous] = await Promise.all([
        this.ds.query<Array<{ breach_count: string; total_count: string }>>(
          `SELECT
             COUNT(*) FILTER (WHERE is_breach = TRUE) AS breach_count,
             COUNT(*) AS total_count
           FROM slo_measurements
           WHERE slo_id = $1 AND sampled_at > NOW() - INTERVAL '${intervalSql}'`,
          [sloId],
        ),
        // Previous equivalent window (for trend)
        this.ds.query<Array<{ breach_count: string; total_count: string }>>(
          `SELECT
             COUNT(*) FILTER (WHERE is_breach = TRUE) AS breach_count,
             COUNT(*) AS total_count
           FROM slo_measurements
           WHERE slo_id = $1
             AND sampled_at BETWEEN NOW() - INTERVAL '${this.doubleInterval(window)}' AND NOW() - INTERVAL '${intervalSql}'`,
          [sloId],
        ),
      ]);

      const breachCount  = parseInt(current[0]?.breach_count ?? '0', 10);
      const sampleCount  = parseInt(current[0]?.total_count  ?? '0', 10);
      const prevBreaches = parseInt(previous[0]?.breach_count ?? '0', 10);
      const prevSamples  = parseInt(previous[0]?.total_count  ?? '1', 10);

      const violationRate = sampleCount > 0 ? breachCount / sampleCount : 0;
      const burnRate      = errorRate > 0    ? violationRate / errorRate  : 0;

      const prevViolationRate = prevSamples > 0 ? prevBreaches / prevSamples : 0;
      const trend = this.computeTrend(violationRate, prevViolationRate);

      // Forecast: minutes until budget exhaustion
      const budgetTotalMin    = windowMin * errorRate;
      const budgetUsedMin     = breachCount * 5;
      const budgetRemainingMin = budgetTotalMin - budgetUsedMin;
      const forecastExhaustionMin = burnRate > 1 && budgetRemainingMin > 0
        ? Math.round(budgetRemainingMin / (burnRate * errorRate * 5))
        : null;

      return {
        sloId, window,
        rate:             Math.round(burnRate * 100) / 100,
        violationCount:   breachCount,
        sampleCount,
        violationRate:    Math.round(violationRate * 10000) / 10000,
        isFastBurn:       burnRate >= fastBurnThreshold,
        isSlowBurn:       burnRate >= slowBurnThreshold && burnRate < fastBurnThreshold,
        fastBurnThreshold: Math.round(fastBurnThreshold * 100) / 100,
        slowBurnThreshold: Math.round(slowBurnThreshold * 100) / 100,
        forecastExhaustionMin,
        trend,
        computedAt: now,
      };
    } catch (err) {
      this.logger.warn(`[ErrorBudget] computeBurnRate failed for ${sloId}/${window}: ${String(err)}`);
      return {
        sloId, window, rate: 0, violationCount: 0, sampleCount: 0,
        violationRate: 0, isFastBurn: false, isSlowBurn: false,
        fastBurnThreshold, slowBurnThreshold,
        forecastExhaustionMin: null, trend: 'stable', computedAt: now,
      };
    }
  }

  // ── Full SLO Budget Report ────────────────────────────────────────────────

  /**
   * Computes error budget + burn rates across all windows for all SLOs.
   * Called by cron after the standard SLO evaluation tick.
   */
  async computeAllBudgets(
    sloDefinitions: Record<SloId, SloDefinition>,
  ): Promise<{ budgets: ErrorBudget[]; burnRates: BurnRate[] }> {
    const sloIds = Object.keys(sloDefinitions) as SloId[];
    const windows: SloWindow[] = ['1h', '6h', '24h', '7d'];

    const budgetPromises = sloIds.map(id =>
      this.computeErrorBudget(id, '30d', sloDefinitions[id].name),
    );
    const burnRatePromises = sloIds.flatMap(id =>
      windows.map(w => this.computeBurnRate(id, w)),
    );

    const [budgets, burnRates] = await Promise.all([
      Promise.all(budgetPromises),
      Promise.all(burnRatePromises),
    ]);

    // Persist snapshots + fire burn rate alerts
    await Promise.all([
      this.persistSnapshots(budgets, burnRates),
      this.fireBurnRateAlerts(burnRates, sloDefinitions),
    ]);

    return { budgets, burnRates };
  }

  // ── Dual-Window Burn Rate Alerts (Google SRE Workbook model) ─────────────

  /**
   * Fires burn rate alerts only when BOTH windows confirm the breach.
   *
   * Fast-burn page:   1h ≥ 14× AND 6h ≥ 14×  → CRITICAL, 1h cooldown
   * Slow-burn ticket: 6h ≥  6× AND 24h ≥  6×  → HIGH,     3h cooldown
   *
   * Single-window transient spikes (e.g. a 10-min burst that elevates the 1h
   * burn rate above threshold) do NOT page because the confirmation window
   * (6h) has not yet accumulated enough violations to corroborate the signal.
   *
   * Only sustained, real degradation appears in both windows simultaneously.
   */
  private async fireBurnRateAlerts(
    burnRates: BurnRate[],
    definitions: Record<SloId, SloDefinition>,
  ): Promise<void> {
    // Build a lookup: sloId → window → BurnRate
    const byKey = new Map<string, BurnRate>();
    for (const br of burnRates) byKey.set(`${br.sloId}:${br.window}`, br);

    const sloIds = [...new Set(burnRates.map(r => r.sloId))];

    for (const sloId of sloIds) {
      const def = definitions[sloId];
      if (!def) continue;

      const br1h  = byKey.get(`${sloId}:1h`);
      const br6h  = byKey.get(`${sloId}:6h`);
      const br24h = byKey.get(`${sloId}:24h`);

      // ── Fast-burn: BOTH 1h AND 6h must be ≥ fast threshold ───────────────
      if (br1h?.isFastBurn && br6h?.isFastBurn) {
        await this.emitDualWindowAlert({
          sloId, def,
          alertClass: 'fast_burn',
          severity: SloSeverity.CRITICAL,
          primaryWindow: '1h', primaryBr: br1h,
          confirmationWindow: '6h', confirmationBr: br6h,
          cooldownMs: 60 * 60 * 1000,
        });
      }

      // ── Slow-burn: BOTH 6h AND 24h must be ≥ slow threshold ──────────────
      if (br6h?.isSlowBurn && br24h?.isSlowBurn) {
        await this.emitDualWindowAlert({
          sloId, def,
          alertClass: 'slow_burn',
          severity: SloSeverity.HIGH,
          primaryWindow: '6h', primaryBr: br6h,
          confirmationWindow: '24h', confirmationBr: br24h,
          cooldownMs: 3 * 60 * 60 * 1000,
        });
      }
    }
  }

  private async emitDualWindowAlert(opts: {
    sloId: SloId;
    def: SloDefinition;
    alertClass: 'fast_burn' | 'slow_burn';
    severity: SloSeverity;
    primaryWindow: SloWindow;
    primaryBr: BurnRate;
    confirmationWindow: SloWindow;
    confirmationBr: BurnRate;
    cooldownMs: number;
  }): Promise<void> {
    const { sloId, def, alertClass, severity, primaryBr, confirmationBr,
            primaryWindow, confirmationWindow, cooldownMs } = opts;

    const cooldownKey = `${sloId}:${alertClass}`;
    const lastFired   = burnRateCooldown.get(cooldownKey) ?? 0;
    if (Date.now() - lastFired < cooldownMs) return;

    const forecast  = primaryBr.forecastExhaustionMin !== null
      ? ` Budget exhausts in ~${Math.round(primaryBr.forecastExhaustionMin / 60)}h.` : '';

    const label     = alertClass === 'fast_burn' ? 'FAST BURN' : 'SLOW BURN';
    const threshold = primaryBr.isFastBurn ? primaryBr.fastBurnThreshold : primaryBr.slowBurnThreshold;

    const message = `[DUAL-WINDOW ${label}] ${def.name}: ` +
      `${primaryWindow}=${primaryBr.rate}× AND ${confirmationWindow}=${confirmationBr.rate}× ` +
      `(threshold: ${threshold}×).${forecast}`;

    const payload: DualWindowBurnAlert = {
      type: 'DUAL_WINDOW_BURN',
      alertClass,
      sloId,
      sloName:            def.name,
      severity,
      primaryWindow,
      primaryBurnRate:    primaryBr.rate,
      confirmationWindow,
      confirmationBurnRate: confirmationBr.rate,
      confirmed:          true,
      forecastExhaustionMin: primaryBr.forecastExhaustionMin,
      budgetConsumedPct:  0,
      message,
      timestamp:          new Date().toISOString(),
      remediation:        `Investigate ${sloId} violations across ${primaryWindow}+${confirmationWindow} windows. ${primaryBr.violationCount + confirmationBr.violationCount} total breaches detected.`,
      dashboardUrl:       process.env.OPS_DASHBOARD_URL
        ? `${process.env.OPS_DASHBOARD_URL}/ops?panel=burnrate&slo=${sloId}` : undefined,
    };

    burnRateCooldown.set(cooldownKey, Date.now());

    this.alertHistory.record({
      sloId, sloName: def.name, severity,
      status: 'FIRED',
      triggeredValue: primaryBr.rate,
      threshold,
      unit: '× burn rate (dual-window confirmed)',
      message, firedAt: payload.timestamp, suppressed: false,
    });

    fireAlertWebhookWithRetry(payload as any, 3, (msg) => this.logger.error(msg))
      .catch(() => {});

    this.logger.warn(
      `[ErrorBudget] DUAL-WINDOW ${label}: ${sloId} [${primaryWindow}=${primaryBr.rate}×, ${confirmationWindow}=${confirmationBr.rate}×]`,
    );
  }


  // ── Persistence ───────────────────────────────────────────────────────────

  private async persistSnapshots(budgets: ErrorBudget[], burnRates: BurnRate[]): Promise<void> {
    try {
      // Build batch insert for error_budget_snapshots
      for (const b of budgets) {
        const relatedBurnRates = burnRates.filter(br => br.sloId === b.sloId);
        const primaryBr = relatedBurnRates[0];
        await this.ds.query(
          `INSERT INTO error_budget_snapshots
             (slo_id, window_label, budget_total_min, budget_used_min,
              budget_remaining_min, budget_consumed_pct,
              burn_rate, fast_burn_threshold, slow_burn_threshold,
              is_fast_burn, is_slow_burn, forecast_exhaustion_min, trend_direction)
           VALUES ($1, '30d', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            b.sloId, b.budgetTotalMin, b.budgetUsedMin,
            b.budgetRemainingMin, b.budgetConsumedPct,
            primaryBr?.rate ?? 0,
            primaryBr?.fastBurnThreshold ?? 0,
            primaryBr?.slowBurnThreshold ?? 0,
            primaryBr?.isFastBurn ?? false,
            primaryBr?.isSlowBurn ?? false,
            primaryBr?.forecastExhaustionMin ?? null,
            primaryBr?.trend ?? 'stable',
          ],
        );
      }
    } catch (err) {
      this.logger.warn(`[ErrorBudget] snapshot persistence failed: ${String(err)}`);
    }
  }

  // ── Record measurement ────────────────────────────────────────────────────

  async recordMeasurement(
    sloId: SloId,
    measuredValue: number,
    isBreach: boolean,
    deviationPct: number,
    tenantId?: string,
  ): Promise<void> {
    try {
      await this.ds.query(
        `INSERT INTO slo_measurements
           (slo_id, measured_value, is_breach, deviation_pct, tenant_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [sloId, measuredValue, isBreach, deviationPct, tenantId ?? null],
      );
    } catch (err) {
      this.logger.warn(`[ErrorBudget] recordMeasurement failed: ${String(err)}`);
    }
  }

  // ── Admin query ───────────────────────────────────────────────────────────

  async getLatestBudgetSnapshot(sloId: SloId): Promise<any | null> {
    const [row] = await this.ds.query(
      `SELECT * FROM error_budget_snapshots
       WHERE slo_id = $1
       ORDER BY snapped_at DESC LIMIT 1`,
      [sloId],
    );
    return row ?? null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private windowToInterval(window: SloWindow): string {
    const map: Record<SloWindow, string> = {
      '1h': '1 hour', '6h': '6 hours', '24h': '24 hours', '7d': '7 days', '30d': '30 days',
    };
    return map[window];
  }

  private doubleInterval(window: SloWindow): string {
    const map: Record<SloWindow, string> = {
      '1h': '2 hours', '6h': '12 hours', '24h': '48 hours', '7d': '14 days', '30d': '60 days',
    };
    return map[window];
  }

  private computeTrend(current: number, previous: number): 'improving' | 'degrading' | 'stable' {
    if (previous === 0) return 'stable';
    const delta = (current - previous) / previous;
    if (delta > 0.1)  return 'degrading';
    if (delta < -0.1) return 'improving';
    return 'stable';
  }
}
