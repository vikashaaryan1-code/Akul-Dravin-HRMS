import { Injectable, Logger } from '@nestjs/common';
import { WorkflowOutcomeService, PlanOutcomeRecord } from './workflow-outcome.service';

// ── Weight Vector ─────────────────────────────────────────────────────────────

export interface DimensionWeights {
  urgency:       number; // baseline: 0.35
  confidence:    number; // baseline: 0.30
  blastRadius:   number; // baseline: 0.15
  rollbackRisk:  number; // baseline: 0.12
  recoveryTime:  number; // baseline: 0.08
}

export const BASELINE_WEIGHTS: DimensionWeights = {
  urgency:      0.35,
  confidence:   0.30,
  blastRadius:  0.15,
  rollbackRisk: 0.12,
  recoveryTime: 0.08,
};

const WEIGHT_MIN = 0.05;
const WEIGHT_MAX = 0.50;
const EMA_ALPHA  = 0.10; // learning rate — slow adaptation (10% toward candidate)
const ADJUSTMENT_CAP = 0.03; // maximum change per update cycle

/**
 * ADAPTIVE WEIGHT TUNER — Phase AS-4
 *
 * Dynamically adjusts the 5-dimension utility scorer weights based on
 * observed workflow outcomes, converging toward weights that better
 * predict operational success.
 *
 * ── Learning mechanism ────────────────────────────────────────────────────────
 *
 *  Each completed plan execution provides a signal vector:
 *
 *   signal[urgency]      = did high-urgency plans succeed more than low-urgency?
 *   signal[confidence]   = did high-confidence plans succeed?
 *   signal[blastRadius]  = did low-blast-radius plans avoid compensation?
 *   signal[rollbackRisk] = did low-rollback-risk plans avoid COMPENSATING state?
 *   signal[recoveryTime] = did short-recovery plans complete within P50?
 *
 *  The adjustment is an EMA of the outcome signal:
 *    new_weight = 0.90 × current_weight + 0.10 × candidate_weight
 *
 *  Weights are bounded [WEIGHT_MIN, WEIGHT_MAX] and re-normalized to sum=1.0
 *  after each update to preserve the utility score's composite semantics.
 *
 * ── Stability guarantees ──────────────────────────────────────────────────────
 *
 *  1. WEIGHT_MIN (0.05): no dimension can become irrelevant
 *  2. WEIGHT_MAX (0.50): no single dimension can dominate
 *  3. ADJUSTMENT_CAP (0.03): maximum change per update cycle — prevents oscillation
 *  4. EMA_ALPHA (0.10): slow convergence — resists transient noise
 *  5. Normalization: weights always sum to 1.0 after adjustment
 *  6. Bootstrap: returns BASELINE_WEIGHTS until 10 outcomes are recorded
 *
 * ── What this enables ─────────────────────────────────────────────────────────
 *
 *  After sufficient execution history, the platform can answer:
 *
 *  "In this environment, confidence is actually the strongest predictor of
 *   success — it should carry more weight than urgency."
 *
 *  or:
 *
 *  "Blast radius consistently causes compensation. We should penalize
 *   high-blast-radius mitigations more aggressively in arbitration."
 *
 * ── Integration point ─────────────────────────────────────────────────────────
 *
 *  ArbitrationUtilityScorer.getAdaptiveWeights() calls this service.
 *  Updated weights are pulled each tick — no restart required.
 *  The scorer falls back to BASELINE_WEIGHTS if this service returns null.
 */
@Injectable()
export class AdaptiveWeightTuner {
  private readonly logger = new Logger(AdaptiveWeightTuner.name);
  private currentWeights: DimensionWeights = { ...BASELINE_WEIGHTS };
  private tuningCycles = 0;
  private readonly MIN_SAMPLES_FOR_TUNING = 10;

  constructor(private readonly outcomeService: WorkflowOutcomeService) {}

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Returns current adaptive weights.
   * Before MIN_SAMPLES_FOR_TUNING outcomes: returns BASELINE_WEIGHTS (no adaptation).
   */
  getWeights(): DimensionWeights {
    return { ...this.currentWeights };
  }

  /**
   * Triggers a weight tuning cycle using the latest outcome records.
   * Call once per coordination tick or after a batch of plan completions.
   */
  tune(): void {
    const outcomes = this.outcomeService.getRecentOutcomes(50);
    if (outcomes.length < this.MIN_SAMPLES_FOR_TUNING) {
      // Not enough data — hold at baseline
      return;
    }

    const candidate = this.computeCandidateWeights(outcomes);
    const adjusted  = this.applyEmaWithCap(this.currentWeights, candidate);
    const normalized = this.normalize(adjusted);

    const drift = this.maxWeightDrift(this.currentWeights, normalized);
    if (drift > 0.001) {
      this.logger.log(
        `[WeightTuner] Cycle ${++this.tuningCycles}: ` +
        `urgency=${normalized.urgency.toFixed(3)} ` +
        `confidence=${normalized.confidence.toFixed(3)} ` +
        `blast=${normalized.blastRadius.toFixed(3)} ` +
        `rollback=${normalized.rollbackRisk.toFixed(3)} ` +
        `recovery=${normalized.recoveryTime.toFixed(3)} ` +
        `(Δmax=${drift.toFixed(3)})`,
      );
    }

    this.currentWeights = normalized;
  }

  /** Force-reset to baseline (e.g. after a major platform topology change). */
  reset(): void {
    this.currentWeights = { ...BASELINE_WEIGHTS };
    this.tuningCycles   = 0;
    this.logger.warn('[WeightTuner] Weights reset to baseline');
  }

  getTuningCycles():   number          { return this.tuningCycles; }
  getBaselineWeights(): DimensionWeights { return { ...BASELINE_WEIGHTS }; }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * Derive candidate weight adjustments from outcome batch.
   *
   * For each dimension, we compute a normalized "signal" representing
   * how much that dimension contributed to outcomes in the batch.
   *
   * Simplified signal logic:
   *   - urgency:      succeeded plans should have higher urgency correlation
   *   - confidence:   succeeded plans should have been high-confidence calls
   *   - blastRadius:  compensated plans should correlate with high blast radius
   *   - rollbackRisk: compensated plans should correlate with high rollback risk
   *   - recoveryTime: faster-completing plans should reinforce lower recoveryTime weight
   */
  private computeCandidateWeights(outcomes: PlanOutcomeRecord[]): DimensionWeights {
    const succeeded   = outcomes.filter(o => o.outcome === 'SUCCEEDED');
    const compensated = outcomes.filter(o => o.outcome === 'COMPENSATED');

    // Success ratio — if high, confidence is a strong predictor
    const successRatio = succeeded.length / outcomes.length;

    // Compensation ratio — if high, blast radius and rollback risk are under-weighted
    const compRatio = compensated.length / outcomes.length;

    // Average step completion ratio — if low, urgency alignment matters more
    const avgStepCompletion = outcomes.reduce((s, o) => s + (o.succeededSteps / Math.max(1, o.totalSteps)), 0) / outcomes.length;

    // Signal vector (how much to shift each dimension)
    // These are heuristic signals — not ground truth correlations
    const urgencySignal      = avgStepCompletion < 0.7 ? 0.02 : -0.01;
    const confidenceSignal   = successRatio > 0.7 ? 0.02 : 0.0;
    const blastSignal        = compRatio > 0.3 ? 0.02 : -0.01;
    const rollbackSignal     = compRatio > 0.3 ? 0.01 : -0.01;
    const recoverySignal     = successRatio > 0.8 ? -0.01 : 0.01;

    return {
      urgency:      Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, this.currentWeights.urgency + urgencySignal)),
      confidence:   Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, this.currentWeights.confidence + confidenceSignal)),
      blastRadius:  Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, this.currentWeights.blastRadius + blastSignal)),
      rollbackRisk: Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, this.currentWeights.rollbackRisk + rollbackSignal)),
      recoveryTime: Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, this.currentWeights.recoveryTime + recoverySignal)),
    };
  }

  /** Apply EMA with per-dimension adjustment cap. */
  private applyEmaWithCap(current: DimensionWeights, candidate: DimensionWeights): DimensionWeights {
    const applyDim = (cur: number, can: number): number => {
      const ema   = (1 - EMA_ALPHA) * cur + EMA_ALPHA * can;
      const delta = Math.max(-ADJUSTMENT_CAP, Math.min(ADJUSTMENT_CAP, ema - cur));
      return cur + delta;
    };
    return {
      urgency:      applyDim(current.urgency,      candidate.urgency),
      confidence:   applyDim(current.confidence,   candidate.confidence),
      blastRadius:  applyDim(current.blastRadius,  candidate.blastRadius),
      rollbackRisk: applyDim(current.rollbackRisk, candidate.rollbackRisk),
      recoveryTime: applyDim(current.recoveryTime, candidate.recoveryTime),
    };
  }

  /** Re-normalize weights to sum to exactly 1.0. */
  private normalize(w: DimensionWeights): DimensionWeights {
    const total = w.urgency + w.confidence + w.blastRadius + w.rollbackRisk + w.recoveryTime;
    return {
      urgency:      w.urgency      / total,
      confidence:   w.confidence   / total,
      blastRadius:  w.blastRadius  / total,
      rollbackRisk: w.rollbackRisk / total,
      recoveryTime: w.recoveryTime / total,
    };
  }

  private maxWeightDrift(a: DimensionWeights, b: DimensionWeights): number {
    return Math.max(
      Math.abs(a.urgency - b.urgency),
      Math.abs(a.confidence - b.confidence),
      Math.abs(a.blastRadius - b.blastRadius),
      Math.abs(a.rollbackRisk - b.rollbackRisk),
      Math.abs(a.recoveryTime - b.recoveryTime),
    );
  }
}
