import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MitigationSignal, MitigationState, SloId } from './slo.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type OutcomeVerdict = 'EFFECTIVE' | 'INEFFECTIVE' | 'WORSENED' | 'INCONCLUSIVE';

export interface MitigationOutcome {
  signalId:       string;
  sloId:          SloId;
  action:         string;
  executedAt:     string;
  resolvedAt:     string;
  /** Baseline: avg violation rate in the 15m window BEFORE execution */
  preViolationRate:  number;
  /** Result:   avg violation rate in the 15m window AFTER stabilization */
  postViolationRate: number;
  /** Negative = improvement, positive = worsening */
  deltaRate:      number;
  /** Percentage change in violation rate */
  improvementPct: number;
  /** Confidence: proportion of samples available vs expected (0–1) */
  confidence:     number;
  verdict:        OutcomeVerdict;
  /** Optional note explaining inconclusive or worsened outcomes */
  note?:          string;
}

/**
 * MITIGATION OUTCOME SERVICE — Phase AB
 *
 * Compares SLO violation rates in a 15-minute window BEFORE a mitigation
 * against a 15-minute window AFTER the stabilization period completes.
 *
 * ── Why this matters ──────────────────────────────────────────────────────────
 *  The system currently knows "mitigation executed" but not "mitigation worked."
 *  Without outcome analysis:
 *   - No rollback recommendation logic is possible
 *   - No remediation confidence scoring exists
 *   - The platform cannot learn which mitigations are effective for which SLOs
 *   - Repeated ineffective mitigations cannot be detected and suppressed
 *
 * ── Verdict thresholds ────────────────────────────────────────────────────────
 *  EFFECTIVE:     violation rate improved by ≥ 20%
 *  INEFFECTIVE:   violation rate unchanged (within ±10%)
 *  WORSENED:      violation rate increased by ≥ 10%
 *  INCONCLUSIVE:  insufficient samples (confidence < 0.5) — e.g. during off-hours
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *  Called by CronOrchestratorService after each RESOLVED or ROLLED_BACK transition:
 *    await outcomeService.analyzeOutcome(signal)
 *
 *  Outcomes are stored in-memory (ring buffer, 500 entries) and later used by
 *  MitigationSignalService to build confidence-weighted remediation rankings.
 */
@Injectable()
export class MitigationOutcomeService {
  private readonly logger  = new Logger(MitigationOutcomeService.name);
  private readonly outcomes: MitigationOutcome[] = [];
  private readonly MAX     = 500;

  // Expected sample count per 15min window (5-min cron × 3 = 3 samples)
  private readonly EXPECTED_SAMPLES = 3;

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Analysis ──────────────────────────────────────────────────────────────

  async analyzeOutcome(signal: MitigationSignal): Promise<MitigationOutcome | null> {
    const execTransition = signal.transitions.find(t => t.to === MitigationState.EXECUTING);
    const resolvedAt     = signal.lastTransitionAt;
    if (!execTransition) return null;

    const executedAt = execTransition.at;

    try {
      const [preSamples, postSamples] = await Promise.all([
        this.querySamples(signal.sloId as SloId, executedAt, -15),  // 15m before execution
        this.querySamples(signal.sloId as SloId, resolvedAt,   15), // 15m after resolution
      ]);

      const preRate  = this.violationRate(preSamples);
      const postRate = this.violationRate(postSamples);
      const delta    = postRate - preRate;
      const imprvPct = preRate > 0 ? ((preRate - postRate) / preRate) * 100 : 0;

      // Confidence: how many samples did we actually have vs expected in each window?
      const confidence = Math.min(1,
        Math.min(preSamples.length, postSamples.length) / this.EXPECTED_SAMPLES,
      );

      const verdict = this.scoreVerdict(delta, imprvPct, confidence);

      const outcome: MitigationOutcome = {
        signalId:          signal.id,
        sloId:             signal.sloId as SloId,
        action:            signal.action,
        executedAt,
        resolvedAt,
        preViolationRate:  Math.round(preRate  * 10000) / 10000,
        postViolationRate: Math.round(postRate * 10000) / 10000,
        deltaRate:         Math.round(delta    * 10000) / 10000,
        improvementPct:    Math.round(imprvPct * 100)   / 100,
        confidence:        Math.round(confidence * 100) / 100,
        verdict,
        note:              this.buildNote(verdict, signal, preRate, postRate, confidence),
      };

      this.outcomes.unshift(outcome);
      if (this.outcomes.length > this.MAX) this.outcomes.length = this.MAX;

      this.logger.log(
        `[Outcome] signal=${signal.id} slo=${signal.sloId} ` +
        `verdict=${verdict} pre=${preRate.toFixed(4)} post=${postRate.toFixed(4)} ` +
        `Δ=${delta.toFixed(4)} confidence=${confidence.toFixed(2)}`,
      );

      return outcome;
    } catch (err) {
      this.logger.warn(`[Outcome] Analysis failed for signal=${signal.id}: ${String(err)}`);
      return null;
    }
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  getOutcomes(limit = 50): MitigationOutcome[] { return this.outcomes.slice(0, limit); }

  getActionSummary(): Array<{ action: string; sloId: SloId; totalAnalyzed: number; effectivePct: number; worsenedPct: number }> {
    const groups = new Map<string, MitigationOutcome[]>();
    for (const o of this.outcomes) {
      const key = `${o.action}:${o.sloId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(o);
    }
    return [...groups.entries()].map(([key, items]) => {
      const [action, sloId] = key.split(':') as [string, SloId];
      const effective = items.filter(i => i.verdict === 'EFFECTIVE').length;
      const worsened  = items.filter(i => i.verdict === 'WORSENED').length;
      return {
        action, sloId,
        totalAnalyzed: items.length,
        effectivePct:  Math.round((effective / items.length) * 100),
        worsenedPct:   Math.round((worsened  / items.length) * 100),
      };
    });
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async querySamples(
    sloId: SloId,
    anchor: string,
    offsetMinutes: number,
  ): Promise<Array<{ is_breach: boolean }>> {
    const direction   = offsetMinutes >= 0 ? 'future' : 'past';
    const absOffset   = Math.abs(offsetMinutes);
    const windowStart = offsetMinutes < 0
      ? `'${anchor}'::timestamptz - INTERVAL '${absOffset} minutes'`
      : `'${anchor}'::timestamptz`;
    const windowEnd   = offsetMinutes < 0
      ? `'${anchor}'::timestamptz`
      : `'${anchor}'::timestamptz + INTERVAL '${absOffset} minutes'`;

    void direction; // used only for documentation clarity above

    return this.ds.query<Array<{ is_breach: boolean }>>(
      `SELECT is_breach
       FROM slo_measurements
       WHERE slo_id = $1
         AND sampled_at BETWEEN ${windowStart} AND ${windowEnd}
       ORDER BY sampled_at`,
      [sloId],
    );
  }

  private violationRate(samples: Array<{ is_breach: boolean }>): number {
    if (samples.length === 0) return 0;
    const breaches = samples.filter(s => s.is_breach).length;
    return breaches / samples.length;
  }

  private scoreVerdict(delta: number, improvementPct: number, confidence: number): OutcomeVerdict {
    if (confidence < 0.5) return 'INCONCLUSIVE';
    if (improvementPct  >= 20) return 'EFFECTIVE';
    if (delta > 0 && Math.abs(improvementPct) >= 10) return 'WORSENED';
    return 'INEFFECTIVE';
  }

  private buildNote(verdict: OutcomeVerdict, signal: MitigationSignal, pre: number, post: number, confidence: number): string | undefined {
    if (verdict === 'INCONCLUSIVE') {
      return `Insufficient samples (confidence=${(confidence * 100).toFixed(0)}%). Analysis may be inaccurate during low-traffic windows.`;
    }
    if (verdict === 'WORSENED') {
      return `${signal.action} on ${signal.targetResource} increased violation rate ${(pre * 100).toFixed(2)}% → ${(post * 100).toFixed(2)}%. Consider rollback policy for this action.`;
    }
    if (verdict === 'INEFFECTIVE') {
      return `${signal.action} did not measurably improve ${signal.sloId}. Investigate root cause beyond queue pressure.`;
    }
    return undefined;
  }
}
