import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  SloId, BurnRate,
  MitigationSignal, MitigationState, MitigationTransition,
  MitigationActionType,
} from './slo.types';
import { MitigationCoordinationStore } from './mitigation-coordination.store';
import { MitigationPolicyEngine } from './mitigation-policy-engine.service';
import { PolicyArbitrationEngine } from './mitigation-arbitration-engine.service';
import { ActiveSignalSnapshot } from './mitigation-arbitration.types';
import { MitigationScheduler } from './mitigation-scheduler.service';
import { MitigationPlanExecutor } from './mitigation-plan-executor.service';
import { ResourceReservationService } from './resource-reservation.service';
import { AdaptiveTTLService } from './adaptive-ttl.service';
import { QUEUE_ANALYTICS, QUEUE_AI_JOBS } from '../queues/queue-names';

const DEFAULT_STABILIZATION_MS = 15 * 60 * 1000; // 15 minutes
const DEDUP_WINDOW_MS          = 10 * 60 * 1000; // 10 minutes

const TERMINAL = new Set([MitigationState.RESOLVED, MitigationState.ROLLED_BACK]);

/**
 * MITIGATION SIGNAL SERVICE — Phase AQ (Plan Executor integrated)
 *
 * ── Full evaluation pipeline ───────────────────────────────────────────
 *  0a. Scheduler.checkEligibility()        → re-inject eligible deferred matches
 *  0b. PlanExecutor.getReadyStepMatches()  → inject ready plan step matches
 *   1. PolicyEngine.evaluate(burnRates)    → fresh PolicyMatch[]
 *      [merge all three sets]
 *   2. ArbitrationEngine.arbitrate()       → ALLOWED / BLOCKED / DEFERRED / DOWNGRADED
 *      └─ DEFERRED → Scheduler.enqueue(match, suggestedDeferralCondition)
 *   3. Redis suppression (stabilization + dedup)
 *   4. Signal creation for ALLOWED matches
 *  4a. PlanExecutor.onSignalsCreated()     → record step signal IDs
 *  4b. PlanExecutor.advance()              → progress plan step states
 *
 * ── Oscillation prevention ──────────────────────────────────────────
 *  stabilizationRegistry → Redis SET PX (TTL 15min per sloId:resource key)
 *  proposedDedup         → Redis SET PX (TTL 10min per sloId:action key)
 *  burnRateCooldowns     → Redis SET PX (TTL 1h/3h per sloId:alertClass key)
 *  schedulerQueue        → in-memory, bounded (MAX 50 entries)
 *  planExecutions        → in-memory, bounded (MAX 20 executions)
 */
@Injectable()
export class MitigationSignalService {
  private readonly logger = new Logger(MitigationSignalService.name);
  private readonly signals: MitigationSignal[] = [];
  private readonly MAX_SIGNALS = 200;

  constructor(
    @InjectQueue(QUEUE_ANALYTICS) private readonly analyticsQueue: Queue,
    @InjectQueue(QUEUE_AI_JOBS)   private readonly aiQueue:         Queue,
    private readonly coord:        MitigationCoordinationStore,
    private readonly policyEngine: MitigationPolicyEngine,
    private readonly arbitration:  PolicyArbitrationEngine,
    private readonly scheduler:    MitigationScheduler,
    private readonly planExecutor: MitigationPlanExecutor,
    private readonly reservation:  ResourceReservationService,
    private readonly ttlService:   AdaptiveTTLService,
  ) {}

  // ── Evaluation ────────────────────────────────────────────────────────────

  async evaluate(burnRates: BurnRate[]): Promise<MitigationSignal[]> {
    const activeSignals   = this.getActiveSignals();
    const activeSnapshots = this.getActiveSignalSnapshots();

    // ── 0a. Scheduler: re-inject eligible deferred matches ───────────────
    const eligibleDeferred = await this.scheduler.checkEligibility(activeSnapshots, this.coord);

    // ── 0b. Plan executor: inject ready step matches ─────────────────────
    // Steps whose prerequisites are SUCCEEDED re-enter the evaluation pipeline
    // as synthetic PolicyMatches, going through full arbitration before execution.
    const planStepMatches = this.planExecutor.getReadyStepMatches(activeSignals);

    // ── 1. Policy evaluation: what should fire this tick? ───────────────
    const freshMatches = this.policyEngine.evaluate(burnRates);
    const allMatches   = [...freshMatches, ...eligibleDeferred, ...planStepMatches];

    // ── 2. Arbitration: can each match proceed? ─────────────────────
    const arbitrationReport = this.arbitration.arbitrate(allMatches, activeSnapshots);

    if (arbitrationReport.blocked.length > 0) {
      this.logger.debug(`[Mitigation] Arbitration BLOCKED ${arbitrationReport.blocked.length} match(es)`);
    }

    // Route DEFERRED matches to the workflow scheduler
    if (arbitrationReport.deferred.length > 0) {
      for (const deferred of arbitrationReport.deferred) {
        const dec = arbitrationReport.decisions.find(d => d.policyId === deferred.policy.id);
        const condition = dec?.suggestedDeferralCondition ?? { type: 'RESOURCE_BUSY' as const };
        this.scheduler.enqueue(deferred, condition);
      }
      this.logger.debug(
        `[Mitigation] Routed ${arbitrationReport.deferred.length} match(es) to scheduler ` +
        `(queue depth: ${this.scheduler.getQueueSize()})`,
      );
    }

    // ── 3. Build signals from arbitration-approved matches ───────────────
    const candidates = arbitrationReport.allowed.map(m => this.policyEngine.buildSignalFromMatch(m));

    // ── 4. Redis-backed suppression (stabilization + dedup) ───────────────
    const newSignals: MitigationSignal[] = [];

    for (const c of candidates) {
      const stabKey  = `${c.sloId}:${c.targetResource}`;
      const dedupKey = `${c.sloId}:${c.action}`;

      if (await this.coord.isStabilizing(stabKey)) {
        this.logger.debug(`[Mitigation] SUPPRESSED (stabilizing window active): ${stabKey}`);
        continue;
      }
      if (await this.coord.isDeduped(dedupKey)) {
        continue;
      }

      // Phase AT-1: Enforce reservation before creating signal
      if (!this.reservation.canProceed(c.targetResource, 'system', c.urgency as any, 1.0)) {
        this.logger.debug(`[Mitigation] SUPPRESSED (reservation busy): ${c.targetResource}`);
        continue;
      }

      const signal = this.buildSignal(c);
      // Auto-reserve for standalone signals if not already reserved
      if (!this.reservation.isReserved(c.targetResource)) {
        this.reservation.reserve(c.targetResource, signal.id, 'SIGNAL', c.action, c.urgency as any, 1.0);
      }
      await this.coord.setDedup(dedupKey, DEDUP_WINDOW_MS);
      this.push(signal);
      newSignals.push(signal);

      if (signal.autoExecutable && signal.urgency === 'CRITICAL') {
        await this.executeSignal(signal.id, 'system');
      }
    }

    if (newSignals.length > 0) {
      this.logger.warn(`[Mitigation] ${newSignals.length} new signal(s) proposed`);
    }

    // ── Plan executor post-tick callbacks ─────────────────────────
    if (newSignals.length > 0) this.planExecutor.onSignalsCreated(newSignals);
    this.planExecutor.advance(activeSignals);

    return newSignals;
  }

  // ── Scheduler + Arbitration helpers ───────────────────────────────────────────

  /** Scheduler stats for ops dashboard */
  getSchedulerStats() { return this.scheduler.getStats(); }
  getSchedulerQueue() { return this.scheduler.getQueue(); }
  approveDeferred(id: string, actor = 'operator') { return this.scheduler.approve(id, actor); }

  // ── Plan Executor API ───────────────────────────────────────────────────────
  startPlan(planId: string, correlationId?: string) { return this.planExecutor.startPlan(planId, correlationId); }
  abortPlan(execId: string, reason?: string)        { return this.planExecutor.abortExecution(execId, reason); }
  getPlanExecution(id: string)                      { return this.planExecutor.getExecution(id); }
  getRunningPlans()                                 { return this.planExecutor.getRunningExecutions(); }
  getAllPlanExecutions()                             { return this.planExecutor.getAllExecutions(); }
  getAvailablePlans()                               { return this.planExecutor.getPlans(); }
  dropDeferred(id: string, reason?: string)       { return this.scheduler.drop(id, reason); }

  /** Build ActiveSignalSnapshot[] from current in-flight signals for arbitration context. */
  private getActiveSignalSnapshots(): ActiveSignalSnapshot[] {
    return this.getActiveSignals().map(s => ({
      id:             s.id,
      sloId:          s.sloId,
      action:         s.action,
      targetResource: s.targetResource,
      state:          s.state,
      urgency:        s.urgency as ActiveSignalSnapshot['urgency'],
    }));
  }

  // ── State Transitions ─────────────────────────────────────────────────────

  acknowledge(id: string, actor = 'operator'): boolean {
    return this.transition(id, MitigationState.ACKNOWLEDGED, actor, 'Operator acknowledged');
  }

  async executeSignal(id: string, actor = 'operator'): Promise<boolean> {
    const s = this.find(id);
    if (!s) return false;
    const ok = this.transition(id, MitigationState.EXECUTING, actor, 'Execution initiated');
    if (!ok) return false;

    if (s.action === 'priority_rebuild') {
      try {
        await this.analyticsQueue.add('kpi-snapshot', {
          tenantId: 'PLATFORM', correlationId: randomUUID(),
          causationId: `mitigation:${id}`,
          idempotencyKey: `mitigation:rebuild:${id}`,
          timestamp: new Date().toISOString(),
          payload: { domain: 'workforce', priority: 'HIGH', bypassDebounce: true },
        }, { delay: 0, jobId: `mitigation-rebuild-${id}`, priority: 1 });
        this.logger.log(`[Mitigation] AUTO-EXECUTED priority_rebuild (signal=${id})`);
      } catch (err) {
        this.logger.error(`[Mitigation] Auto-execution failed: ${String(err)}`);
      }
    }

    await this.enterStabilizing(id, 'system', DEFAULT_STABILIZATION_MS);
    return true;
  }

  async enterStabilizing(id: string, actor = 'system', windowMs = DEFAULT_STABILIZATION_MS): Promise<boolean> {
    const s = this.find(id);
    if (!s) return false;

    const stabKey = `${s.sloId}:${s.targetResource}`;
    await this.coord.setStabilizing(stabKey, id, windowMs);

    const ok = this.transition(id, MitigationState.STABILIZING, actor, `Stabilizing for ${Math.round(windowMs / 60000)}m`);
    if (ok) {
      const sig = this.find(id);
      if (sig) sig.stabilizingUntil = new Date(Date.now() + windowMs).toISOString();
    }
    return ok;
  }

  async resolve(id: string, actor = 'system', reason = 'SLO returned to passing'): Promise<boolean> {
    const s = this.find(id);
    if (!s) return false;
    await this.coord.clearStabilizing(`${s.sloId}:${s.targetResource}`);
    
    // Phase AT-4: Record lifecycle for adaptive TTL
    const durationMs = Date.now() - new Date(s.generatedAt).getTime();
    this.ttlService.recordLifecycle(s.targetResource, durationMs);
    
    // Release reservation
    this.reservation.release(s.targetResource, id);

    return this.transition(id, MitigationState.RESOLVED, actor, reason);
  }

  async rollback(id: string, actor = 'operator', reason: string): Promise<boolean> {
    const s = this.find(id);
    if (!s) return false;
    await this.coord.clearStabilizing(`${s.sloId}:${s.targetResource}`);
    
    // Release reservation on rollback
    this.reservation.release(s.targetResource, id);

    const ok = this.transition(id, MitigationState.ROLLED_BACK, actor, reason);
    if (ok) this.logger.warn(`[Mitigation] ROLLED_BACK: signal=${id} reason="${reason}"`);
    return ok;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getSignals(limit = 50): MitigationSignal[] { return this.signals.slice(0, limit); }
  getActiveSignals(): MitigationSignal[] { return this.signals.filter(s => !TERMINAL.has(s.state)); }

  async getStabilizationStatus() { return this.coord.listStabilizing(); }

  // ── Internals ─────────────────────────────────────────────────────────────

  private transition(id: string, to: MitigationState, actor: string, reason?: string): boolean {
    const signal = this.find(id);
    if (!signal) return false;
    const from = signal.state;
    if (!this.isValidTransition(from, to)) {
      this.logger.warn(`[Mitigation] Invalid transition ${from}→${to} for signal=${id}`);
      return false;
    }
    const t: MitigationTransition = { from, to, actor, reason, at: new Date().toISOString() };
    signal.transitions.push(t);
    signal.state = to;
    signal.lastTransitionAt = t.at;
    return true;
  }

  private isValidTransition(from: MitigationState, to: MitigationState): boolean {
    const rules: Partial<Record<MitigationState, MitigationState[]>> = {
      [MitigationState.PROPOSED]:     [MitigationState.ACKNOWLEDGED, MitigationState.EXECUTING],
      [MitigationState.ACKNOWLEDGED]:  [MitigationState.EXECUTING,    MitigationState.RESOLVED],
      [MitigationState.EXECUTING]:     [MitigationState.STABILIZING,  MitigationState.ROLLED_BACK],
      [MitigationState.STABILIZING]:   [MitigationState.RESOLVED,     MitigationState.ROLLED_BACK],
    };
    return rules[from]?.includes(to) ?? false;
  }

  private find(id: string): MitigationSignal | undefined { return this.signals.find(s => s.id === id); }

  private buildSignal(input: Omit<MitigationSignal, 'id' | 'state' | 'transitions' | 'lastTransitionAt' | 'generatedAt'>): MitigationSignal {
    const now = new Date().toISOString();
    return {
      id: randomUUID(), ...input,
      state: MitigationState.PROPOSED,
      transitions: [{ from: MitigationState.PROPOSED, to: MitigationState.PROPOSED, actor: 'system', reason: 'Generated from burn rate analysis', at: now }],
      lastTransitionAt: now,
      generatedAt: now,
    };
  }

  private push(s: MitigationSignal): void {
    this.signals.unshift(s);
    if (this.signals.length > this.MAX_SIGNALS) this.signals.length = this.MAX_SIGNALS;
  }
}
