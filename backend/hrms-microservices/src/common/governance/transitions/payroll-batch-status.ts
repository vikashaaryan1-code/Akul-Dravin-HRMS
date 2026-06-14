/**
 * PAYROLL BATCH STATUS — COMPLETE SEMANTIC STATE MACHINE
 *
 * This file IS the authoritative definition of:
 *  1. All valid PayrollBatch states
 *  2. All valid transitions between them
 *  3. The RBAC roles permitted for each transition
 *  4. The semantic meaning of each state (documented in comments)
 *
 * Design principles:
 *  - The state machine is EXHAUSTIVE — unlisted transitions are ILLEGAL.
 *  - REVERSED ≠ FAILED. This distinction is a semantic invariant.
 *    FAILED = infrastructure/computation error (system-originated).
 *    REVERSED = intentional, authorized business rollback (human-originated).
 *  - Every state has a defined semantic. Ambiguous states are not permitted.
 *
 * Adding a new transition:
 *  1. Add the state to PayrollBatchStatus (if new).
 *  2. Add an entry to PAYROLL_TRANSITION_MAP.
 *  3. Assign a required role in TRANSITION_ROLE_MAP.
 *  4. Add a rationale string to TRANSITION_RATIONALE.
 *  5. Update the enforcement test — CI will auto-fail if the transition is
 *     not covered.
 */

// ── State Definitions ────────────────────────────────────────────────────────

export enum PayrollBatchStatus {
  /**
   * Batch is being constructed. Calculations are mutable.
   * System-originated. No actor required.
   */
  DRAFT = 'DRAFT',

  /**
   * Batch is sealed. Calculations are immutable (batchSeal hash computed).
   * Requires PAYROLL_OFFICER role. Transition: DRAFT → LOCKED.
   */
  LOCKED = 'LOCKED',

  /**
   * Batch is being executed against the ledger. Partial state.
   * System-originated during executeBatch(). Transition: LOCKED → PROCESSING.
   */
  PROCESSING = 'PROCESSING',

  /**
   * All items executed and reconciled with the ledger.
   * System-originated. Transition: PROCESSING → COMPLETED.
   */
  COMPLETED = 'COMPLETED',

  /**
   * FAILED = infrastructure or computation error during execution.
   * NOT the same as REVERSED.
   * System-originated. Cannot be transitioned out of without manual intervention.
   * Transition: PROCESSING → FAILED.
   */
  FAILED = 'FAILED',

  /**
   * REVERSED = intentional, AUTHORIZED business rollback of a completed batch.
   * Requires PAYROLL_ADMIN role + explicit justification.
   * NOT the same as FAILED.
   *
   * Semantic invariant — REVERSED must always be distinguishable from FAILED:
   *  - REVERSED: an authorized actor made a deliberate decision to undo
   *  - FAILED: the system encountered an unrecoverable error
   *
   * Transition: COMPLETED → REVERSED only. A FAILED batch cannot be REVERSED.
   */
  REVERSED = 'REVERSED',
}

// ── Transition Map — The State Machine ───────────────────────────────────────

/**
 * Exhaustive map of all legal state transitions.
 * Any transition NOT listed here is ILLEGAL and will be rejected by
 * TransitionPolicyEngine with a structured PayrollTransitionError.
 *
 * Format: PayrollBatchStatus → Set<PayrollBatchStatus>
 *         (from state → set of reachable states)
 */
export const PAYROLL_TRANSITION_MAP: ReadonlyMap<
  PayrollBatchStatus,
  ReadonlySet<PayrollBatchStatus>
> = new Map([
  [PayrollBatchStatus.DRAFT,       new Set([PayrollBatchStatus.LOCKED])],
  [PayrollBatchStatus.LOCKED,      new Set([PayrollBatchStatus.PROCESSING])],
  [PayrollBatchStatus.PROCESSING,  new Set([PayrollBatchStatus.COMPLETED, PayrollBatchStatus.FAILED])],
  [PayrollBatchStatus.COMPLETED,   new Set([PayrollBatchStatus.REVERSED])],
  [PayrollBatchStatus.FAILED,      new Set()],    // Terminal — no valid outgoing transitions
  [PayrollBatchStatus.REVERSED,    new Set()],    // Terminal — a reversal cannot be un-reversed
]);

// ── Role Requirements — RBAC Enforcement ─────────────────────────────────────

/**
 * Roles required to authorize each state transition.
 * The actor's roles are checked against this map by TransitionPolicyEngine.
 *
 * Role semantics:
 *  PAYROLL_OFFICER  — can initiate, lock, and execute payroll
 *  PAYROLL_ADMIN    — can additionally authorize reversals
 *  SYSTEM           — system-originated transitions (no human actor required)
 */
export const TRANSITION_ROLE_MAP: ReadonlyMap<
  PayrollBatchStatus,   // target state (the transition being attempted)
  ReadonlySet<string>   // roles authorized to make this transition
> = new Map([
  [PayrollBatchStatus.LOCKED,      new Set(['PAYROLL_OFFICER', 'PAYROLL_ADMIN', 'SUPER_ADMIN'])],
  [PayrollBatchStatus.PROCESSING,  new Set(['SYSTEM', 'PAYROLL_OFFICER', 'PAYROLL_ADMIN'])],
  [PayrollBatchStatus.COMPLETED,   new Set(['SYSTEM'])],
  [PayrollBatchStatus.FAILED,      new Set(['SYSTEM'])],
  [PayrollBatchStatus.REVERSED,    new Set(['PAYROLL_ADMIN', 'SUPER_ADMIN'])],  // ← Elevated role required
]);

// ── Rationale Strings — Self-Documenting Governance ──────────────────────────

/**
 * Rationale for each transition.
 * Appears in TransitionJournalEntry for forensic reconstruction.
 * Also appears in PayrollTransitionError messages for CI diagnostics.
 */
export const TRANSITION_RATIONALE: ReadonlyMap<PayrollBatchStatus, string> = new Map([
  [
    PayrollBatchStatus.LOCKED,
    'Batch sealed for processing. Calculations are now immutable. ' +
    'The batchSeal hash is computed at this point for bitwise integrity verification.',
  ],
  [
    PayrollBatchStatus.PROCESSING,
    'Batch execution started against the financial ledger. ' +
    'Individual item processing begins. Partial failures are isolated per-item.',
  ],
  [
    PayrollBatchStatus.COMPLETED,
    'All payroll items executed and reconciled with the ledger. ' +
    'Batch is now in final state for this payroll cycle.',
  ],
  [
    PayrollBatchStatus.FAILED,
    'Batch processing encountered an unrecoverable error. ' +
    'FAILED ≠ REVERSED: this is a system-originated failure, not an authorized rollback.',
  ],
  [
    PayrollBatchStatus.REVERSED,
    'Batch intentionally reversed by an authorized actor. ' +
    'REVERSED ≠ FAILED: this is a deliberate business decision by an authorized human. ' +
    'Ledger transactions have been neutralized via reversal entries.',
  ],
]);
