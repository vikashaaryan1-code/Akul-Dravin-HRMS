import { Injectable, Logger } from '@nestjs/common';
import { MitigationPlanExecution, PlanState } from './mitigation-plan.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlanOutcomeResult = 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'COMPENSATED';

export interface PlanOutcomeRecord {
  executionId:       string;
  planId:            string;
  planName:          string;
  outcome:           PlanOutcomeResult;
  startedAt:         string;
  completedAt:       string;
  durationMs:        number;
  totalSteps:        number;
  succeededSteps:    number;
  failedStepId?:     string;
  compensatedSteps:  string[];
}

export interface PlanConfidenceRecord {
  planId:            string;
  planName:          string;
  /** 0–100 */
  successPct:        number;
  /** 0–100: % of executions that entered COMPENSATING state */
  compensationRate:  number;
  /** Median execution duration in minutes for SUCCEEDED runs */
  medianDurationMin: number | null;
  totalExecutions:   number;
  /** True if successPct ≥ 60 AND compensationRate < 30 AND ≥ 3 samples */
  recommended:       boolean;
  lastUpdated:       string;
}

/**
 * WORKFLOW OUTCOME SERVICE — Phase AR-L
 *
 * Tracks plan execution outcomes and derives per-plan confidence records.
 *
 * ── Purpose ───────────────────────────────────────────────────────────────────
 *
 *  RemediationConfidenceService answers: "which single action works best?"
 *  WorkflowOutcomeService answers:       "which multi-step plan works best?"
 *
 *  It transforms plan execution history into:
 *   - Per-plan success probability
 *   - Expected recovery duration
 *   - Compensation rate (proxy for plan stability)
 *   - Ranked plan recommendations
 *
 * ── Evidence-based plan selection ────────────────────────────────────────────
 *
 *  As outcomes accumulate, operators can see:
 *  "DLQ Recovery Pipeline succeeded in 92% of executions (12 samples, ~18m median)"
 *  "Fast Burn Emergency has 40% compensation rate — review step timeouts"
 *
 * ── Bootstrap behavior ────────────────────────────────────────────────────────
 *
 *  With < 3 executions for a plan: confidence record exists but recommended=false.
 *  With 0 executions: no confidence record returned.
 *
 * ── Storage ──────────────────────────────────────────────────────────────────
 *
 *  Phase AR-L stores outcomes in-memory (bounded: last 500 records).
 *  Phase AR-L+: migrate to PostgreSQL plan_outcome_records table for
 *  cross-deployment persistence and trend analysis.
 */
@Injectable()
export class WorkflowOutcomeService {
  private readonly logger  = new Logger(WorkflowOutcomeService.name);
  private readonly records = new Map<string, PlanOutcomeRecord[]>(); // planId → records
  private readonly MAX_RECORDS_PER_PLAN = 100;

  // ── Recording ─────────────────────────────────────────────────────────────

  /**
   * Record the outcome of a completed plan execution.
   * Call from MitigationPlanExecutor.checkPlanCompletion().
   */
  recordOutcome(execution: MitigationPlanExecution): void {
    if (!execution.completedAt) return;

    const outcome = this.deriveOutcome(execution.state);
    const durationMs = new Date(execution.completedAt).getTime()
      - new Date(execution.startedAt).getTime();

    const failedStep = execution.steps.find(s => s.state === 'FAILED');
    const compensated = execution.steps
      .filter(s => s.state === 'COMPENSATING')
      .map(s => s.stepName);

    const record: PlanOutcomeRecord = {
      executionId:      execution.id,
      planId:           execution.planId,
      planName:         execution.planName,
      outcome,
      startedAt:        execution.startedAt,
      completedAt:      execution.completedAt,
      durationMs,
      totalSteps:       execution.steps.length,
      succeededSteps:   execution.steps.filter(s => s.state === 'SUCCEEDED').length,
      failedStepId:     failedStep?.stepId,
      compensatedSteps: compensated,
    };

    const planRecords = this.records.get(execution.planId) ?? [];
    planRecords.unshift(record); // newest first
    if (planRecords.length > this.MAX_RECORDS_PER_PLAN) planRecords.splice(this.MAX_RECORDS_PER_PLAN);
    this.records.set(execution.planId, planRecords);

    this.logger.log(
      `[WorkflowOutcome] ${execution.planName} → ${outcome} ` +
      `(${Math.round(durationMs / 60000)}m, ${record.succeededSteps}/${record.totalSteps} steps)`,
    );
  }

  // ── Confidence ────────────────────────────────────────────────────────────

  getConfidence(planId: string): PlanConfidenceRecord | null {
    const records = this.records.get(planId);
    if (!records || records.length === 0) return null;

    const succeeded    = records.filter(r => r.outcome === 'SUCCEEDED');
    const compensated  = records.filter(r => r.outcome === 'COMPENSATED');
    const successPct   = Math.round((succeeded.length / records.length) * 100);
    const compRate     = Math.round((compensated.length / records.length) * 100);
    const recommended  = records.length >= 3 && successPct >= 60 && compRate < 30;

    const durations = succeeded
      .map(r => r.durationMs / 60000)
      .sort((a, b) => a - b);
    const medianDurationMin = durations.length > 0
      ? durations[Math.floor(durations.length / 2)]
      : null;

    const planName = records[0].planName;
    return {
      planId, planName, successPct, compensationRate: compRate,
      medianDurationMin: medianDurationMin !== null ? Math.round(medianDurationMin) : null,
      totalExecutions: records.length, recommended,
      lastUpdated: records[0].completedAt,
    };
  }

  /**
   * All confidence records sorted by successPct descending.
   * Only plans with at least one completed execution are included.
   */
  getAllConfidence(): PlanConfidenceRecord[] {
    return [...this.records.keys()]
      .map(planId => this.getConfidence(planId))
      .filter((r): r is PlanConfidenceRecord => r !== null)
      .sort((a, b) => b.successPct - a.successPct);
  }

  getRecentOutcomes(limit = 20): PlanOutcomeRecord[] {
    const all = [...this.records.values()].flat()
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return all.slice(0, limit);
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private deriveOutcome(state: PlanState): PlanOutcomeResult {
    switch (state) {
      case 'SUCCEEDED':    return 'SUCCEEDED';
      case 'FAILED':       return 'FAILED';
      case 'ABORTED':      return 'ABORTED';
      case 'COMPENSATING': return 'COMPENSATED';
      default:             return 'FAILED';
    }
  }
}
