import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BurnRate, SloId, SloWindow } from './slo.types';
import { MitigationPolicyEngine, MitigationPolicy, PolicyMatch } from './mitigation-policy-engine.service';
import { RemediationConfidenceService } from './remediation-confidence.service';

// ── Simulation Types ──────────────────────────────────────────────────────────

export interface SimulationTick {
  timestamp: string;
  burnRates: BurnRate[];
  matches:   PolicyMatch[];
}

export interface SimulationReport {
  policyId:         string;
  policyName:       string;
  windowDays:       number;
  totalTicks:       number;     // How many 5-minute evaluation cycles were simulated
  totalMatches:     number;     // How many ticks the policy would have fired
  matchRate:        number;     // matches / totalTicks (0–1)
  /** How many distinct incidents would this policy have generated signals for? */
  estimatedSignals: number;
  /** How many would have been suppressed by dedup window? */
  estimatedSuppressed: number;
  /** Breakdown by SLO: which conditions drove matches most? */
  conditionBreakdown: Array<{ metric: string; operator: string; value: number; matchCount: number }>;
  /** Timeline of match ticks (sampled at most 50 for UI rendering) */
  sampleTicks:      Array<{ timestamp: string; matchedConditions: string[] }>;
  /** Alert: if match rate > 30%, warn about potential alert fatigue */
  alertFatigueRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Compatibility: would this policy have conflicted with existing policies? */
  overlapPolicies:  string[];
  simulatedAt:      string;
}

const EVAL_INTERVAL_MS   = 5 * 60 * 1000;  // 5-minute evaluation cadence
const DEDUP_INTERVAL_MS  = 10 * 60 * 1000; // matches within 10min of each other = suppressed

/**
 * POLICY SIMULATION ENGINE — Phase AL
 *
 * Replays historical `slo_measurements` data through the policy evaluation
 * engine to estimate how a policy would have behaved in production.
 *
 * ── Purpose ───────────────────────────────────────────────────────────────────
 *  Before enabling a new mitigation policy, operators need to know:
 *  1. How frequently would it fire? (match rate)
 *  2. Would it create alert fatigue? (high match rate with low severity)
 *  3. Which conditions drive matches most? (condition breakdown)
 *  4. Would it conflict with existing policies? (overlap detection)
 *  5. What is the estimated signal count? (accounting for dedup suppression)
 *
 * ── Simulation fidelity ───────────────────────────────────────────────────────
 *  The simulation reconstructs BurnRate objects for each 5-minute tick by
 *  querying the slo_measurements time-series data. This means:
 *   - The simulation uses the exact same evaluation logic as production
 *   - Seasonal patterns (business hours, payroll cycles) are captured
 *   - The 30-day window covers multiple weekly cycles
 *
 * ── Limitations ───────────────────────────────────────────────────────────────
 *  - Stabilization windows are NOT simulated (would require full state replay)
 *  - Confidence gates use current confidence data, not historical confidence
 *  - The dedup suppression estimate is approximate (tracks last match timestamp)
 *  - Queue depth metrics are not in slo_measurements — policies using
 *    queue_depth conditions will show 0 matches in simulation
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *  Called from the Policy Management UI before toggling simulation_mode = false
 *  to enable a policy in production.
 */
@Injectable()
export class PolicySimulationEngine {
  private readonly logger = new Logger(PolicySimulationEngine.name);

  constructor(
    private readonly policyEngine:  MitigationPolicyEngine,
    private readonly confidence:    RemediationConfidenceService,
    private readonly dataSource:    DataSource,
  ) {}

  // ── Core Simulation ───────────────────────────────────────────────────────

  /**
   * Simulate a single policy against the last N days of historical data.
   */
  async simulate(policyId: string, windowDays = 30): Promise<SimulationReport | null> {
    const policy = this.policyEngine.getPolicy(policyId);
    if (!policy) {
      this.logger.warn(`[Simulation] Policy not found: ${policyId}`);
      return null;
    }

    this.logger.log(`[Simulation] Starting simulation for policy ${policyId} over ${windowDays} days`);
    const startedAt = Date.now();

    // Reconstruct time-series ticks from slo_measurements
    const ticks = await this.buildSimulationTicks(policy.sloId, windowDays);
    if (ticks.length === 0) {
      this.logger.warn(`[Simulation] No historical data found for ${policy.sloId} — returning empty report`);
      return this.emptyReport(policy, windowDays, 0);
    }

    // Evaluate policy against each tick
    const matchTicks: SimulationTick[] = [];
    const conditionHits = new Map<string, number>();
    let lastMatchAt: number | null = null;
    let suppressedCount = 0;

    // Build a temporary policy-only engine to isolate this policy's evaluation
    const conditionMetrics = new Map<string, number>();

    for (const tick of ticks) {
      // Temporarily override policyEngine to evaluate only this policy
      const matches = this.evaluateSinglePolicy(policy, tick.burnRates);

      if (matches.length > 0) {
        const tickMs = new Date(tick.timestamp).getTime();

        // Dedup: skip if we already matched within the dedup window
        if (lastMatchAt !== null && tickMs - lastMatchAt < DEDUP_INTERVAL_MS) {
          suppressedCount++;
          continue;
        }

        lastMatchAt = tickMs;
        matchTicks.push({ ...tick, matches });

        // Count condition hits for breakdown
        for (const m of matches) {
          for (const mc of m.matchedConditions) {
            const key = `${mc.condition.metric}:${mc.condition.operator}:${mc.condition.value}`;
            conditionHits.set(key, (conditionHits.get(key) ?? 0) + 1);
          }
        }
      }
    }

    const matchRate = ticks.length > 0 ? matchTicks.length / ticks.length : 0;

    // Overlap detection: which other policies would also fire on the same ticks?
    const overlapPolicies = this.detectOverlap(policy, matchTicks);

    // Alert fatigue classification
    const alertFatigueRisk: SimulationReport['alertFatigueRisk'] =
      matchRate > 0.30 ? 'HIGH' : matchRate > 0.10 ? 'MEDIUM' : 'LOW';

    // Condition breakdown
    const conditionBreakdown = [...conditionHits.entries()].map(([key, count]) => {
      const [metric, operator, value] = key.split(':');
      return { metric, operator, value: Number(value), matchCount: count };
    }).sort((a, b) => b.matchCount - a.matchCount);

    // Sample at most 50 ticks for UI rendering
    const step = Math.max(1, Math.floor(matchTicks.length / 50));
    const sampleTicks = matchTicks
      .filter((_, i) => i % step === 0)
      .map(t => ({
        timestamp: t.timestamp,
        matchedConditions: t.matches[0]?.matchedConditions.map(mc =>
          `${mc.condition.metric} ${mc.condition.operator} ${mc.condition.value} (observed: ${mc.observedValue.toFixed(2)})`,
        ) ?? [],
      }));

    const elapsed = Date.now() - startedAt;
    this.logger.log(`[Simulation] ${policyId}: ${matchTicks.length} matches / ${ticks.length} ticks (${(matchRate * 100).toFixed(1)}%) in ${elapsed}ms`);

    return {
      policyId, policyName: policy.name, windowDays,
      totalTicks: ticks.length,
      totalMatches: matchTicks.length,
      matchRate: Math.round(matchRate * 10000) / 10000,
      estimatedSignals: matchTicks.length,
      estimatedSuppressed: suppressedCount,
      conditionBreakdown,
      sampleTicks,
      alertFatigueRisk,
      overlapPolicies,
      simulatedAt: new Date().toISOString(),
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async buildSimulationTicks(sloId: SloId, windowDays: number): Promise<SimulationTick[]> {
    // Fetch raw measurements
    const rows: Array<Record<string, unknown>> = await this.dataSource.query(`
      SELECT
        date_trunc('minute', sampled_at -
          (EXTRACT(MINUTE FROM sampled_at)::INT % 5) * INTERVAL '1 minute') AS tick_ts,
        COUNT(*) AS sample_count,
        SUM(CASE WHEN is_breach THEN 1 ELSE 0 END) AS breach_count,
        AVG(measured_value) AS avg_value
      FROM slo_measurements
      WHERE slo_id = $1
        AND sampled_at > NOW() - INTERVAL '${windowDays} days'
      GROUP BY tick_ts
      ORDER BY tick_ts ASC
    `, [sloId]).catch(() => []);

    return rows.map(row => {
      const sampleCount  = Number(row.sample_count);
      const breachCount  = Number(row.breach_count);
      const violationRate = sampleCount > 0 ? breachCount / sampleCount : 0;

      // Approximate burn rate for simulation: violation rate / (1 - SLO target)
      // Using 0.0005 as the default allowed error rate (99.95% SLO)
      const burnRate = violationRate / 0.0005;

      const burnRateObj: BurnRate = {
        sloId,
        window: '1h',
        rate: burnRate,
        violationCount: breachCount,
        sampleCount,
        violationRate,
        isFastBurn: burnRate >= 14,
        isSlowBurn: burnRate >= 6,
        fastBurnThreshold: 14,
        slowBurnThreshold: 6,
        forecastExhaustionMin: burnRate > 0 ? Math.round(60 / burnRate) : null,
        trend: 'stable',
        computedAt: String(row.tick_ts),
      };

      return {
        timestamp: String(row.tick_ts),
        burnRates: [burnRateObj],
        matches: [],
      };
    });
  }

  private evaluateSinglePolicy(policy: MitigationPolicy, burnRates: BurnRate[]): PolicyMatch[] {
    const tempPolicies = [policy];
    const byKey = new Map<string, BurnRate>();
    for (const br of burnRates) byKey.set(`${br.sloId}:${br.window}`, br);

    return this.policyEngine.evaluate(burnRates).filter(m => m.policy.id === policy.id);
  }

  private detectOverlap(policy: MitigationPolicy, matchTicks: SimulationTick[]): string[] {
    if (matchTicks.length === 0) return [];

    const otherPolicies = this.policyEngine.getPolicies()
      .filter(p => p.id !== policy.id && p.sloId === policy.sloId && p.enabled);

    const overlapIds: string[] = [];
    for (const other of otherPolicies) {
      // Check if the other policy would also fire on any of our match ticks
      const overlaps = matchTicks.some(tick =>
        this.policyEngine.evaluate(tick.burnRates).some(m => m.policy.id === other.id),
      );
      if (overlaps) overlapIds.push(other.id);
    }
    return [...new Set(overlapIds)];
  }

  private emptyReport(policy: MitigationPolicy, windowDays: number, totalTicks: number): SimulationReport {
    return {
      policyId: policy.id, policyName: policy.name, windowDays,
      totalTicks, totalMatches: 0, matchRate: 0,
      estimatedSignals: 0, estimatedSuppressed: 0,
      conditionBreakdown: [], sampleTicks: [],
      alertFatigueRisk: 'LOW', overlapPolicies: [],
      simulatedAt: new Date().toISOString(),
    };
  }
}
