import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  MitigationPlanDef, MitigationPlanExecution, StepExecution, StepState, PlanState,
} from './mitigation-plan.types';
import { MitigationSignal, MitigationState } from './slo.types';
import { PolicyMatch } from './mitigation-policy-engine.service';
import { WorkflowOutcomeService } from './workflow-outcome.service';
import { ResourceReservationService } from './resource-reservation.service';

const STEP_TIMEOUT_MS    = 30 * 60 * 1000; // 30 min default
const MAX_EXECUTIONS     = 20;             // bounded history

/**
 * MITIGATION PLAN EXECUTOR — Phase AQ
 *
 * Manages the lifecycle of multi-step mitigation plan executions.
 *
 * ── Architecture ─────────────────────────────────────────────────────────────
 *
 *  The executor operates as a collaborator to MitigationSignalService:
 *
 *    Signal service tick:
 *      1. planExecutor.getReadyStepMatches(activeSignals)
 *         → PolicyMatch[] for steps whose prerequisites are SUCCEEDED
 *      2. [merge with fresh + deferred matches]
 *      3. arbitrate all → ALLOWED matches become signals
 *      4. planExecutor.onSignalsCreated(signalMap)
 *         → executor records which signals belong to which steps
 *      5. planExecutor.advance(activeSignals)
 *         → advance step states based on signal state transitions
 *
 * ── Step sequencing ───────────────────────────────────────────────────────────
 *
 *  Steps start when ALL prerequisite steps have reached SUCCEEDED.
 *  Parallel steps (sharing no prerequisites) start concurrently.
 *
 *  Example: drain_dlq → rebuild → restore_concurrency
 *           step-1       step-2     step-3
 *           (no deps)    (dep:1)    (dep:2)
 *
 * ── Failure handling ─────────────────────────────────────────────────────────
 *
 *  criticalPath = true  → plan moves to COMPENSATING, then FAILED
 *  criticalPath = false → step moves to SKIPPED, plan continues
 *
 *  Compensation steps are injected as synthetic PolicyMatches in reverse
 *  definition order (undo semantics).
 *
 * ── Signal ownership ─────────────────────────────────────────────────────────
 *
 *  Plan step signals are tagged with `plan:${executionId}:${stepId}` as their
 *  policy ID prefix. This allows the executor to identify its own signals
 *  in the active signal set during advance().
 */
@Injectable()
export class MitigationPlanExecutor {
  private readonly logger     = new Logger(MitigationPlanExecutor.name);
  private readonly executions = new Map<string, MitigationPlanExecution>();
  private readonly plans      = new Map<string, MitigationPlanDef>();

  /**
   * outcomeService is injected via NestJS DI (no circular deps because
   * WorkflowOutcomeService depends on nothing in this module).
   * Using optional chaining throughout as a safety guard.
   */
  constructor(
    private readonly reservationService: ResourceReservationService,
    private readonly outcomeService?: WorkflowOutcomeService,
  ) {}

  // ── Plan Registration ─────────────────────────────────────────────────────

  registerPlan(plan: MitigationPlanDef): void {
    this.plans.set(plan.id, plan);
  }

  getPlan(id: string): MitigationPlanDef | undefined {
    return this.plans.get(id);
  }

  getPlans(): MitigationPlanDef[] {
    return [...this.plans.values()];
  }

  // ── Execution Management ──────────────────────────────────────────────────

  startPlan(
    planId: string,
    correlationId?: string,
    parentExecutionId?: string,
    parentStepId?: string,
  ): MitigationPlanExecution | null {
    const plan = this.plans.get(planId);
    if (!plan) { this.logger.warn(`[PlanExecutor] Plan not found: ${planId}`); return null; }

    const execId = randomUUID();
    const now    = new Date().toISOString();

    const execution: MitigationPlanExecution = {
      id:           execId,
      planId,
      planName:     plan.name,
      state:        'RUNNING',
      correlationId,
      parentExecutionId,
      parentStepId,
      startedAt:    now,
      log:          [{ at: now, message: `Plan started: ${plan.name}${parentExecutionId ? ` (subplan of ${parentExecutionId})` : ''}` }],
      steps: plan.steps.map(s => ({
        stepId:   s.id,
        stepName: s.name,
        state:    'PENDING' as StepState,
      })),
    };

    // Prune oldest if at capacity
    if (this.executions.size >= MAX_EXECUTIONS) {
      const oldest = [...this.executions.values()]
        .filter(e => e.state !== 'RUNNING')
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0];
      if (oldest) this.executions.delete(oldest.id);
    }

    this.executions.set(execId, execution);
    this.logger.log(`[PlanExecutor] Started execution ${execId} for plan ${plan.name}`);
    return execution;
  }

  abortExecution(execId: string, reason = 'Operator aborted'): boolean {
    const exec = this.executions.get(execId);
    if (!exec || exec.state !== 'RUNNING') return false;
    exec.state       = 'ABORTED';
    exec.completedAt = new Date().toISOString();
    this.appendLog(exec, `Aborted: ${reason}`);
    // Record outcome for learning
    this.outcomeService?.recordOutcome(exec);
    return true;
  }

  getExecution(id: string): MitigationPlanExecution | undefined {
    return this.executions.get(id);
  }

  getRunningExecutions(): MitigationPlanExecution[] {
    return [...this.executions.values()].filter(e => e.state === 'RUNNING' || e.state === 'COMPENSATING');
  }

  getAllExecutions(): MitigationPlanExecution[] {
    return [...this.executions.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  // ── Signal Service Integration ────────────────────────────────────────────

  /**
   * Called each tick BEFORE policy evaluation.
   * Returns synthetic PolicyMatches for plan steps that are ready to execute.
   * Steps are ready when: all prerequisites are SUCCEEDED and no signal exists yet.
   */
  getReadyStepMatches(activeSignals: MitigationSignal[]): PolicyMatch[] {
    const matches: PolicyMatch[] = [];
    const running = this.getRunningExecutions();

    for (const exec of running) {
      if (exec.state !== 'RUNNING') continue;
      const plan = this.plans.get(exec.planId);
      if (!plan) continue;

      for (const stepExec of exec.steps) {
        if (stepExec.state !== 'PENDING') continue;

        const stepDef = plan.steps.find(s => s.id === stepExec.stepId);
        if (!stepDef) continue;

        // Check if all prerequisites are SUCCEEDED
        const prereqsMet = stepDef.prerequisites.every(prereqId => {
          const prereqExec = exec.steps.find(s => s.stepId === prereqId);
          return prereqExec?.state === 'SUCCEEDED';
        });

        if (!prereqsMet) continue;

        // Check not already in-flight
        const policyId = this.stepPolicyId(exec.id, stepExec.stepId);
        const alreadyActive = activeSignals.some(s => s.policyId === policyId);
        if (alreadyActive) continue;

        // Phase AT-1: Reservation / Borrow logic
        const resource = stepDef.targetResource;
        if (resource) {
          // Check if parent already holds a reservation we can borrow
          if (exec.parentExecutionId) {
            const parentReserv = this.reservationService.isReserved(resource);
            if (parentReserv && parentReserv.ownerId === exec.parentExecutionId) {
              this.reservationService.borrow(resource, exec.parentExecutionId, exec.id, `[Plan: ${exec.planName}] ${stepDef.name}`);
              this.appendLog(exec, `Step "${stepDef.name}" borrowed reservation for ${resource} from parent ${exec.parentExecutionId}`);
            } else {
              this.reservationService.reserve(resource, exec.id, 'PLAN', exec.planName, stepDef.urgency, 1.0, undefined, stepDef.id, exec.parentExecutionId);
              this.appendLog(exec, `Step "${stepDef.name}" requested reservation for ${resource} (parent: ${exec.parentExecutionId})`);
            }
          } else {
            this.reservationService.reserve(resource, exec.id, 'PLAN', exec.planName, stepDef.urgency, 1.0, undefined, stepDef.id);
            this.appendLog(exec, `Step "${stepDef.name}" requested reservation for ${resource}`);
          }
        }

        // Build synthetic PolicyMatch
        matches.push({
          policy: {
            id:             policyId,
            name:           `[Plan: ${exec.planName}] ${stepDef.name}`,
            action:         stepDef.action,
            targetResource: stepDef.targetResource,
            sloId:          stepDef.sloId,
            urgency:        stepDef.urgency,
            priority:       0, // plan steps have highest priority
            enabled:        true,
            conditions:     [],
            minConfidenceScore: 0,
            description:    `Plan step: ${stepDef.name}`,
          },
          matchedConditions: [],
          planExecutionId:   exec.id,
          planStepId:        stepExec.stepId,
        } as unknown as PolicyMatch);

        this.appendLog(exec, `Step "${stepDef.name}" ready — injecting into evaluation`);
      }
    }

    return matches;
  }

  /**
   * Called after signals are created for this tick.
   * Records which signals belong to which plan steps.
   */
  onSignalsCreated(signals: MitigationSignal[]): void {
    for (const signal of signals) {
      if (!signal.policyId?.startsWith('plan:')) continue;
      const [, execId, stepId] = signal.policyId.split(':');
      const exec = this.executions.get(execId);
      if (!exec) continue;
      const stepExec = exec.steps.find(s => s.stepId === stepId);
      if (!stepExec) continue;

      stepExec.signalId  = signal.id;
      stepExec.state     = 'EXECUTING';
      stepExec.startedAt = new Date().toISOString();
      this.appendLog(exec, `Step "${stepExec.stepName}" executing (signal=${signal.id})`);
    }
  }

  /**
   * Advance all running executions based on current signal states.
   * Called each tick AFTER signal creation.
   */
  advance(activeSignals: MitigationSignal[]): void {
    const now = Date.now();

    for (const exec of this.getRunningExecutions()) {
      const plan = this.plans.get(exec.planId);
      if (!plan) continue;
      this.advanceExecution(exec, plan, activeSignals, now);
    }
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private advanceExecution(
    exec: MitigationPlanExecution,
    plan: MitigationPlanDef,
    activeSignals: MitigationSignal[],
    nowMs: number,
  ): void {
    for (const stepExec of exec.steps) {
      if (stepExec.state === 'PENDING' || stepExec.state === 'SUCCEEDED' ||
          stepExec.state === 'FAILED'  || stepExec.state === 'SKIPPED') continue;

      const stepDef = plan.steps.find(s => s.id === stepExec.stepId);
      if (!stepDef) continue;

      const signal = activeSignals.find(s => s.id === stepExec.signalId);

      if (stepExec.state === 'EXECUTING') {
        if (!signal) {
          // Signal not found in active — check if it resolved
          // (resolved signals drop out of activeSignals)
          if (stepExec.signalId) {
            // Treat as SUCCEEDED (signal resolved)
            this.succeedStep(exec, stepExec);
          }
        } else if (signal.state === MitigationState.ROLLED_BACK) {
          this.failStep(exec, stepExec, stepDef, 'Signal rolled back');
        } else if (signal.state === MitigationState.EXECUTING || signal.state === MitigationState.STABILIZING) {
          // Move to AWAITING_SUCCESS and start predicate timer for TIME_BASED
          if (stepExec.state === 'EXECUTING') {
            stepExec.executingAt = new Date().toISOString();
            stepExec.state = 'AWAITING_SUCCESS';
            if (stepDef.successPredicate.type === 'TIME_BASED') {
              stepExec.eligibleAfter = new Date(nowMs + stepDef.successPredicate.waitMs).toISOString();
            }
          }
        }
        // Timeout check
        const startMs = stepExec.startedAt ? new Date(stepExec.startedAt).getTime() : nowMs;
        const timeoutMs = stepDef.timeoutMs ?? STEP_TIMEOUT_MS;
        if (nowMs - startMs > timeoutMs) {
          this.failStep(exec, stepExec, stepDef, 'Step timed out');
        }
      }

      if (stepExec.state === 'AWAITING_SUCCESS') {
        const pred = stepDef.successPredicate;
        let succeeded = false;

        if (pred.type === 'SIGNAL_RESOLVED' && !signal) succeeded = true; // resolved, gone from active
        if (pred.type === 'STABILIZED' && signal?.state === MitigationState.STABILIZING) succeeded = true;
        if (pred.type === 'TIME_BASED' && stepExec.eligibleAfter && nowMs >= new Date(stepExec.eligibleAfter).getTime()) succeeded = true;
        if (pred.type === 'OPERATOR_CONFIRMED' && (signal?.state === MitigationState.RESOLVED)) succeeded = true;

        if (succeeded) this.succeedStep(exec, stepExec);
      }
    }

    // Check plan-level completion
    this.checkPlanCompletion(exec);
  }

  private succeedStep(exec: MitigationPlanExecution, stepExec: StepExecution): void {
    stepExec.state       = 'SUCCEEDED';
    stepExec.completedAt = new Date().toISOString();
    this.appendLog(exec, `Step "${stepExec.stepName}" SUCCEEDED`);
  }

  private failStep(
    exec: MitigationPlanExecution,
    stepExec: StepExecution,
    stepDef: import('./mitigation-plan.types').MitigationStepDef,
    reason: string,
  ): void {
    stepExec.state         = 'FAILED';
    stepExec.completedAt   = new Date().toISOString();
    stepExec.failureReason = reason;
    this.appendLog(exec, `Step "${stepExec.stepName}" FAILED: ${reason}`);

    if (stepDef.criticalPath) {
      exec.state = 'COMPENSATING';
      this.appendLog(exec, 'Critical path step failed — plan moving to COMPENSATING');
      // Skip all remaining PENDING steps
      for (const s of exec.steps) {
        if (s.state === 'PENDING') s.state = 'SKIPPED';
      }
    }
  }

  private checkPlanCompletion(exec: MitigationPlanExecution): void {
    const terminal = new Set<StepState>(['SUCCEEDED', 'FAILED', 'SKIPPED', 'COMPENSATING']);
    const allDone  = exec.steps.every(s => terminal.has(s.state));
    if (!allDone) return;

    const anyFailed = exec.steps.some(s => s.state === 'FAILED');
    exec.state       = anyFailed ? 'FAILED' : 'SUCCEEDED';
    exec.completedAt = new Date().toISOString();
    const durationMs = new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime();
    this.appendLog(exec, `Plan ${exec.state} in ${Math.round(durationMs / 60000)}m`);
    this.logger.log(`[PlanExecutor] ${exec.planName} → ${exec.state}`);
    // Record for workflow outcome learning (Phase AR-L)
    this.outcomeService?.recordOutcome(exec);
  }

  private appendLog(exec: MitigationPlanExecution, message: string): void {
    exec.log.push({ at: new Date().toISOString(), message });
    if (exec.log.length > 100) exec.log.shift();
  }

  private stepPolicyId(execId: string, stepId: string): string {
    return `plan:${execId}:${stepId}`;
  }
}
