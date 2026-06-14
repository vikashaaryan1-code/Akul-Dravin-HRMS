// ── Generic engine infrastructure ─────────────────────────────────────────────
export {
  GenericTransitionEngine,
  TransitionViolationError,
} from './generic-transition-engine';
export type {
  TransitionEngineConfig,
  GenericTransitionRequest,
  GenericTransitionResult,
  TransitionViolationCode,
} from './generic-transition-engine';

// ── Payroll domain ─────────────────────────────────────────────────────────────
export {
  PayrollBatchStatus,
  PAYROLL_TRANSITION_MAP,
  TRANSITION_ROLE_MAP,
  TRANSITION_RATIONALE,
} from './payroll-batch-status';
export { PayrollTransitionError } from './payroll-transition.error';
export type { TransitionErrorCode } from './payroll-transition.error';
export {
  PayrollTransitionEngine,
  TransitionPolicyEngine,    // backward-compat alias
} from './transition-policy-engine';
export type { TransitionActorContext } from './transition-policy-engine';

// ── Leave domain ───────────────────────────────────────────────────────────────
export {
  LeaveRequestStatus,
  LEAVE_TRANSITION_MAP,
  LEAVE_ROLE_MAP,
  LEAVE_RATIONALE,
  LEAVE_JUSTIFICATION_REQUIRED_STATES,
} from './leave-request-status';
export { LeaveTransitionEngine } from './leave-transition-engine';

