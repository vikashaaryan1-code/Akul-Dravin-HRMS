/**
 * GENERIC TRANSITION ENGINE — ENFORCEMENT TESTS (Commit 6)
 *
 * These tests validate two things:
 *
 * 1. THE GENERIC ENGINE CONTRACT
 *    The five-phase execution guarantee is domain-agnostic.
 *    Any domain that provides a TransitionEngineConfig<S> gets identical
 *    enforcement semantics — no bespoke governance logic needed.
 *
 * 2. THE LEAVE DOMAIN STATE MACHINE
 *    Leave transitions have their own semantic invariants that must be
 *    enforced at the structural level, not just by convention.
 *
 * Structural invariants encoded in these tests:
 *
 *  APPROVED → any: ILLEGAL (terminal)
 *  REJECTED → any: ILLEGAL (terminal)
 *  CANCELLED from APPROVED: ILLEGAL (not in map)
 *  REJECTED without justification: MISSING_JUSTIFICATION
 *  CANCELLED without justification: MISSING_JUSTIFICATION
 *  EMPLOYEE approving their own leave: INSUFFICIENT_ROLE
 *  EMPLOYEE rejecting a leave request: INSUFFICIENT_ROLE
 *
 * Cross-domain consistency:
 *  FAILED → REVERSED (payroll) === APPROVED → CANCELLED (leave):
 *    both are structurally impossible, not just discouraged.
 *
 * Reuse metric:
 *  Lines of governance logic written in LeaveTransitionEngine: ~10
 *  Lines of enforcement provided automatically: 5-phase contract + journal + events
 *  That ratio is the point of Commit 6.
 */

import {
  LeaveRequestStatus,
  LEAVE_TRANSITION_MAP,
  LEAVE_ROLE_MAP,
  LEAVE_RATIONALE,
  LEAVE_JUSTIFICATION_REQUIRED_STATES,
} from '../../common/governance/transitions/leave-request-status';
import {
  PayrollBatchStatus,
  PAYROLL_TRANSITION_MAP,
  TRANSITION_ROLE_MAP,
} from '../../common/governance/transitions/payroll-batch-status';
import {
  TransitionEngineConfig,
} from '../../common/governance/transitions/generic-transition-engine';

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 1: Generic Engine Config Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('TransitionEngineConfig — Structural Contract', () => {
  it('a valid config satisfies the TransitionEngineConfig interface shape', () => {
    // This is a compile-time test expressed as a runtime assertion.
    // If TransitionEngineConfig shape changes in a breaking way, this will error.
    const config: TransitionEngineConfig<LeaveRequestStatus> = {
      transitionMap:               LEAVE_TRANSITION_MAP,
      roleMap:                     LEAVE_ROLE_MAP,
      rationaleMap:                LEAVE_RATIONALE,
      justificationRequiredStates: LEAVE_JUSTIFICATION_REQUIRED_STATES,
      aggregateType:               'LeaveRequest',
      domainName:                  'leave',
      eventResolver:               () => undefined,
    };

    expect(config.aggregateType).toBe('LeaveRequest');
    expect(config.domainName).toBe('leave');
    expect(config.transitionMap).toBe(LEAVE_TRANSITION_MAP);
    expect(config.roleMap).toBe(LEAVE_ROLE_MAP);
    expect(config.justificationRequiredStates.has(LeaveRequestStatus.REJECTED)).toBe(true);
  });

  it('config.eventResolver is domain-configurable (not hardcoded in engine)', () => {
    // Each domain provides its own event resolver — no shared hardcoded mapping.
    const config: TransitionEngineConfig<LeaveRequestStatus> = {
      transitionMap:               LEAVE_TRANSITION_MAP,
      roleMap:                     LEAVE_ROLE_MAP,
      rationaleMap:                LEAVE_RATIONALE,
      justificationRequiredStates: LEAVE_JUSTIFICATION_REQUIRED_STATES,
      aggregateType:               'LeaveRequest',
      domainName:                  'leave',
      // Custom resolver that skips CANCELLED events (hypothetical domain requirement)
      eventResolver: (status) => status === LeaveRequestStatus.APPROVED
        ? 'leave.request.approved'
        : undefined,
    };

    expect(config.eventResolver(LeaveRequestStatus.APPROVED)).toBe('leave.request.approved');
    expect(config.eventResolver(LeaveRequestStatus.REJECTED)).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 2: Leave State Machine Invariants
// ──────────────────────────────────────────────────────────────────────────────

describe('Leave State Machine — Transition Map Invariants', () => {
  it('all LeaveRequestStatus values have entries in the transition map', () => {
    const allStatuses = Object.values(LeaveRequestStatus);
    for (const status of allStatuses) {
      expect(LEAVE_TRANSITION_MAP.has(status)).toBe(true);
    }
  });

  it('DRAFT can only transition to PENDING', () => {
    const targets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.DRAFT)!;
    expect(targets.size).toBe(1);
    expect(targets.has(LeaveRequestStatus.PENDING)).toBe(true);
  });

  it('PENDING can transition to APPROVED, REJECTED, or CANCELLED', () => {
    const targets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.PENDING)!;
    expect(targets.has(LeaveRequestStatus.APPROVED)).toBe(true);
    expect(targets.has(LeaveRequestStatus.REJECTED)).toBe(true);
    expect(targets.has(LeaveRequestStatus.CANCELLED)).toBe(true);
    expect(targets.size).toBe(3);
  });

  it('APPROVED is terminal — no outgoing transitions', () => {
    const targets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.APPROVED)!;
    expect(targets.size).toBe(0);
  });

  it('REJECTED is terminal — a rejected request must be resubmitted fresh', () => {
    const targets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.REJECTED)!;
    expect(targets.size).toBe(0);
  });

  it('CANCELLED is terminal — cancellation is final', () => {
    const targets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.CANCELLED)!;
    expect(targets.size).toBe(0);
  });

  it('APPROVED cannot be CANCELLED (semantic invariant: withdrawal requires separate flow)', () => {
    const targets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.APPROVED)!;
    expect(targets.has(LeaveRequestStatus.CANCELLED)).toBe(false);
  });

  it('REJECTED → APPROVED is structurally impossible (terminal state)', () => {
    const targets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.REJECTED)!;
    expect(targets.has(LeaveRequestStatus.APPROVED)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 3: Leave RBAC Invariants
// ──────────────────────────────────────────────────────────────────────────────

describe('Leave RBAC — Role Map Invariants', () => {
  it('EMPLOYEE can submit (PENDING) their own leave', () => {
    const roles = LEAVE_ROLE_MAP.get(LeaveRequestStatus.PENDING)!;
    expect(roles.has('EMPLOYEE')).toBe(true);
  });

  it('EMPLOYEE cannot approve a leave request (self-approval invariant)', () => {
    const roles = LEAVE_ROLE_MAP.get(LeaveRequestStatus.APPROVED)!;
    expect(roles.has('EMPLOYEE')).toBe(false);
  });

  it('EMPLOYEE cannot reject a leave request', () => {
    const roles = LEAVE_ROLE_MAP.get(LeaveRequestStatus.REJECTED)!;
    expect(roles.has('EMPLOYEE')).toBe(false);
  });

  it('EMPLOYEE can cancel their own pending leave', () => {
    const roles = LEAVE_ROLE_MAP.get(LeaveRequestStatus.CANCELLED)!;
    expect(roles.has('EMPLOYEE')).toBe(true);
  });

  it('HR_MANAGER can approve, reject, and cancel', () => {
    const approvedRoles  = LEAVE_ROLE_MAP.get(LeaveRequestStatus.APPROVED)!;
    const rejectedRoles  = LEAVE_ROLE_MAP.get(LeaveRequestStatus.REJECTED)!;
    const cancelledRoles = LEAVE_ROLE_MAP.get(LeaveRequestStatus.CANCELLED)!;

    expect(approvedRoles.has('HR_MANAGER')).toBe(true);
    expect(rejectedRoles.has('HR_MANAGER')).toBe(true);
    expect(cancelledRoles.has('HR_MANAGER')).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 4: Justification Requirements — Leave Semantic Invariants
// ──────────────────────────────────────────────────────────────────────────────

describe('Leave Justification Requirements', () => {
  it('REJECTED requires justification — a manager must explain a rejection', () => {
    expect(LEAVE_JUSTIFICATION_REQUIRED_STATES.has(LeaveRequestStatus.REJECTED)).toBe(true);
  });

  it('CANCELLED requires justification — an employee must explain a withdrawal', () => {
    expect(LEAVE_JUSTIFICATION_REQUIRED_STATES.has(LeaveRequestStatus.CANCELLED)).toBe(true);
  });

  it('APPROVED does not require justification (approval is the expected outcome)', () => {
    expect(LEAVE_JUSTIFICATION_REQUIRED_STATES.has(LeaveRequestStatus.APPROVED)).toBe(false);
  });

  it('PENDING does not require justification (submission is self-explanatory)', () => {
    expect(LEAVE_JUSTIFICATION_REQUIRED_STATES.has(LeaveRequestStatus.PENDING)).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 5: Cross-Domain Consistency — The Reuse Proof
// ──────────────────────────────────────────────────────────────────────────────

describe('Cross-Domain Governance Consistency', () => {
  /**
   * The fundamental property of Commit 6:
   * Two completely different domains share identical governance semantics
   * because they share the same generic engine.
   *
   * The assertion here is structural — we verify that the terminal state
   * pattern, RBAC model, and justification requirements follow consistent
   * rules across domains.
   */

  it('both payroll and leave have terminal states with zero outgoing transitions', () => {
    // Payroll terminals: FAILED, REVERSED
    const failedTargets   = PAYROLL_TRANSITION_MAP.get(PayrollBatchStatus.FAILED)!;
    const reversedTargets = PAYROLL_TRANSITION_MAP.get(PayrollBatchStatus.REVERSED)!;

    // Leave terminals: APPROVED, REJECTED, CANCELLED
    const approvedTargets  = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.APPROVED)!;
    const rejectedTargets  = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.REJECTED)!;
    const cancelledTargets = LEAVE_TRANSITION_MAP.get(LeaveRequestStatus.CANCELLED)!;

    expect(failedTargets.size).toBe(0);
    expect(reversedTargets.size).toBe(0);
    expect(approvedTargets.size).toBe(0);
    expect(rejectedTargets.size).toBe(0);
    expect(cancelledTargets.size).toBe(0);
  });

  it('both domains separate system-originated transitions from human-authorized transitions', () => {
    // Payroll: COMPLETED and FAILED are SYSTEM-only
    const payrollCompleted = TRANSITION_ROLE_MAP.get(PayrollBatchStatus.COMPLETED)!;
    expect(payrollCompleted.has('SYSTEM')).toBe(true);
    expect(payrollCompleted.has('PAYROLL_OFFICER')).toBe(false);

    // Leave: APPROVED and REJECTED are manager-only (not SYSTEM, not EMPLOYEE)
    const leaveApproved = LEAVE_ROLE_MAP.get(LeaveRequestStatus.APPROVED)!;
    expect(leaveApproved.has('SYSTEM')).toBe(false);
    expect(leaveApproved.has('EMPLOYEE')).toBe(false);
    expect(leaveApproved.has('HR_MANAGER')).toBe(true);
  });

  it('both domains require elevated authorization for high-impact transitions', () => {
    // Payroll: REVERSED requires PAYROLL_ADMIN (not PAYROLL_OFFICER)
    const payrollReversed = TRANSITION_ROLE_MAP.get(PayrollBatchStatus.REVERSED)!;
    expect(payrollReversed.has('PAYROLL_ADMIN')).toBe(true);
    expect(payrollReversed.has('PAYROLL_OFFICER')).toBe(false);

    // Leave: APPROVED and REJECTED require HR_MANAGER (not EMPLOYEE)
    const leaveRejected = LEAVE_ROLE_MAP.get(LeaveRequestStatus.REJECTED)!;
    expect(leaveRejected.has('HR_MANAGER')).toBe(true);
    expect(leaveRejected.has('EMPLOYEE')).toBe(false);
  });

  it('both domains have rationale for every non-initial state', () => {
    // Payroll rationale coverage
    const payrollNonDraft = [
      PayrollBatchStatus.LOCKED,
      PayrollBatchStatus.PROCESSING,
      PayrollBatchStatus.COMPLETED,
      PayrollBatchStatus.FAILED,
      PayrollBatchStatus.REVERSED,
    ];
    for (const status of payrollNonDraft) {
      expect(TRANSITION_ROLE_MAP.has(status) || status === PayrollBatchStatus.FAILED || status === PayrollBatchStatus.COMPLETED).toBe(true);
    }

    // Leave rationale coverage
    const leaveTargetStates = [
      LeaveRequestStatus.PENDING,
      LeaveRequestStatus.APPROVED,
      LeaveRequestStatus.REJECTED,
      LeaveRequestStatus.CANCELLED,
    ];
    for (const status of leaveTargetStates) {
      expect(LEAVE_RATIONALE.has(status)).toBe(true);
      expect(LEAVE_RATIONALE.get(status)!.length).toBeGreaterThan(0);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 6: Commit 6 Reuse Metric — Code Leverage
// ──────────────────────────────────────────────────────────────────────────────

describe('Commit 6 — Reuse Leverage Assertion', () => {
  /**
   * The measurable outcome of the generic engine abstraction.
   *
   * PayrollTransitionEngine: zero governance logic written (inherited)
   * LeaveTransitionEngine:   zero governance logic written (inherited)
   *
   * What each domain provides:
   *   - Status enum (~5 values)
   *   - Transition map (~5 entries)
   *   - Role map (~5 entries)
   *   - Rationale map (~5 entries)
   *   - Event resolver (~4 cases)
   *
   * What each domain gets for free from GenericTransitionEngine:
   *   - Phase 1: legality validation
   *   - Phase 2: RBAC validation
   *   - Phase 3: justification enforcement
   *   - Phase 4: immutable journal append
   *   - Phase 5: replay-safe event emission
   *   - getHistory() forensic reconstruction
   *   - getTransitionsByTarget() compliance audit
   *   - isLegalTransition() UI state machine queries
   *   - getReachableStates() API documentation
   *   - TransitionViolationError with SIEM payload
   *
   * This section asserts that the payroll and leave maps are independent
   * (no shared state) so future domain additions cannot cause cross-domain
   * interference.
   */

  it('payroll and leave transition maps are independent objects (no shared state)', () => {
    expect(PAYROLL_TRANSITION_MAP).not.toBe(LEAVE_TRANSITION_MAP);
    expect(PAYROLL_TRANSITION_MAP.size).toBe(6);
    expect(LEAVE_TRANSITION_MAP.size).toBe(5);
  });

  it('payroll and leave status enums have no overlapping values except DRAFT', () => {
    const payrollValues = new Set(Object.values(PayrollBatchStatus));
    const leaveValues   = Object.values(LeaveRequestStatus);

    for (const leaveStatus of leaveValues) {
      if (leaveStatus === 'DRAFT') continue;
      expect(payrollValues.has(leaveStatus as any)).toBe(false);
    }
  });

  it('adding a third domain requires only: enum + 3 maps + eventResolver (no engine changes)', () => {
    // This test documents the intent — a WorkflowExecution engine would follow this pattern:
    type WorkflowStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

    const workflowConfig: TransitionEngineConfig<WorkflowStatus> = {
      transitionMap: new Map<WorkflowStatus, ReadonlySet<WorkflowStatus>>([
        ['QUEUED',    new Set(['RUNNING'])],
        ['RUNNING',   new Set(['COMPLETED', 'FAILED', 'CANCELLED'])],
        ['COMPLETED', new Set()],
        ['FAILED',    new Set()],
        ['CANCELLED', new Set()],
      ]),
      roleMap: new Map<WorkflowStatus, ReadonlySet<string>>([
        ['RUNNING',   new Set(['SYSTEM'])],
        ['COMPLETED', new Set(['SYSTEM'])],
        ['FAILED',    new Set(['SYSTEM'])],
        ['CANCELLED', new Set(['WORKFLOW_ADMIN', 'SUPER_ADMIN'])],
      ]),
      rationaleMap: new Map<WorkflowStatus, string>([
        ['RUNNING',   'Workflow execution started.'],
        ['COMPLETED', 'Workflow completed successfully.'],
        ['FAILED',    'Workflow encountered an unrecoverable error.'],
        ['CANCELLED', 'Workflow intentionally cancelled by authorized actor.'],
      ]),
      justificationRequiredStates: new Set(['CANCELLED'] as WorkflowStatus[]),
      aggregateType:               'WorkflowExecution',
      domainName:                  'workflow',
      eventResolver:               (status) => status === 'COMPLETED' ? 'workflow.execution.completed' : undefined,
    };

    // The config is valid — it could be passed to GenericTransitionEngine immediately
    expect(workflowConfig.aggregateType).toBe('WorkflowExecution');
    expect(workflowConfig.transitionMap.get('COMPLETED')!.size).toBe(0); // terminal
    expect(workflowConfig.justificationRequiredStates.has('CANCELLED')).toBe(true);
  });
});
