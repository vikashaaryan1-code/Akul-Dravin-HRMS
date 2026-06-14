import { Injectable, Logger } from '@nestjs/common';
import { MitigationPlanDef, MitigationStepDef } from './mitigation-plan.types';
import { WorkflowOutcomeService } from './workflow-outcome.service';
import { MitigationSignal } from './slo.types';
import { ResourceReservation, WaitingReservation } from './resource-reservation.types';

// ── Result Types ──────────────────────────────────────────────────────────────

export type SimulationRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ── Phase AT-3: Reservation Forecasting ─────────────────────────────────────

/**
 * Per-step reservation clash classification before plan execution.
 *  FREE           — no active reservation on this resource
 *  HELD_BY_SELF   — this plan already holds the reservation (inherited/reserved)
 *  HELD_BY_HIGHER — a higher-urgency owner holds it; must wait for release
 *  HELD_BY_LOWER  — a lower-urgency owner holds it; supersession may be possible
 *  IN_WAIT_QUEUE  — resource free but others are waiting; may need to queue
 */
export type ReservationClashStatus =
  | 'FREE' | 'HELD_BY_SELF' | 'HELD_BY_HIGHER' | 'HELD_BY_LOWER' | 'IN_WAIT_QUEUE';

export interface StepReservationForecast {
  resourceKey:                   string;
  status:                        ReservationClashStatus;
  currentOwnerLabel?:            string;
  waitQueueDepth:                number;
  reservationConflictLikelihood: number; // 0-1
  supersessionLikelihood:        number; // 0-1: probability this plan can supersede
  estimatedWaitForReservationMin: number; // 0 if FREE or HELD_BY_SELF
}

export interface ReservationForecast {
  steps:                      StepReservationForecast[];
  resourcesWithConflict:      string[]; // resources where status != FREE
  supersessionOpportunities:  string[]; // resources where we could supersede
  starvationProbability:      number;   // 0-1: P(≥1 step stuck indefinitely in queue)
  leaseChurnRisk:             'LOW' | 'MEDIUM' | 'HIGH'; // rapid ownership changes risk
}

export interface StepSimulationResult {
  stepId:         string;
  stepName:       string;
  action:         string;
  targetResource: string;
  conflictProbability:  number;
  estimatedDurationMin: number;
  successProbability:   number;
  blastRadius:          number;
  criticalPathRisk:     SimulationRisk;
  reservationForecast?: StepReservationForecast; // Phase AT-3
  notes: string[];
}

export interface WorkflowSimulationResult {
  planId:   string;
  planName: string;
  overallSuccessProbability: number;
  expectedDurationP50Min:    number;
  expectedDurationP90Min:    number;
  contentionProbability:     number;
  highestRiskStep:           StepSimulationResult | null;
  steps:                     StepSimulationResult[];
  overallRisk:               SimulationRisk;
  recommendation:            'PROCEED' | 'PROCEED_WITH_CAUTION' | 'REVIEW_BEFORE_PROCEEDING' | 'ABORT';
  recommendationReason:      string;
  reservationForecast:       ReservationForecast; // Phase AT-3
  simulatedAt:               string;
}

// ── Resource Blast Radius Reference (same as ArbitrationUtilityScorer) ────────

const RESOURCE_BLAST: Array<[string, number]> = [
  ['queue:all',           0.90],
  ['projection:all',      0.90],
  ['queue:payroll',       0.70],
  ['projection:workforce',0.60],
  ['queue:ai-jobs',       0.50],
  ['queue:analytics',     0.40],
  ['queue:',              0.40],
  ['projection:',         0.35],
];

function blastRadiusFor(resource: string): number {
  for (const [prefix, score] of RESOURCE_BLAST) {
    if (resource.startsWith(prefix)) return score;
  }
  return 0.25;
}

// ── Success Predicate Duration Estimates (minutes) ────────────────────────────

function predicateDurationMin(step: MitigationStepDef): number {
  const pred = step.successPredicate;
  switch (pred.type) {
    case 'STABILIZED':        return Math.round(pred.stabilizationMs / 60000) + 2; // +2min margin
    case 'TIME_BASED':        return Math.round(pred.waitMs / 60000);
    case 'SIGNAL_RESOLVED':   return 3;  // typical signal lifecycle
    case 'OPERATOR_CONFIRMED': return 15; // conservative estimate for human response
  }
}

/**
 * WORKFLOW SIMULATOR — Phase AS-3
 *
 * Deterministic workflow simulation engine that estimates plan execution
 * outcomes before the plan is started.
 *
 * ── What it simulates ────────────────────────────────────────────────────────
 *
 *  For each plan step, the simulator computes:
 *
 *  1. conflictProbability — how likely this step will be deferred by the
 *     scheduler, based on the number of active signals on the same resource.
 *
 *  2. successProbability — from WorkflowOutcomeService per-plan step success
 *     rates (if available) or from blast radius as a proxy baseline.
 *
 *  3. estimatedDurationMin — from the step's successPredicate type plus a
 *     deferral overhead multiplier if conflictProbability > 0.3.
 *
 *  4. blastRadius — from the resource blast radius table.
 *
 * ── P50 vs P90 ───────────────────────────────────────────────────────────────
 *
 *  P50 = sum of step durations (no deferral assumed)
 *  P90 = P50 + Σ(conflictProbability × TICK_MIN × deferralOverhead)
 *       where TICK_MIN = 5 (scheduler tick interval)
 *       and deferralOverhead accounts for multiple deferrals
 *
 * ── Deterministic, not stochastic ────────────────────────────────────────────
 *
 *  This is not a Monte Carlo simulator. It produces point estimates from
 *  known data (outcome history, active signal count, blast radius tables).
 *  That makes results explainable and auditable — aligned with the platform's
 *  governance philosophy.
 */
@Injectable()
export class WorkflowSimulator {
  private readonly logger = new Logger(WorkflowSimulator.name);

  constructor(private readonly outcomeService: WorkflowOutcomeService) {}

  simulate(
    plan: MitigationPlanDef,
    activeSignals: MitigationSignal[],
    activeReservations: ResourceReservation[] = [],
    waitQueues: Record<string, WaitingReservation[]> = {},
  ): WorkflowSimulationResult {
    const now = new Date().toISOString();
    const confidence = this.outcomeService.getConfidence(plan.id);

    const stepResults: StepSimulationResult[] = plan.steps.map(step => {
      const base    = this.simulateStep(step, activeSignals, confidence);
      const resFcst = this.simulateStepReservation(step, activeReservations, waitQueues);
      return { ...base, reservationForecast: resFcst };
    });

    const overallSuccessProbability = stepResults.reduce((prob, s, idx) => {
      if (!plan.steps[idx].criticalPath) return prob;
      return prob * s.successProbability;
    }, 1.0);

    const p50 = stepResults.reduce((s, r) => s + r.estimatedDurationMin, 0);
    const deferralOverhead = stepResults.reduce((s, r) => s + (r.conflictProbability * 5 * (1 + r.conflictProbability)), 0);
    const p90 = p50 + deferralOverhead;
    const contentionProbability = 1 - stepResults.reduce((p, r) => p * (1 - r.conflictProbability), 1.0);
    const highestRiskStep = [...stepResults].sort((a, b) => b.blastRadius - a.blastRadius)[0] ?? null;
    const overallRisk = this.deriveRisk(overallSuccessProbability, highestRiskStep?.blastRadius ?? 0);
    const { recommendation, reason } = this.deriveRecommendation(overallSuccessProbability, overallRisk, contentionProbability, confidence);

    // Phase AT-3: aggregate reservation forecast
    const reservationForecast = this.aggregateReservationForecast(
      stepResults.map(s => s.reservationForecast!).filter(Boolean),
    );

    this.logger.debug(`[WorkflowSimulator] ${plan.name}: success=${(overallSuccessProbability*100).toFixed(0)}% P50=${Math.round(p50)}m → ${recommendation}`);

    return {
      planId: plan.id, planName: plan.name,
      overallSuccessProbability: Math.round(overallSuccessProbability * 100) / 100,
      expectedDurationP50Min:   Math.round(p50),
      expectedDurationP90Min:   Math.round(p90),
      contentionProbability:    Math.round(contentionProbability * 100) / 100,
      highestRiskStep, steps: stepResults, overallRisk, recommendation,
      recommendationReason: reason, reservationForecast, simulatedAt: now,
    };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  /**
   * Phase AT-3: Per-step reservation clash simulation.
   * Checks active reservations for this step's resource and classifies the ownership relationship.
   */
  private simulateStepReservation(
    step:               MitigationStepDef,
    activeReservations: ResourceReservation[],
    waitQueues:         Record<string, WaitingReservation[]>,
  ): StepReservationForecast {
    const resource = step.targetResource ?? '';
    const reserv   = activeReservations.find(r => r.resourceKey === resource && r.status === 'ACTIVE');
    const queue    = waitQueues[resource] ?? [];
    const urgencyRank: Record<string, number> = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };

    let status: ReservationClashStatus = 'FREE';
    let currentOwnerLabel: string | undefined;
    let reservationConflictLikelihood = 0;
    let supersessionLikelihood = 0;
    let estimatedWaitForReservationMin = 0;

    if (reserv) {
      const stepRank  = urgencyRank[step.urgency] ?? 1;
      const ownerRank = urgencyRank[reserv.urgency] ?? 1;
      currentOwnerLabel = reserv.ownerLabel;

      if (stepRank > ownerRank) {
        status = 'HELD_BY_LOWER';
        // Supersession is possible when urgency is higher (utility delta unknown at sim time)
        supersessionLikelihood = 0.70; // conservative — actual delta depends on runtime score
      } else {
        status = 'HELD_BY_HIGHER';
        reservationConflictLikelihood = 0.85;
        // Estimate wait as remaining TTL
        estimatedWaitForReservationMin = Math.max(
          0, Math.round((new Date(reserv.expiresAt).getTime() - Date.now()) / 60000),
        );
      }
    } else if (queue.length > 0) {
      status = 'IN_WAIT_QUEUE';
      reservationConflictLikelihood = Math.min(0.95, queue.length * 0.40);
      estimatedWaitForReservationMin = queue.length * 5;
    }

    return {
      resourceKey: resource, status, currentOwnerLabel, waitQueueDepth: queue.length,
      reservationConflictLikelihood, supersessionLikelihood, estimatedWaitForReservationMin,
    };
  }

  private aggregateReservationForecast(stepForecasts: StepReservationForecast[]): ReservationForecast {
    const resourcesWithConflict   = stepForecasts.filter(s => s.status !== 'FREE').map(s => s.resourceKey);
    const supersessionOpportunities = stepForecasts.filter(s => s.status === 'HELD_BY_LOWER').map(s => s.resourceKey);
    // starvation probability: any step stuck behind queue depth ≥ 2
    const deepQueues = stepForecasts.filter(s => s.waitQueueDepth >= 2).length;
    const starvationProbability = Math.min(0.95, deepQueues * 0.35);
    // lease churn: many SUPERSEDED opportunities indicates frequent ownership changes
    const leaseChurnRisk: ReservationForecast['leaseChurnRisk'] =
      supersessionOpportunities.length >= 3 ? 'HIGH'
      : supersessionOpportunities.length >= 1 ? 'MEDIUM'
      : 'LOW';
    return { steps: stepForecasts, resourcesWithConflict, supersessionOpportunities, starvationProbability, leaseChurnRisk };
  }

  private simulateStep(
    step:          MitigationStepDef,
    activeSignals: MitigationSignal[],
    planConf:      ReturnType<WorkflowOutcomeService['getConfidence']>,
  ): StepSimulationResult {
    const notes: string[] = [];
    const targetResource = step.targetResource || 'GLOBAL';

    // ── Conflict probability ───────────────────────────────────────────────
    // Count active signals on the same or overlapping resources
    const conflictingSignals = activeSignals.filter(s =>
      s.targetResource === targetResource ||
      (targetResource.includes('all') && s.targetResource.startsWith(targetResource.replace('all', ''))),
    ).length;
    const conflictProbability = Math.min(0.95, conflictingSignals * 0.35);
    if (conflictProbability > 0.3) notes.push(`${conflictingSignals} active signal(s) on ${targetResource} — deferral likely`);

    // ── Base step success probability ─────────────────────────────────────
    // Use plan confidence if available, else derive from blast radius (proxy)
    let successProbability: number;
    if (planConf && planConf.totalExecutions >= 3) {
      // Adjust plan success rate by this step's blast radius (higher blast = lower step success)
      const blastPenalty = blastRadiusFor(targetResource) * 0.15;
      successProbability = Math.max(0.30, (planConf.successPct / 100) - blastPenalty);
      notes.push(`Based on ${planConf.totalExecutions} historical execution(s)`);
    } else {
      // No history: estimate from blast radius (low blast = higher confidence)
      successProbability = Math.max(0.40, 1.0 - blastRadiusFor(targetResource) * 0.5);
      notes.push('No execution history — estimate based on blast radius proxy');
    }

    // Deferral degrades success probability (each deferral is a chance for TTL expiry)
    successProbability *= (1 - conflictProbability * 0.15);

    // ── Duration estimate ──────────────────────────────────────────────────
    const baseDurationMin = predicateDurationMin(step);
    const deferralExtra   = conflictProbability > 0.3 ? Math.ceil(conflictProbability * 10) : 0;
    const estimatedDurationMin = baseDurationMin + deferralExtra;
    if (deferralExtra > 0) notes.push(`+${deferralExtra}m estimated deferral overhead`);

    // ── Blast radius ───────────────────────────────────────────────────────
    const blastRadius = blastRadiusFor(targetResource);
    if (blastRadius >= 0.70) notes.push('High blast radius — platform-wide impact if step fails');
    if (!step.criticalPath) notes.push('Non-critical path — plan continues on failure');

    const criticalPathRisk: SimulationRisk =
      !step.criticalPath ? 'LOW'
      : blastRadius >= 0.80 ? 'CRITICAL'
      : blastRadius >= 0.60 ? 'HIGH'
      : blastRadius >= 0.40 ? 'MEDIUM'
      : 'LOW';

    return {
      stepId: step.id, stepName: step.name, action: step.action || '', targetResource,
      conflictProbability, estimatedDurationMin,
      successProbability: Math.round(successProbability * 100) / 100,
      blastRadius, criticalPathRisk, notes,
    };
  }

  private deriveRisk(successPct: number, maxBlast: number): SimulationRisk {
    if (successPct < 0.40 || maxBlast >= 0.85) return 'CRITICAL';
    if (successPct < 0.60 || maxBlast >= 0.70) return 'HIGH';
    if (successPct < 0.75 || maxBlast >= 0.50) return 'MEDIUM';
    return 'LOW';
  }

  private deriveRecommendation(
    successPct: number, risk: SimulationRisk, contentionPct: number,
    conf: ReturnType<WorkflowOutcomeService['getConfidence']>,
  ): { recommendation: WorkflowSimulationResult['recommendation']; reason: string } {
    if (risk === 'CRITICAL' || successPct < 0.40) {
      return { recommendation: 'ABORT', reason: `Success probability ${(successPct * 100).toFixed(0)}% is below safe threshold (40%). Review plan conditions.` };
    }
    if (risk === 'HIGH' || contentionPct > 0.60) {
      return { recommendation: 'REVIEW_BEFORE_PROCEEDING', reason: `High contention (${(contentionPct * 100).toFixed(0)}%) or blast radius detected. Ensure operator approval gates are active.` };
    }
    if (successPct < 0.70 || !conf?.recommended) {
      return { recommendation: 'PROCEED_WITH_CAUTION', reason: `Success probability ${(successPct * 100).toFixed(0)}%. Plan is not yet marked recommended — insufficient execution history.` };
    }
    return { recommendation: 'PROCEED', reason: `Success probability ${(successPct * 100).toFixed(0)}% from ${conf.totalExecutions} executions. Low contention. Plan is recommended.` };
  }
}
