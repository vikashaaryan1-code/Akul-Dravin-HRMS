import { MitigationActionType, SloId, MitigationState } from './slo.types';
import { PolicyMatch } from './mitigation-policy-engine.service';
import { DeferralCondition } from './mitigation-scheduler.types';

// ── Arbitration Verdict ───────────────────────────────────────────────────────

/**
 * The outcome of the arbitration engine for a single policy match.
 *
 * ALLOWED     — match proceeds to signal generation (no conflict)
 * BLOCKED     — match is permanently suppressed this tick (conflicting active mitigation)
 * DEFERRED    — match is held for the next evaluation cycle (transient conflict)
 * DOWNGRADED  — match proceeds but with reduced urgency (risk-mitigation)
 */
export type ArbitrationVerdict = 'ALLOWED' | 'BLOCKED' | 'DEFERRED' | 'DOWNGRADED';

export interface ArbitrationDecision {
  /** Policy ID being decided upon */
  policyId:        string;
  policyName:      string;
  verdict:         ArbitrationVerdict;
  /** IDs of active signals that caused this block/defer */
  blockedBySignalIds: string[];
  /** IDs of conflict rules that triggered */
  triggeredRuleIds:   string[];
  reason:          string;
  /** Only set when verdict = DOWNGRADED — new urgency */
  downgradeFrom?:  'CRITICAL' | 'HIGH';
  downgradeTo?:    'HIGH' | 'MEDIUM';
  /** Adjusted match if DOWNGRADED (same policy, lower urgency) */
  adjustedMatch?:  PolicyMatch;
  /**
   * Only set when verdict = DEFERRED.
   * Tells MitigationScheduler what condition must be satisfied before re-evaluating.
   * Populated by PolicyArbitrationEngine based on which conflict rule or
   * intra-tick resolution path caused the deferral.
   */
  suggestedDeferralCondition?: DeferralCondition;
}

export interface ArbitrationReport {
  decisions:  ArbitrationDecision[];
  allowed:    PolicyMatch[];
  blocked:    PolicyMatch[];
  deferred:   PolicyMatch[];
  /** Conflict summary: per target-resource, which policies competed? */
  conflicts: Array<{
    resource:  string;
    winner:    string;  // policy ID
    losers:    string[]; // policy IDs
    ruleId:    string;
  }>;
  evaluatedAt: string;
}

// ── Active Mitigation Snapshot ─────────────────────────────────────────────────

/**
 * Minimal snapshot of an active (non-terminal) mitigation signal.
 * Passed to the arbitration engine so it knows what is already in-flight.
 */
export interface ActiveSignalSnapshot {
  id:             string;
  policyId?:      string;
  sloId:          SloId;
  action:         MitigationActionType;
  targetResource: string;
  state:          MitigationState;
  urgency:        'CRITICAL' | 'HIGH' | 'MEDIUM';
}

// ── Conflict Rule DSL ─────────────────────────────────────────────────────────

/**
 * A conflict rule describes when a candidate policy match should be
 * BLOCKED, DEFERRED, or DOWNGRADED because another mitigation is active.
 *
 * Resource matching: supports exact match or prefix glob.
 *   'queue:ai-jobs'  → exact
 *   'queue:*'        → all queue resources
 *   '*'              → any resource
 *
 * State matching: which active signal states trigger the conflict.
 *   Defaults to [EXECUTING, STABILIZING] if not specified.
 */
export interface ConflictRule {
  id:          string;
  name:        string;
  description: string;

  // The already-active mitigation that triggers this rule
  activeAction:    MitigationActionType | '*';
  activeResource:  string;  // exact or prefix ending in '*'

  // The candidate policy match being evaluated
  candidateAction:    MitigationActionType | '*';
  candidateResource:  string;

  // Which active signal states trigger this conflict
  triggerStates?: MitigationState[];

  verdict:  'BLOCK' | 'DEFER' | 'DOWNGRADE';
  /** For DOWNGRADE only: what urgency to reduce to */
  downgradeTarget?: 'HIGH' | 'MEDIUM';

  /** Human-readable explanation for the ops dashboard */
  reason:      string;
  /** Documented engineering rationale */
  rationale:   string;
}

// ── Default Conflict Rule Set ──────────────────────────────────────────────────

/**
 * Platform-wide conflict rule set.
 *
 * These rules encode the operational knowledge of which mitigation actions
 * are mutually incompatible, dangerous to combine, or likely to create
 * feedback loops when applied concurrently.
 *
 * Rule evaluation order: rules are checked in order; first match wins.
 *
 * Each rule is documented with its rationale so the ops dashboard can
 * explain arbitration decisions in plain language.
 */
export const DEFAULT_CONFLICT_RULES: ConflictRule[] = [
  // ── Queue concurrency conflicts ────────────────────────────────────────────

  {
    id: 'cr-pause-then-circuit',
    name: 'Double Queue Suppression',
    description: 'Prevent circuit_break when queue is already paused',
    activeAction: 'pause_queue', activeResource: 'queue:*',
    candidateAction: 'circuit_break', candidateResource: 'queue:*',
    verdict: 'BLOCK',
    reason: 'Queue is already paused — adding circuit_break creates double suppression and no recovery path.',
    rationale: 'pause_queue already stops all job processing. circuit_break on the same queue would block reconnection attempts, leaving no automatic recovery mechanism and requiring manual intervention to restore normal operation.',
  },
  {
    id: 'cr-circuit-then-pause',
    name: 'Circuit Breaker + Pause Conflict',
    description: 'Prevent pause_queue when circuit is broken',
    activeAction: 'circuit_break', activeResource: 'queue:*',
    candidateAction: 'pause_queue', candidateResource: 'queue:*',
    verdict: 'DEFER',
    reason: 'Circuit break is active — defer queue pause until circuit recovers to avoid extended outage.',
    rationale: 'Both actions suppress job processing. Applying both simultaneously extends total downtime and removes the circuit breaker\'s ability to auto-recover when conditions improve.',
  },
  {
    id: 'cr-reduce-concurrency-rebuild',
    name: 'Concurrency Reduction + Rebuild Conflict',
    description: 'Prevent high-priority rebuild when worker concurrency is reduced',
    activeAction: 'reduce_concurrency', activeResource: 'queue:ai-jobs',
    candidateAction: 'priority_rebuild', candidateResource: 'projection:*',
    verdict: 'DEFER',
    reason: 'AI worker concurrency already reduced — high-priority rebuild may overload remaining capacity.',
    rationale: 'priority_rebuild adds high-urgency jobs to the analytics queue, competing for CPU and DB connections with AI jobs. If AI workers are already throttled, the rebuild may starve AI jobs further rather than relieving pressure.',
  },
  {
    id: 'cr-rebuild-then-reduce',
    name: 'Rebuild in Flight + Concurrency Reduction',
    description: 'Downgrade concurrency reduction during active rebuild',
    activeAction: 'priority_rebuild', activeResource: 'projection:*',
    candidateAction: 'reduce_concurrency', candidateResource: 'queue:ai-jobs',
    triggerStates: [MitigationState.EXECUTING, MitigationState.STABILIZING],
    verdict: 'DOWNGRADE',
    downgradeTarget: 'MEDIUM',
    reason: 'Active rebuild in progress — reduce_concurrency downgraded to MEDIUM to avoid prematurely throttling workers handling the rebuild.',
    rationale: 'Reducing concurrency while a rebuild is executing reduces throughput for the rebuild itself, potentially extending the stabilization window. Downgrading urgency ensures the operator reviews the interaction before acting.',
  },
  {
    id: 'cr-drain-then-reduce',
    name: 'DLQ Drain + Concurrency Reduction',
    description: 'Block concurrency reduction during active DLQ drain',
    activeAction: 'drain_dlq', activeResource: 'queue:all',
    candidateAction: 'reduce_concurrency', candidateResource: 'queue:*',
    verdict: 'BLOCK',
    reason: 'DLQ drain is in progress — reducing concurrency now would slow the drain and extend the incident window.',
    rationale: 'DLQ drain relies on available worker capacity to process queued failures. Reducing concurrency mid-drain extends the DLQ resolution time, directly worsening the very SLO the drain is meant to resolve.',
  },
  {
    id: 'cr-same-resource-lower-urgency',
    name: 'Same Resource Lower Urgency',
    description: 'Block lower-urgency actions when CRITICAL mitigation active on same resource',
    activeAction: '*', activeResource: '*',
    candidateAction: '*', candidateResource: '*',
    verdict: 'DEFER',
    reason: 'A CRITICAL mitigation is already active on this resource — deferring lower-urgency action to next tick.',
    rationale: 'Multiple concurrent mitigations on the same resource create state conflicts and make it impossible to attribute outcome effectiveness. Allow CRITICAL to complete stabilization before introducing a second mitigation.',
  },
];
