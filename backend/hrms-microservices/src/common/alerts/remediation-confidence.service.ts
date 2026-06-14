import { Injectable, Logger } from '@nestjs/common';
import { MitigationOutcomeService, MitigationOutcome, OutcomeVerdict } from './mitigation-outcome.service';
import { MitigationActionType, SloId } from './slo.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfidenceRecord {
  action:              MitigationActionType;
  sloId:               SloId;
  /** 0–100: percentage of analyzed executions rated EFFECTIVE */
  successPct:          number;
  /** 0–100: percentage rated WORSENED — informs rollback policy */
  worsenedPct:         number;
  /** 0–1: how much to trust this record (based on sample count) */
  dataConfidence:      number;
  totalAnalyzed:       number;
  /** Estimated median minutes to SLO recovery when EFFECTIVE */
  expectedRecoveryMin: number | null;
  /** Recommended: successPct ≥ 50 AND worsenedPct < 25 */
  recommended:         boolean;
  lastUpdated:         string;
}

export interface RankedMitigation {
  rank:       number;
  action:     MitigationActionType;
  confidence: ConfidenceRecord;
  /** Human-readable recommendation text */
  rationale:  string;
}

/**
 * REMEDIATION CONFIDENCE ENGINE — Phase AF
 *
 * Aggregates historical mitigation outcomes into confidence-weighted rankings.
 *
 * ── Purpose ───────────────────────────────────────────────────────────────────
 *  MitigationOutcomeService answers: "did this specific mitigation work?"
 *  RemediationConfidenceService answers: "what should we try next time?"
 *
 *  It transforms the verdict history into:
 *   - Per-action success probability per SLO
 *   - Expected recovery time for effective mitigations
 *   - Ranked remediation recommendations for a given SLO under pressure
 *   - Rollback risk assessment (worsenedPct)
 *
 * ── Evidence-based automation path ───────────────────────────────────────────
 *  As confidence records accumulate, the platform gains the foundation for:
 *  1. "The last 12 times we ran priority_rebuild for projection-lag, it was
 *     effective in 92% of cases and the SLO recovered in ~8 minutes."
 *  2. "reduce_concurrency for ai-recompute has worsened conditions 31% of the
 *     time — show HIGH warning when operator selects this action."
 *  3. Auto-rank mitigation proposals in MitigationView based on confidence.
 *
 * ── Confidence data model ─────────────────────────────────────────────────────
 *  dataConfidence = min(1, sampleCount / 10)
 *    Below 10 samples → confidence < 1 → suppress auto-recommendations.
 *    10+ samples → full confidence weight applied.
 *
 *  This prevents premature automation on sparse data.
 *
 * ── Bootstrap behavior ────────────────────────────────────────────────────────
 *  When no outcome history exists (fresh deployment, first incidents):
 *   - getConfidence() returns null
 *   - getRankedMitigations() returns an empty array
 *   - The UI shows "insufficient data" rather than fabricated scores
 *
 *  Hardcoded heuristics are explicitly AVOIDED. All rankings are evidence-derived.
 */
@Injectable()
export class RemediationConfidenceService {
  private readonly logger = new Logger(RemediationConfidenceService.name);

  /** Minimum outcomes before a record is marked `recommended` */
  private readonly MIN_SAMPLES_FOR_RECOMMENDATION = 5;

  constructor(private readonly outcomeService: MitigationOutcomeService) {}

  // ── Confidence Computation ────────────────────────────────────────────────

  /**
   * Compute a ConfidenceRecord for a specific (action, sloId) pair.
   * Returns null if insufficient data exists.
   */
  getConfidence(action: MitigationActionType, sloId: SloId): ConfidenceRecord | null {
    const outcomes = this.outcomeService.getOutcomes(500)
      .filter(o => o.action === action && o.sloId === sloId);

    if (outcomes.length === 0) return null;

    const effective = outcomes.filter(o => o.verdict === 'EFFECTIVE');
    const worsened  = outcomes.filter(o => o.verdict === 'WORSENED');

    const successPct   = Math.round((effective.length / outcomes.length) * 100);
    const worsenedPct  = Math.round((worsened.length  / outcomes.length) * 100);
    const dataConf     = Math.min(1, outcomes.length / 10);
    const recommended  = outcomes.length >= this.MIN_SAMPLES_FOR_RECOMMENDATION
                         && successPct >= 50 && worsenedPct < 25;

    // Estimate expected recovery time from EFFECTIVE outcomes
    const recoveryTimes = effective
      .map(o => this.estimateRecoveryMinutes(o))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const expectedRecoveryMin = recoveryTimes.length > 0
      ? recoveryTimes[Math.floor(recoveryTimes.length / 2)] // median
      : null;

    return {
      action, sloId, successPct, worsenedPct, dataConfidence: dataConf,
      totalAnalyzed: outcomes.length, expectedRecoveryMin,
      recommended,
      lastUpdated: outcomes[0].resolvedAt,
    };
  }

  /**
   * Returns all confidence records across all observed (action, sloId) pairs.
   */
  getAllConfidenceRecords(): ConfidenceRecord[] {
    const summary = this.outcomeService.getActionSummary();
    return summary
      .map(s => this.getConfidence(s.action as MitigationActionType, s.sloId))
      .filter((r): r is ConfidenceRecord => r !== null)
      .sort((a, b) => b.successPct - a.successPct);
  }

  /**
   * Returns ranked mitigation recommendations for a given SLO under pressure.
   * Rankings are sorted by: successPct DESC, then worsenedPct ASC.
   * Only records with dataConfidence ≥ 0.3 (≥ 3 samples) are included.
   */
  getRankedMitigations(sloId: SloId): RankedMitigation[] {
    const all = this.getAllConfidenceRecords()
      .filter(r => r.sloId === sloId && r.dataConfidence >= 0.3)
      .sort((a, b) => {
        // Primary: success rate descending
        if (b.successPct !== a.successPct) return b.successPct - a.successPct;
        // Secondary: worsened rate ascending
        return a.worsenedPct - b.worsenedPct;
      });

    return all.map((c, idx) => ({
      rank:       idx + 1,
      action:     c.action,
      confidence: c,
      rationale:  this.buildRationale(c),
    }));
  }

  /**
   * Returns a confidence score (0–100) for a specific action about to be proposed.
   * Used by MitigationSignalService to annotate signals before proposing.
   * Returns null if insufficient data.
   */
  getActionScore(action: MitigationActionType, sloId: SloId): number | null {
    const record = this.getConfidence(action, sloId);
    if (!record || record.dataConfidence < 0.3) return null;
    // Weight by both success rate and data confidence
    return Math.round(record.successPct * record.dataConfidence);
  }

  // ── Summary Query ─────────────────────────────────────────────────────────

  /**
   * Full diagnostic summary across all observed (action, sloId) combinations.
   * Useful for the RemediationPanel dashboard.
   */
  getDashboardSummary(): {
    totalActionsTracked: number;
    topRecommended:      ConfidenceRecord[];
    highRollbackRisk:    ConfidenceRecord[];
    insufficientData:    number;
  } {
    const all        = this.getAllConfidenceRecords();
    const incomplete = this.outcomeService.getActionSummary()
      .filter(s => (s.totalAnalyzed ?? 0) < this.MIN_SAMPLES_FOR_RECOMMENDATION).length;

    return {
      totalActionsTracked: all.length,
      topRecommended:      all.filter(r => r.recommended).slice(0, 5),
      highRollbackRisk:    all.filter(r => r.worsenedPct >= 25).slice(0, 5),
      insufficientData:    incomplete,
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private estimateRecoveryMinutes(outcome: MitigationOutcome): number | null {
    const exec    = new Date(outcome.executedAt).getTime();
    const resolved = new Date(outcome.resolvedAt).getTime();
    if (isNaN(exec) || isNaN(resolved) || resolved <= exec) return null;
    return Math.round((resolved - exec) / 60000);
  }

  private buildRationale(c: ConfidenceRecord): string {
    const parts: string[] = [];

    if (c.successPct >= 80) {
      parts.push(`Highly effective (${c.successPct}% success across ${c.totalAnalyzed} incidents)`);
    } else if (c.successPct >= 50) {
      parts.push(`Moderately effective (${c.successPct}% success)`);
    } else {
      parts.push(`Low success rate (${c.successPct}% success) — use with caution`);
    }

    if (c.expectedRecoveryMin !== null) {
      parts.push(`Typical recovery: ~${c.expectedRecoveryMin}m`);
    }
    if (c.worsenedPct >= 25) {
      parts.push(`⚠ High rollback risk (worsened ${c.worsenedPct}% of the time)`);
    }
    if (c.dataConfidence < 0.5) {
      parts.push(`Limited data (${c.totalAnalyzed} samples — confidence improving)`);
    }

    return parts.join(' · ');
  }
}
