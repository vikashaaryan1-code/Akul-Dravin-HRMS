import { MitigationActionType, SloId } from './slo.types';

// ── Step Success Predicate ─────────────────────────────────────────────────────

/**
 * Determines when a plan step is considered "done" after execution.
 *
 * STABILIZED         — wait for signal to enter STABILIZING state (damping window active)
 * SIGNAL_RESOLVED    — wait for signal to reach RESOLVED state
 * TIME_BASED         — wait a fixed duration after signal reaches EXECUTING
 * OPERATOR_CONFIRMED — require explicit operator approval before advancing
 */
export type SuccessPredicate =
  | { type: 'STABILIZED';        stabilizationMs: number }
  | { type: 'SIGNAL_RESOLVED' }
  | { type: 'TIME_BASED';        waitMs: number }
  | { type: 'OPERATOR_CONFIRMED' };

// ── Compensation Step ─────────────────────────────────────────────────────────

/** Inline rollback action run if a critical step fails. */
export interface CompensationStep {
  action:         MitigationActionType;
  targetResource: string;
  reason:         string;
}

// ── Plan Step Definition ──────────────────────────────────────────────────────

export interface MitigationStepDef {
  id:              string;
  name:            string;
  /**
   * Phase AS-2: Hierarchical Plans.
   * If subPlanId is set, this step starts a sub-plan rather than a direct action.
   * action / targetResource / sloId are ignored when subPlanId is present.
   * The step succeeds when the sub-plan execution reaches SUCCEEDED.
   * The step fails (criticalPath semantics apply) when the sub-plan FAILS or ABORTS.
   */
  subPlanId?:      string;
  action?:         MitigationActionType;
  targetResource?: string;
  sloId?:          SloId;
  urgency:         'CRITICAL' | 'HIGH' | 'MEDIUM';
  /** Step IDs that must reach SUCCEEDED before this step starts */
  prerequisites:   string[];
  successPredicate: SuccessPredicate;
  /** Compensation steps run if this step (or a later step) fails while this is SUCCEEDED */
  compensationSteps?: CompensationStep[];
  /** Max wall time to wait in AWAITING_SUCCESS before failing (ms). Default: 30min */
  timeoutMs?:      number;
  /** If true, plan aborts and compensation runs when this step fails */
  criticalPath:    boolean;
}

// ── Plan Definition ───────────────────────────────────────────────────────────

export interface MitigationPlanDef {
  id:          string;
  name:        string;
  description: string;
  steps:       MitigationStepDef[];
  /**
   * Conditions that should trigger this plan (same DSL as policy conditions).
   * Plans are started manually or by the PlanExecutor trigger evaluator.
   */
  triggerHint: string;
}

// ── Step Execution State ──────────────────────────────────────────────────────

export type StepState =
  | 'PENDING'              // not yet started — prerequisites not met
  | 'EXECUTING'            // signal created, waiting for action completion
  | 'AWAITING_SUCCESS'     // action done, checking success predicate
  | 'SUBPLAN_RUNNING'      // sub-plan started, waiting for sub-plan completion (Phase AS-2)
  | 'SUCCEEDED'            // success predicate confirmed
  | 'FAILED'               // timed out or signal rolled back
  | 'COMPENSATING'         // running compensation steps
  | 'SKIPPED';             // skipped because a non-critical predecessor failed

export interface StepExecution {
  stepId:          string;
  stepName:        string;
  state:           StepState;
  /** MitigationSignal ID created for this step */
  signalId?:       string;
  /** Sub-plan execution ID (Phase AS-2: hierarchical plans) */
  subExecutionId?: string;
  startedAt?:      string;
  /** When signal entered EXECUTING state */
  executingAt?:    string;
  completedAt?:    string;
  failureReason?:  string;
  /** ISO timestamp: when TIME_BASED predicate resolves */
  eligibleAfter?:  string;
}

// ── Plan Execution State ──────────────────────────────────────────────────────

export type PlanState = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'COMPENSATING' | 'ABORTED';

export interface MitigationPlanExecution {
  id:          string;
  planId:      string;
  planName:    string;
  state:       PlanState;
  steps:       StepExecution[];
  startedAt:   string;
  completedAt?: string;
  /** Correlation ID linking to the incident that triggered this plan */
  correlationId?: string;
  /**
   * Phase AS-2: Hierarchical Plans.
   * Set when this execution was spawned as a sub-plan by a parent step.
   */
  parentExecutionId?: string;
  parentStepId?:      string;
  /** Running log of plan-level events */
  log:         Array<{ at: string; message: string }>;
}
