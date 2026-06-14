import { Injectable, Logger } from '@nestjs/common';
import { MitigationOutcome, MitigationOutcomeService } from './mitigation-outcome.service';
import { MitigationSignal, MitigationState } from './slo.types';

// ── Rollback Recommendation ───────────────────────────────────────────────────

export interface RollbackRecommendation {
  signalId:        string;
  sloId:           string;
  action:          string;
  targetResource:  string;
  /** Outcome that triggered this recommendation */
  triggeringOutcome: MitigationOutcome;
  /** Evidence: how much worse did conditions get? */
  worseningPct:    number;
  /** Is this recommendation urgent (worsening > 30%)? */
  urgent:          boolean;
  /** Plain-language explanation for operator */
  rationale:       string;
  generatedAt:     string;
  /** Has an operator acted on this recommendation? */
  actedOn:         boolean;
}

/**
 * AUTO-ROLLBACK DETECTOR — Phase AH
 *
 * Monitors mitigation outcomes and generates operator-gated rollback
 * recommendations when a mitigation demonstrably worsened SLO conditions.
 *
 * ── Design principles ────────────────────────────────────────────────────────
 *  1. OPERATOR-GATED: This service NEVER autonomously rolls back a mitigation.
 *     It generates recommendations that operators must confirm.
 *     Autonomous rollback would invert the mitigation without human judgment
 *     of whether the worsening was caused by the mitigation or an independent event.
 *
 *  2. EVIDENCE-REQUIRED: Rollback recommendations only fire when:
 *     - outcome.verdict = 'WORSENED'
 *     - worseningPct ≥ worseningThresholdPct (default 10%)
 *     - confidence ≥ 0.5 (sufficient samples to trust the measurement)
 *     - The signal is still in STABILIZING state (rollback is still meaningful)
 *
 *  3. DEDUPLICATION: One recommendation per signal — duplicate worsening outcomes
 *     for the same signal do not generate additional recommendations.
 *
 * ── Integration ───────────────────────────────────────────────────────────────
 *  Called by CronOrchestratorService.evaluatePlatformHealth() (leader-gated),
 *  after outcomeService.analyzeOutcome() returns a verdict.
 *
 *  Recommendations are consumed by:
 *   - MitigationView.tsx (shows rollback recommendation badge on signal cards)
 *   - MitigationSignalService.rollback() (operator manually triggers rollback)
 *
 * ── Future evolution ─────────────────────────────────────────────────────────
 *  Once confidence records accumulate across enough incidents, the platform
 *  can automatically suppress policies with worsenedPct ≥ 25% from auto-execution
 *  (currently done manually via disablePolicy in MitigationPolicyEngine).
 */
@Injectable()
export class AutoRollbackDetector {
  private readonly logger = new Logger(AutoRollbackDetector.name);
  private readonly recommendations: RollbackRecommendation[] = [];
  private readonly MAX = 100;

  /** Minimum worsening percentage before a rollback recommendation fires */
  private readonly WORSENING_THRESHOLD_PCT = 10;

  /** Signals already recommended for rollback — prevents duplicate recommendations */
  private readonly deduped = new Set<string>();

  constructor(private readonly outcomeService: MitigationOutcomeService) {}

  // ── Core Detection ────────────────────────────────────────────────────────

  /**
   * Evaluate a completed outcome and generate a rollback recommendation if warranted.
   * Should be called immediately after MitigationOutcomeService.analyzeOutcome().
   *
   * @param outcome  The analyzed outcome result
   * @param signal   The corresponding mitigation signal
   * @returns        A RollbackRecommendation if conditions are met, null otherwise
   */
  evaluate(outcome: MitigationOutcome, signal: MitigationSignal): RollbackRecommendation | null {
    // Gate 1: Verdict must be WORSENED
    if (outcome.verdict !== 'WORSENED') return null;

    // Gate 2: Sufficient confidence (avoid recommendations on sparse data)
    if (outcome.confidence < 0.5) {
      this.logger.debug(
        `[AutoRollback] Skipping low-confidence worsening: signal=${signal.id} confidence=${outcome.confidence}`,
      );
      return null;
    }

    // Gate 3: Worsening must exceed threshold
    const worseningPct = Math.abs(outcome.improvementPct); // improvement is negative for worsening
    if (worseningPct < this.WORSENING_THRESHOLD_PCT) return null;

    // Gate 4: Signal must still be in a state where rollback is meaningful
    const rollbackableStates = [MitigationState.STABILIZING, MitigationState.RESOLVED];
    if (!rollbackableStates.includes(signal.state)) return null;

    // Gate 5: Dedup — one recommendation per signal
    if (this.deduped.has(signal.id)) return null;
    this.deduped.add(signal.id);

    const urgent = worseningPct >= 30;
    const rec: RollbackRecommendation = {
      signalId:          signal.id,
      sloId:             String(signal.sloId),
      action:            signal.action,
      targetResource:    signal.targetResource,
      triggeringOutcome: outcome,
      worseningPct:      Math.round(worseningPct * 100) / 100,
      urgent,
      rationale:         this.buildRationale(outcome, signal, worseningPct, urgent),
      generatedAt:       new Date().toISOString(),
      actedOn:           false,
    };

    this.recommendations.unshift(rec);
    if (this.recommendations.length > this.MAX) this.recommendations.length = this.MAX;

    const level = urgent ? 'warn' : 'log';
    this.logger[level](
      `[AutoRollback] ${urgent ? '🔴 URGENT' : '⚠'} Rollback recommended: ` +
      `signal=${signal.id} action=${signal.action} worsening=${worseningPct.toFixed(1)}%`,
    );

    return rec;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getRecommendations(limit = 20): RollbackRecommendation[] {
    return this.recommendations.slice(0, limit);
  }

  getActiveRecommendations(): RollbackRecommendation[] {
    return this.recommendations.filter(r => !r.actedOn);
  }

  markActedOn(signalId: string): boolean {
    const r = this.recommendations.find(r => r.signalId === signalId);
    if (!r) return false;
    r.actedOn = true;
    return true;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private buildRationale(
    outcome: MitigationOutcome,
    signal: MitigationSignal,
    worseningPct: number,
    urgent: boolean,
  ): string {
    const pre  = (outcome.preViolationRate  * 100).toFixed(2);
    const post = (outcome.postViolationRate * 100).toFixed(2);

    const lines = [
      `${signal.action} on ${signal.targetResource} worsened ${signal.sloId} conditions by ${worseningPct.toFixed(1)}%.`,
      `Violation rate moved from ${pre}% → ${post}% after mitigation.`,
    ];

    if (urgent) {
      lines.push('Worsening exceeds 30% — immediate rollback consideration recommended.');
    } else {
      lines.push('Review whether the worsening is causally related to this mitigation before rolling back.');
    }

    if (outcome.confidence < 0.8) {
      lines.push(`Note: Analysis based on ${Math.round(outcome.confidence * 3)} samples — confidence ${(outcome.confidence * 100).toFixed(0)}%.`);
    }

    return lines.join(' ');
  }
}
