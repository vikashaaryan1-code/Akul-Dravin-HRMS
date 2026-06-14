import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PolicyMatch } from './mitigation-policy-engine.service';
import {
  DeferralCondition, DeferralReason, DeferredMitigation,
  DeferralOutcome, ReadinessResult,
} from './mitigation-scheduler.types';
import { MitigationCoordinationStore } from './mitigation-coordination.store';
import { ActiveSignalSnapshot } from './mitigation-arbitration.types';
import { MitigationState } from './slo.types';

const DEFAULT_MAX_DEFERRALS          = 6;   // ≈ 30 min at 5-min ticks
const PENDING_APPROVAL_MAX_DEFERRALS = 72;  // ≈ 6 hours
const BACKOFF_BASE_MS                = 5  * 60 * 1000;  // 5 min
const BACKOFF_MAX_MS                 = 60 * 60 * 1000;  // 60 min cap

/**
 * MITIGATION WORKFLOW SCHEDULER — Phase AO
 *
 * Manages a bounded deferred-mitigation queue, providing richer semantics
 * than "retry next tick" for arbitration DEFERRED verdicts.
 *
 * ── Deferral conditions ───────────────────────────────────────────────────────
 *
 *  RESOURCE_BUSY          — Wait for owning signal to reach terminal state.
 *  STABILIZING            — Wait for stabilization window to expire (Redis TTL).
 *  BACKOFF                — Exponential backoff: 5m → 10m → 20m → 40m → 60m cap.
 *  PENDING_APPROVAL       — Block until operator calls approve(deferredId).
 *  DEPENDENCY_INCOMPLETE  — Wait for a specific signal to resolve.
 *
 * ── Position in control flow ─────────────────────────────────────────────────
 *
 *   tick start:
 *     MitigationScheduler.checkEligibility(activeSignals, coord)
 *       → eligible PolicyMatch[] (re-injected into evaluation for this tick)
 *       ↓
 *   MitigationPolicyEngine.evaluate(burnRates)
 *       ↓
 *   [merge fresh + eligible deferred]
 *       ↓
 *   PolicyArbitrationEngine.arbitrate(allMatches, activeSignals)
 *       ↓ for DEFERRED:
 *   MitigationScheduler.enqueue(match, condition)
 *
 * ── Queue bounds ─────────────────────────────────────────────────────────────
 *
 *  MAX_QUEUE = 50 entries. When full, incoming enqueue() calls are rejected
 *  with a WARN log. This prevents unbounded memory growth during sustained
 *  high-conflict periods.
 *
 * ── Expiration ────────────────────────────────────────────────────────────────
 *
 *  Each entry has a `maxDeferrals` limit. On each tick where the entry
 *  is not yet eligible, `totalDeferrals` is incremented.
 *  When `totalDeferrals >= maxDeferrals`, the entry is DROPPED and logged.
 *
 *  Callers should check ReadinessResult.outcome === 'DROPPED' to handle
 *  cases where a mitigation was never executed (alerting, dead-letter queue, etc.).
 */
@Injectable()
export class MitigationScheduler {
  private readonly logger = new Logger(MitigationScheduler.name);
  private readonly queue: DeferredMitigation[] = [];
  private readonly MAX_QUEUE = 50;

  // ── Enqueue ───────────────────────────────────────────────────────────────

  /**
   * Add a deferred policy match to the scheduler queue.
   * Idempotent for the same policy ID — if the policy is already deferred,
   * the existing entry's condition is updated instead of creating a duplicate.
   *
   * @returns The deferred entry ID, or null if the queue is full.
   */
  enqueue(match: PolicyMatch, condition: DeferralCondition): DeferredMitigation | null {
    // Idempotency: if this policy is already queued, update condition
    const existing = this.queue.find(e => e.match.policy.id === match.policy.id);
    if (existing) {
      existing.condition = condition;
      this.logger.debug(`[Scheduler] Updated existing deferred entry: ${match.policy.id}`);
      return existing;
    }

    if (this.queue.length >= this.MAX_QUEUE) {
      this.logger.warn(`[Scheduler] Queue full (${this.MAX_QUEUE}) — cannot defer ${match.policy.id}`);
      return null;
    }

    const maxDeferrals = condition.type === 'PENDING_APPROVAL'
      ? PENDING_APPROVAL_MAX_DEFERRALS
      : DEFAULT_MAX_DEFERRALS;

    const entry: DeferredMitigation = {
      id:             randomUUID(),
      match,
      condition,
      enqueuedAt:     new Date().toISOString(),
      totalDeferrals: 0,
      maxDeferrals,
    };

    this.queue.push(entry);
    this.logger.log(
      `[Scheduler] Deferred: policy=${match.policy.id} reason=${condition.type} ` +
      `(max ${maxDeferrals} deferrals ≈ ${Math.round((maxDeferrals * 5) / 60)}h)`,
    );
    return entry;
  }

  // ── Eligibility Check ─────────────────────────────────────────────────────

  /**
   * Evaluate every deferred entry against current system state.
   * Called at the start of each 5-minute evaluation tick BEFORE policy evaluation.
   *
   * Returns PolicyMatch[] for entries that became eligible this tick.
   * Entries that are still waiting or dropped are handled internally.
   *
   * @param activeSignals  Current in-flight signals (non-terminal state)
   * @param coord          Redis coordination store for stabilization checks
   */
  async checkEligibility(
    activeSignals: ActiveSignalSnapshot[],
    coord: MitigationCoordinationStore,
  ): Promise<PolicyMatch[]> {
    if (this.queue.length === 0) return [];

    const now       = Date.now();
    const eligible: PolicyMatch[] = [];
    const toRemove: Set<string>   = new Set();
    const results: ReadinessResult[] = [];

    for (const entry of this.queue) {
      entry.lastCheckedAt = new Date().toISOString();
      const result = await this.checkEntry(entry, activeSignals, coord, now);
      results.push(result);

      if (result.outcome === 'ELIGIBLE') {
        eligible.push(result.match!);
        toRemove.add(entry.id);
        this.logger.log(
          `[Scheduler] ✅ Eligible: policy=${entry.match.policy.id} ` +
          `after ${entry.totalDeferrals} deferral(s) (reason was: ${entry.condition.type})`,
        );
      } else if (result.outcome === 'DROPPED') {
        toRemove.add(entry.id);
        this.logger.warn(
          `[Scheduler] ⛔ Dropped: policy=${entry.match.policy.id} ` +
          `exceeded ${entry.maxDeferrals} deferrals — ${result.dropReason}`,
        );
      } else {
        // Still waiting — increment deferral counter
        entry.totalDeferrals++;
      }
    }

    // Remove eligible and dropped entries from queue
    for (const id of toRemove) {
      const idx = this.queue.findIndex(e => e.id === id);
      if (idx !== -1) this.queue.splice(idx, 1);
    }

    if (eligible.length > 0) {
      this.logger.log(`[Scheduler] Re-injecting ${eligible.length} eligible match(es) into evaluation`);
    }

    return eligible;
  }

  // ── Operator Controls ─────────────────────────────────────────────────────

  /**
   * Approve a PENDING_APPROVAL deferred mitigation.
   * The entry will become eligible on the next eligibility check.
   */
  approve(deferredId: string, actor = 'operator'): boolean {
    const entry = this.queue.find(e => e.id === deferredId);
    if (!entry || entry.condition.type !== 'PENDING_APPROVAL') return false;
    entry.condition.approved = true;
    this.logger.log(`[Scheduler] Approved: entry=${deferredId} by ${actor}`);
    return true;
  }

  /**
   * Manually drop a deferred entry (e.g. stale, superseded, or cancelled).
   */
  drop(deferredId: string, reason = 'manually dropped'): boolean {
    const idx = this.queue.findIndex(e => e.id === deferredId);
    if (idx === -1) return false;
    const entry = this.queue.splice(idx, 1)[0];
    this.logger.warn(`[Scheduler] Manually dropped: entry=${deferredId} policy=${entry.match.policy.id} reason=${reason}`);
    return true;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getQueue(): DeferredMitigation[] {
    return [...this.queue];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  findByPolicyId(policyId: string): DeferredMitigation | undefined {
    return this.queue.find(e => e.match.policy.id === policyId);
  }

  /** Summary statistics for the scheduler dashboard */
  getStats(): {
    total: number;
    byReason: Record<DeferralReason, number>;
    pendingApproval: DeferredMitigation[];
    nearExpiry: DeferredMitigation[];  // ≥ 80% of maxDeferrals consumed
    /** Entries with totalDeferrals > 2 that may be starving */
    starvationAlerts: DeferredMitigation[];
  } {
    const byReason = {} as Record<DeferralReason, number>;
    const pendingApproval: DeferredMitigation[] = [];
    const nearExpiry: DeferredMitigation[] = [];
    const starvationAlerts: DeferredMitigation[] = [];

    for (const e of this.queue) {
      byReason[e.condition.type] = (byReason[e.condition.type] ?? 0) + 1;
      if (e.condition.type === 'PENDING_APPROVAL') pendingApproval.push(e);
      if (e.totalDeferrals / e.maxDeferrals >= 0.8) nearExpiry.push(e);
      if (e.totalDeferrals > 2) starvationAlerts.push(e);
    }

    return { total: this.queue.length, byReason, pendingApproval, nearExpiry, starvationAlerts };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async checkEntry(
    entry: DeferredMitigation,
    activeSignals: ActiveSignalSnapshot[],
    coord: MitigationCoordinationStore,
    nowMs: number,
  ): Promise<ReadinessResult> {
    // Expiry check — always first
    if (entry.totalDeferrals >= entry.maxDeferrals) {
      const dropReason = `Exceeded max deferrals (${entry.maxDeferrals}) for reason: ${entry.condition.type}`;
      return { entry, outcome: 'DROPPED', dropReason };
    }

    const { condition } = entry;
    const terminal = new Set([MitigationState.RESOLVED, MitigationState.ROLLED_BACK]);

    switch (condition.type) {
      case 'RESOURCE_BUSY': {
        // Eligible when: no active signal with the owningSignalId OR owning signal is now terminal
        if (condition.owningSignalId) {
          const owning = activeSignals.find(s => s.id === condition.owningSignalId);
          if (!owning || terminal.has(owning.state)) {
            return { entry, outcome: 'ELIGIBLE', match: entry.match };
          }
        } else if (condition.resourceKey) {
          // No specific signal — check if any active signal still claims this resource
          const stillBusy = activeSignals.some(
            s => !terminal.has(s.state) && `${s.sloId}:${s.targetResource}` === condition.resourceKey,
          );
          if (!stillBusy) return { entry, outcome: 'ELIGIBLE', match: entry.match };
        }
        break;
      }

      case 'STABILIZING': {
        if (!condition.resourceKey) break;
        const isStabilizing = await coord.isStabilizing(condition.resourceKey).catch(() => false);
        if (!isStabilizing) return { entry, outcome: 'ELIGIBLE', match: entry.match };
        break;
      }

      case 'BACKOFF': {
        if (!condition.nextEligibleAt) return { entry, outcome: 'ELIGIBLE', match: entry.match };
        if (nowMs >= new Date(condition.nextEligibleAt).getTime()) {
          return { entry, outcome: 'ELIGIBLE', match: entry.match };
        }
        break;
      }

      case 'PENDING_APPROVAL': {
        if (condition.approved) return { entry, outcome: 'ELIGIBLE', match: entry.match };
        break;
      }

      case 'DEPENDENCY_INCOMPLETE': {
        if (!condition.dependsOnSignalId) {
          return { entry, outcome: 'ELIGIBLE', match: entry.match };
        }
        const dep = activeSignals.find(s => s.id === condition.dependsOnSignalId);
        // Eligible when dependency is not found (already removed) OR is terminal
        if (!dep || terminal.has(dep.state)) {
          return { entry, outcome: 'ELIGIBLE', match: entry.match };
        }
        break;
      }
    }

    return { entry, outcome: 'STILL_WAITING' };
  }
}

// ── Backoff Helper ────────────────────────────────────────────────────────────

/**
 * Compute the next eligible timestamp for a BACKOFF deferral.
 * Exponential backoff: delay = min(BACKOFF_BASE * 2^retryCount, BACKOFF_MAX)
 */
export function computeBackoffNextEligible(retryCount: number): string {
  const delayMs = Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCount), BACKOFF_MAX_MS);
  return new Date(Date.now() + delayMs).toISOString();
}

/**
 * AGING BOOST — Phase AQ-F (Fairness)
 *
 * Returns a boost score (0.0–0.2) proportional to how long a deferred entry
 * has been waiting relative to its expiry. This boost is added to the utility
 * composite score in ArbitrationUtilityScorer to prevent indefinite starvation.
 *
 * At 0 deferrals: boost = 0.0 (no fairness advantage)
 * At maxDeferrals - 1: boost = 0.2 (maximum fairness lift)
 *
 * A 0.2 boost is meaningful but cannot alone override a CRITICAL urgency
 * difference (urgency dimension weight 0.35 with 0.33 gap between MEDIUM and HIGH).
 * It primarily helps MEDIUM vs MEDIUM competition where one has been waiting longer.
 */
export function computeAgingBoost(entry: DeferredMitigation): number {
  const ratio = entry.totalDeferrals / Math.max(1, entry.maxDeferrals - 1);
  return Math.min(0.2, ratio * 0.2);
}
