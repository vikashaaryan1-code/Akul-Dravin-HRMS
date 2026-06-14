import { PolicyMatch } from './mitigation-policy-engine.service';

// ── Deferral Semantics ────────────────────────────────────────────────────────

/**
 * Why a mitigation was deferred — used to build the DeferralCondition
 * and select the correct readiness check in MitigationScheduler.
 *
 * RESOURCE_BUSY          — Another active signal currently owns the target resource.
 *                          Ready when: the owning signal reaches RESOLVED or ROLLED_BACK.
 *
 * STABILIZING            — The target resource is within an active stabilization window.
 *                          Ready when: coord.isStabilizing(resourceKey) returns false.
 *
 * BACKOFF                — Candidate fired too recently or exceeded a safe rate.
 *                          Ready when: clock >= nextEligibleAt (exponential backoff).
 *
 * PENDING_APPROVAL       — Policy requires human gate before execution.
 *                          Ready when: an operator calls scheduler.approve(deferredId).
 *
 * DEPENDENCY_INCOMPLETE  — Another specific mitigation must reach a terminal state first.
 *                          Ready when: the depended-upon signal is RESOLVED or ROLLED_BACK.
 */
export type DeferralReason =
  | 'RESOURCE_BUSY'
  | 'STABILIZING'
  | 'BACKOFF'
  | 'PENDING_APPROVAL'
  | 'DEPENDENCY_INCOMPLETE';

export interface DeferralCondition {
  type: DeferralReason;

  /** RESOURCE_BUSY / STABILIZING: the `sloId:resource` coordination key being watched */
  resourceKey?: string;

  /** RESOURCE_BUSY: the specific in-flight signal ID that owns the resource */
  owningSignalId?: string;

  /** DEPENDENCY_INCOMPLETE: which signal must resolve before this match is eligible */
  dependsOnSignalId?: string;

  /** PENDING_APPROVAL: set to true by operator via MitigationScheduler.approve() */
  approved?: boolean;

  /** BACKOFF: ISO timestamp — match is not eligible until this time */
  nextEligibleAt?: string;

  /** BACKOFF: how many times the match has been retried with backoff */
  retryCount?: number;
}

// ── Deferred Mitigation ───────────────────────────────────────────────────────

/**
 * A policy match that has been held in the scheduler pending condition resolution.
 *
 * Lifecycle:
 *   MitigationScheduler.enqueue() → DeferredMitigation (WAITING)
 *                                   ↓ each tick: checkEligibility()
 *                   ↓ condition met         ↓ still blocked     ↓ maxDeferrals exceeded
 *               re-injected into         re-queued with         DROPPED (logged)
 *               policy evaluation         incremented           no signal created
 *                                        totalDeferrals
 */
export interface DeferredMitigation {
  /** Unique scheduler entry ID (not the policy ID) */
  id:             string;

  /** The policy match being held */
  match:          PolicyMatch;

  /** Why this match was deferred and what condition releases it */
  condition:      DeferralCondition;

  /** When this entry was first created */
  enqueuedAt:     string;

  /** How many evaluation ticks this has been deferred (increments each tick it isn't eligible) */
  totalDeferrals: number;

  /**
   * Maximum total deferrals before this entry is dropped.
   * Default: 6 (≈ 30 minutes at 5-minute tick interval).
   * PENDING_APPROVAL entries use a higher default (72 ≈ 6 hours).
   */
  maxDeferrals:   number;

  /** When eligibility was last checked */
  lastCheckedAt?: string;

  /** Set if this entry was dropped instead of becoming eligible */
  dropReason?:    string;
}

// ── Scheduler Readiness Result ────────────────────────────────────────────────

export type DeferralOutcome = 'ELIGIBLE' | 'STILL_WAITING' | 'DROPPED';

export interface ReadinessResult {
  entry:    DeferredMitigation;
  outcome:  DeferralOutcome;
  /** If ELIGIBLE: the match to re-inject into this tick's evaluation */
  match?:   PolicyMatch;
  /** If DROPPED: why */
  dropReason?: string;
}
