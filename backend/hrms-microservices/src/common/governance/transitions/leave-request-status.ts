/**
 * LEAVE REQUEST STATUS — COMPLETE SEMANTIC STATE MACHINE
 *
 * Authoritative definition of:
 *  1. All valid LeaveRequest states
 *  2. All valid transitions between them
 *  3. RBAC roles authorized for each transition
 *  4. Rationale for each state (stored in journal at transition time)
 *
 * State semantics:
 *  DRAFT      → Employee has started but not yet submitted
 *  PENDING    → Submitted and awaiting manager decision
 *  APPROVED   → Manager approved — leave is confirmed
 *  REJECTED   → Manager rejected — employee notified
 *  CANCELLED  → Employee withdrew the request (from PENDING only)
 *
 * Semantic invariants:
 *  - APPROVED ≠ CANCELLED: approved leave cannot be "cancelled" retroactively.
 *    It must follow a different withdrawal workflow (future: APPROVAL_REVOKED).
 *  - REJECTED is terminal — a rejected request must be resubmitted fresh.
 *  - CANCELLED is human-initiated from PENDING — not system-originated.
 *  - APPROVED and REJECTED are manager-initiated — not self-service.
 */

export enum LeaveRequestStatus {
  /**
   * Request created but not yet submitted.
   * Employee can edit dates, reason, type.
   * System-originated. Transition: — → DRAFT.
   */
  DRAFT = 'DRAFT',

  /**
   * Request submitted for manager review.
   * Employee can no longer edit. Manager must approve or reject.
   * Transition: DRAFT → PENDING. Requires EMPLOYEE or HR_MANAGER.
   */
  PENDING = 'PENDING',

  /**
   * Request approved by manager.
   * Leave is confirmed. Attendance/HR records updated.
   * Transition: PENDING → APPROVED. Requires HR_MANAGER or COMPANY_ADMIN.
   */
  APPROVED = 'APPROVED',

  /**
   * Request rejected by manager.
   * Employee notified. Terminal state — resubmit as a new request.
   * REJECTED ≠ CANCELLED: rejection is a manager decision, not employee withdrawal.
   * Transition: PENDING → REJECTED. Requires HR_MANAGER or COMPANY_ADMIN.
   */
  REJECTED = 'REJECTED',

  /**
   * Request withdrawn by the employee before a decision was made.
   * Only valid from PENDING — an approved leave cannot be cancelled here.
   * CANCELLED ≠ REJECTED: cancellation is employee-initiated, not manager-initiated.
   * Transition: PENDING → CANCELLED. Requires EMPLOYEE or HR_MANAGER.
   */
  CANCELLED = 'CANCELLED',
}

// ── Transition Map ────────────────────────────────────────────────────────────

export const LEAVE_TRANSITION_MAP: ReadonlyMap<
  LeaveRequestStatus,
  ReadonlySet<LeaveRequestStatus>
> = new Map([
  [LeaveRequestStatus.DRAFT,     new Set([LeaveRequestStatus.PENDING])],
  [LeaveRequestStatus.PENDING,   new Set([LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED, LeaveRequestStatus.CANCELLED])],
  [LeaveRequestStatus.APPROVED,  new Set()],   // Terminal — withdrawal handled separately
  [LeaveRequestStatus.REJECTED,  new Set()],   // Terminal — resubmit as new request
  [LeaveRequestStatus.CANCELLED, new Set()],   // Terminal — cancellation is final
]);

// ── RBAC Map ─────────────────────────────────────────────────────────────────

export const LEAVE_ROLE_MAP: ReadonlyMap<
  LeaveRequestStatus,
  ReadonlySet<string>
> = new Map([
  [LeaveRequestStatus.PENDING,   new Set(['EMPLOYEE', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'])],
  [LeaveRequestStatus.APPROVED,  new Set(['HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'])],
  [LeaveRequestStatus.REJECTED,  new Set(['HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'])],
  [LeaveRequestStatus.CANCELLED, new Set(['EMPLOYEE', 'HR_MANAGER', 'COMPANY_ADMIN', 'SUPER_ADMIN'])],
]);

// ── Rationale Map ─────────────────────────────────────────────────────────────

export const LEAVE_RATIONALE: ReadonlyMap<LeaveRequestStatus, string> = new Map([
  [
    LeaveRequestStatus.PENDING,
    'Leave request submitted by employee for manager review. ' +
    'Request is now immutable — changes require cancellation and resubmission.',
  ],
  [
    LeaveRequestStatus.APPROVED,
    'Leave request approved by authorized manager. ' +
    'Attendance records will be updated. Employee notified.',
  ],
  [
    LeaveRequestStatus.REJECTED,
    'Leave request rejected by authorized manager. ' +
    'REJECTED ≠ CANCELLED: this is a manager decision, not employee withdrawal. ' +
    'Employee must resubmit a new request.',
  ],
  [
    LeaveRequestStatus.CANCELLED,
    'Leave request withdrawn by employee before a manager decision. ' +
    'CANCELLED ≠ REJECTED: this is employee-initiated withdrawal, not manager rejection. ' +
    'Only valid from PENDING state.',
  ],
]);

// ── States requiring justification ───────────────────────────────────────────

/**
 * REJECTED and CANCELLED require a justification reason.
 * Approved leaves do not require a reason (approval is the default expected outcome).
 */
export const LEAVE_JUSTIFICATION_REQUIRED_STATES = new Set([
  LeaveRequestStatus.REJECTED,
  LeaveRequestStatus.CANCELLED,
]);
