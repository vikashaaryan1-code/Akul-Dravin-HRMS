import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SloId, SloWindow, WindowedSloResult } from './slo.types';

// ── Window SQL intervals ──────────────────────────────────────────────────────

const WINDOW_SQL: Record<SloWindow, string> = {
  '1h':  '1 hour',
  '6h':  '6 hours',
  '24h': '24 hours',
  '7d':  '7 days',
  '30d': '30 days',
};

// ── Rolling Window Service ────────────────────────────────────────────────────

/**
 * ROLLING WINDOW SLO EVALUATOR — Track N
 *
 * Augments point-in-time SLO evaluation with statistical windowed analysis.
 * Answers questions that binary breach detection cannot:
 *
 *  - "Is the platform getting better or worse over the last 24 hours?"
 *  - "What's the p95 projection lag over the past week?"
 *  - "Is today's AI latency better or worse than yesterday's?"
 *
 * ── Data source ────────────────────────────────────────────────────────────────
 *  Reads from `slo_measurements` (populated by SloService.recordMeasurement()
 *  after each 5-min evaluation tick).
 *
 * ── Percentile estimation ─────────────────────────────────────────────────────
 *  Uses PostgreSQL `percentile_cont()` aggregate function for accurate
 *  percentile computation on the measured_value column.
 *  Falls back to null if insufficient samples (<= 5 in the window.
 *
 * ── Trend analysis ────────────────────────────────────────────────────────────
 *  Compares the breach rate in the current window vs the prior equivalent window.
 *  A >10% change in breach rate triggers a directional classification.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *  Called by CronOrchestratorService alongside SloService.evaluateAll().
 *  Results surfaced via /admin/slo/windows for BurnRateView dashboard.
 */
@Injectable()
export class RollingWindowService {
  private readonly logger = new Logger(RollingWindowService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  // ── Single SLO + Window ───────────────────────────────────────────────────

  async evaluate(sloId: SloId, sloName: string, window: SloWindow): Promise<WindowedSloResult> {
    const now         = new Date().toISOString();
    const intervalSql = WINDOW_SQL[window];

    try {
      // Current window: breach stats + percentiles
      const [stats] = await this.ds.query<Array<{
        total:   string;
        breaches: string;
        p50:     string | null;
        p95:     string | null;
        p99:     string | null;
      }>>(
        `SELECT
           COUNT(*)                                  AS total,
           COUNT(*) FILTER (WHERE is_breach = TRUE)  AS breaches,
           percentile_cont(0.50) WITHIN GROUP (ORDER BY measured_value) AS p50,
           percentile_cont(0.95) WITHIN GROUP (ORDER BY measured_value) AS p95,
           percentile_cont(0.99) WITHIN GROUP (ORDER BY measured_value) AS p99
         FROM slo_measurements
         WHERE slo_id = $1
           AND sampled_at > NOW() - INTERVAL '${intervalSql}'`,
        [sloId],
      );

      // Previous window (for trend)
      const [prevStats] = await this.ds.query<Array<{ total: string; breaches: string }>>(
        `SELECT
           COUNT(*)                                  AS total,
           COUNT(*) FILTER (WHERE is_breach = TRUE)  AS breaches
         FROM slo_measurements
         WHERE slo_id = $1
           AND sampled_at BETWEEN NOW() - INTERVAL '${this.doubleInterval(window)}' AND NOW() - INTERVAL '${intervalSql}'`,
        [sloId],
      );

      const total   = parseInt(stats?.total    ?? '0', 10);
      const breaches = parseInt(stats?.breaches ?? '0', 10);
      const prevTotal    = parseInt(prevStats?.total    ?? '0', 10);
      const prevBreaches = parseInt(prevStats?.breaches ?? '0', 10);

      const breachRate     = total > 0    ? breaches    / total    : 0;
      const prevBreachRate = prevTotal > 0 ? prevBreaches / prevTotal : 0;
      const trend          = this.computeTrend(breachRate, prevBreachRate);

      // Only emit percentiles with sufficient data
      const hasEnoughData = total >= 5;

      return {
        sloId,
        sloName,
        window,
        totalSamples:  total,
        breachSamples: breaches,
        breachRate:    Math.round(breachRate * 10000) / 10000,
        p50Value: hasEnoughData && stats.p50 ? parseFloat(stats.p50) : null,
        p95Value: hasEnoughData && stats.p95 ? parseFloat(stats.p95) : null,
        p99Value: hasEnoughData && stats.p99 ? parseFloat(stats.p99) : null,
        trend,
        computedAt: now,
      };
    } catch (err) {
      this.logger.warn(`[RollingWindow] evaluate(${sloId}/${window}) failed: ${String(err)}`);
      return {
        sloId, sloName, window,
        totalSamples: 0, breachSamples: 0, breachRate: 0,
        p50Value: null, p95Value: null, p99Value: null,
        trend: 'stable', computedAt: now,
      };
    }
  }

  // ── All SLOs × Selected Windows ──────────────────────────────────────────

  async evaluateAll(
    sloIds: Array<{ id: SloId; name: string }>,
    windows: SloWindow[] = ['1h', '6h', '24h', '7d'],
  ): Promise<WindowedSloResult[]> {
    const tasks = sloIds.flatMap(({ id, name }) =>
      windows.map(w => this.evaluate(id, name, w)),
    );
    const results = await Promise.allSettled(tasks);
    return results
      .filter((r): r is PromiseFulfilledResult<WindowedSloResult> => r.status === 'fulfilled')
      .map(r => r.value);
  }

  // ── Adaptive Threshold Suggestion ────────────────────────────────────────

  /**
   * Suggests an adaptive threshold based on observed p95 values over 7 days.
   * Useful for setting context-aware thresholds on noisy SLOs like AI latency.
   *
   * Returns null if insufficient data.
   */
  async suggestAdaptiveThreshold(sloId: SloId): Promise<number | null> {
    try {
      const [row] = await this.ds.query<Array<{ suggested_threshold: string | null }>>(
        `SELECT
           ROUND(
             percentile_cont(0.95) WITHIN GROUP (ORDER BY measured_value) * 1.2
           , 2) AS suggested_threshold
         FROM slo_measurements
         WHERE slo_id = $1
           AND sampled_at > NOW() - INTERVAL '7 days'
           AND is_breach = FALSE`,  // Only use passing samples to avoid bias
        [sloId],
      );
      const val = row?.suggested_threshold;
      return val ? parseFloat(val) : null;
    } catch {
      return null;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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
