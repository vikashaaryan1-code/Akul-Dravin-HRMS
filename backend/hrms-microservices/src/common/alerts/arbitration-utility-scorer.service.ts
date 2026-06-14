import { Injectable, Logger } from '@nestjs/common';
import { MitigationActionType, SloId } from './slo.types';
import { MitigationPolicy } from './mitigation-policy-engine.service';
import { RemediationConfidenceService } from './remediation-confidence.service';
import { OperationalKnowledgeGraph } from './operational-knowledge-graph.service';
import { PolicyMatch } from './mitigation-policy-engine.service';

// ── Utility Score ─────────────────────────────────────────────────────────────

export interface UtilityDimension {
  name:    string;
  /** Normalized 0–1 score for this dimension */
  score:   number;
  /** Weight applied to this dimension in the composite */
  weight:  number;
  /** Raw un-normalized value (for UI display) */
  raw?:    number | string;
}

export interface UtilityScore {
  policyId:   string;
  policyName: string;
  dimensions: UtilityDimension[];
  /** Weighted composite of all dimensions (0–1) */
  composite:  number;
}

// ── Blast Radius Scope ────────────────────────────────────────────────────────

/**
 * Static resource scope map.
 * Higher score = wider operational impact = lower utility when safety matters.
 *
 * Key: exact resource ID or prefix (matched by startsWith for prefix keys).
 * Values in range [0, 1] — 0.0 = isolated, 1.0 = platform-wide impact.
 */
const RESOURCE_BLAST_RADIUS: Array<[string, number]> = [
  // Ordered from most-specific to broadest for correct prefix matching
  ['queue:ai-jobs',         0.25],
  ['queue:notifications',   0.25],
  ['queue:analytics',       0.20],
  ['queue:all',             0.90],  // affects entire queue infrastructure
  ['projection:workforce',  0.20],
  ['projection:payroll',    0.20],
  ['projection:all-domains',0.80],  // affects all domain projections
  ['projection:',           0.45],  // generic projection prefix
  ['queue:',                0.40],  // generic queue prefix
];

/**
 * ARBITRATION UTILITY SCORER — Phase AP
 *
 * Replaces the urgency/confidence/priority cascade tiebreaker in
 * PolicyArbitrationEngine with a multi-dimensional weighted utility function.
 *
 * ── Dimensions (weights must sum to 1.0) ─────────────────────────────────────
 *
 *  1. URGENCY SCORE          (weight 0.35)
 *     CRITICAL=1.0, HIGH=0.67, MEDIUM=0.33
 *     The primary driver — operational priority takes precedence.
 *
 *  2. CONFIDENCE SCORE       (weight 0.30)
 *     Historical success rate from RemediationConfidenceService (0–100 → 0–1).
 *     No data → score 0.5 (neutral). Prevents penalizing new actions unfairly.
 *
 *  3. BLAST RADIUS SCORE     (weight 0.15)
 *     INVERTED: actions with smaller blast radius score higher.
 *     score = 1 - blastRadius. Prefers contained, surgical actions.
 *
 *  4. ROLLBACK RISK SCORE    (weight 0.12)
 *     INVERTED: actions with lower worsening rate score higher.
 *     score = 1 - (worsenedPct / 100). No data → score 0.6 (slight positive bias).
 *
 *  5. RECOVERY TIME SCORE    (weight 0.08)
 *     INVERTED: faster-recovering actions score higher.
 *     Normalized: score = 1 - min(recoveryMin / 60, 1). No data → score 0.5.
 *
 * ── Total weight ─────────────────────────────────────────────────────────────
 *   0.35 + 0.30 + 0.15 + 0.12 + 0.08 = 1.00 ✓
 *
 * ── Compositing ──────────────────────────────────────────────────────────────
 *   composite = Σ(dimension.score × dimension.weight)
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   Called by PolicyArbitrationEngine.resolveIntraMatchConflicts() to sort
 *   competing candidates for the same resource. Higher composite = higher priority.
 *
 * ── Future evolution ─────────────────────────────────────────────────────────
 *   As the platform accumulates more operational history, additional dimensions
 *   can be added (e.g., dependency centrality, resource criticality, operator
 *   trust weighting) without changing the composition formula.
 */
@Injectable()
export class ArbitrationUtilityScorer {
  private readonly logger = new Logger(ArbitrationUtilityScorer.name);

  /** Weight vector — must sum to 1.0 */
  private readonly WEIGHTS = {
    urgency:      0.35,
    confidence:   0.30,
    blastRadius:  0.15,
    rollbackRisk: 0.12,
    recoveryTime: 0.08,
  } as const;

  constructor(
    private readonly confidence: RemediationConfidenceService,
    private readonly graph:      OperationalKnowledgeGraph,
  ) {}

  // ── Scoring API ───────────────────────────────────────────────────────────

  /**
   * Compute a UtilityScore for a single policy match.
   * Used to rank competing candidates for the same target resource.
   */
  score(match: PolicyMatch): UtilityScore {
    const { policy } = match;
    const conf = this.confidence.getConfidence(policy.action, policy.sloId);

    const urgencyDim     = this.scoreUrgency(policy.urgency);
    const confidenceDim  = this.scoreConfidence(policy.action, policy.sloId);
    const blastDim       = this.scoreBlastRadius(policy.targetResource);
    const rollbackDim    = this.scoreRollbackRisk(conf?.worsenedPct ?? null);
    const recoveryDim    = this.scoreRecoveryTime(conf?.expectedRecoveryMin ?? null);

    const dimensions = [urgencyDim, confidenceDim, blastDim, rollbackDim, recoveryDim];
    const composite  = dimensions.reduce((sum, d) => sum + d.score * d.weight, 0);

    return {
      policyId:   policy.id,
      policyName: policy.name,
      dimensions,
      composite:  Math.round(composite * 10000) / 10000,
    };
  }

  /**
   * Rank a set of competing policy matches by composite utility score.
   * Returns matches sorted highest composite first.
   */
  rank(matches: PolicyMatch[]): Array<{ match: PolicyMatch; utilityScore: UtilityScore }> {
    return matches
      .map(m => ({ match: m, utilityScore: this.score(m) }))
      .sort((a, b) => {
        // Primary: composite score
        const delta = b.utilityScore.composite - a.utilityScore.composite;
        if (Math.abs(delta) > 0.001) return delta > 0 ? 1 : -1;
        // Final tiebreaker: policy priority field (lower number = higher priority)
        return a.match.policy.priority - b.match.policy.priority;
      });
  }

  // ── Dimension Scorers ─────────────────────────────────────────────────────

  private scoreUrgency(urgency: string): UtilityDimension {
    const raw = urgency === 'CRITICAL' ? 1.0 : urgency === 'HIGH' ? 0.67 : 0.33;
    return { name: 'urgency', score: raw, weight: this.WEIGHTS.urgency, raw: urgency };
  }

  private scoreConfidence(action: MitigationActionType, sloId: SloId): UtilityDimension {
    const actionScore = this.confidence.getActionScore(action, sloId);
    // null = no history → neutral 0.5 (don't penalize novel actions)
    const normalized  = actionScore !== null ? actionScore / 100 : 0.5;
    return {
      name: 'confidence', score: normalized, weight: this.WEIGHTS.confidence,
      raw: actionScore !== null ? `${actionScore}%` : 'no data',
    };
  }

  private scoreBlastRadius(targetResource: string): UtilityDimension {
    const blastRadius = this.estimateBlastRadius(targetResource);
    // Inverted: smaller blast radius → higher score
    const score = 1 - blastRadius;
    return { name: 'blastRadius', score, weight: this.WEIGHTS.blastRadius, raw: blastRadius };
  }

  private scoreRollbackRisk(worsenedPct: number | null): UtilityDimension {
    // null = no history → slight positive bias (0.6) to avoid over-penalizing new actions
    const score = worsenedPct !== null ? 1 - (worsenedPct / 100) : 0.6;
    return {
      name: 'rollbackRisk', score, weight: this.WEIGHTS.rollbackRisk,
      raw: worsenedPct !== null ? `${worsenedPct}% rollback rate` : 'no data',
    };
  }

  private scoreRecoveryTime(expectedRecoveryMin: number | null): UtilityDimension {
    // Normalize: 0min=1.0 score, 60min=0.0 score, >60min clamped at 0
    const score = expectedRecoveryMin !== null
      ? Math.max(0, 1 - (expectedRecoveryMin / 60))
      : 0.5; // no data → neutral
    return {
      name: 'recoveryTime', score, weight: this.WEIGHTS.recoveryTime,
      raw: expectedRecoveryMin !== null ? `${expectedRecoveryMin}m` : 'no data',
    };
  }

  // ── Blast Radius Estimation ───────────────────────────────────────────────

  /**
   * Estimate the operational blast radius of an action on a resource.
   *
   * Uses static resource scope map (RESOURCE_BLAST_RADIUS) as the primary
   * source. Falls back to 0.5 (medium impact) for unknown resources.
   *
   * Future: supplement with OperationalKnowledgeGraph.getHotspotNodes() to
   * adjust blast radius based on how frequently this resource appears in
   * historical incident blast radii.
   */
  private estimateBlastRadius(targetResource: string): number {
    for (const [pattern, radius] of RESOURCE_BLAST_RADIUS) {
      if (targetResource === pattern) return radius;
      if (pattern.endsWith(':') && targetResource.startsWith(pattern)) return radius;
    }
    // Unknown resource → moderate conservative estimate
    return 0.5;
  }

  // ── Diagnostics ───────────────────────────────────────────────────────────

  /**
   * Return a human-readable explanation of the utility score breakdown.
   * Consumed by PolicyArbitrationView to explain tiebreaker decisions.
   */
  explain(score: UtilityScore): string {
    const dims = score.dimensions.map(d =>
      `${d.name}=${(d.score * 100).toFixed(0)}%${d.raw !== undefined ? ` (${d.raw})` : ''}`,
    ).join(', ');
    return `Composite ${(score.composite * 100).toFixed(1)}% — [${dims}]`;
  }
}
