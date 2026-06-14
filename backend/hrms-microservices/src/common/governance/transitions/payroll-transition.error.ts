/**
 * PAYROLL TRANSITION ERROR
 *
 * Structured error for state transition violations.
 * Carries full context for SIEM alerting and forensic reconstruction:
 *  - what was attempted (fromState → toState)
 *  - who attempted it (actorId + actorRoles)
 *  - why it was rejected (reason code + message)
 *  - trace linkage (batchId, tenantId, correlationId)
 *
 * Error codes:
 *  ILLEGAL_TRANSITION   — transition is not in PAYROLL_TRANSITION_MAP
 *  INSUFFICIENT_ROLE    — actor lacks required role for this transition
 *  MISSING_JUSTIFICATION — REVERSED requires justification text
 *  BATCH_NOT_FOUND      — batchId does not exist for this tenant
 */
export type TransitionErrorCode =
  | 'ILLEGAL_TRANSITION'
  | 'INSUFFICIENT_ROLE'
  | 'MISSING_JUSTIFICATION'
  | 'BATCH_NOT_FOUND';

export class PayrollTransitionError extends Error {
  readonly code: TransitionErrorCode;
  readonly batchId: string;
  readonly fromState: string;
  readonly toState: string;
  readonly actorId: string | undefined;
  readonly actorRoles: string[];
  readonly tenantId: string;
  readonly correlationId: string | undefined;
  readonly httpStatus: 422 | 403 | 404;

  constructor(params: {
    code: TransitionErrorCode;
    batchId: string;
    fromState: string;
    toState: string;
    actorId?: string;
    actorRoles?: string[];
    tenantId: string;
    correlationId?: string;
    message?: string;
  }) {
    const defaultMsg = PayrollTransitionError.buildMessage(params);
    super(params.message ?? defaultMsg);
    this.name = 'PayrollTransitionError';
    this.code = params.code;
    this.batchId = params.batchId;
    this.fromState = params.fromState;
    this.toState = params.toState;
    this.actorId = params.actorId;
    this.actorRoles = params.actorRoles ?? [];
    this.tenantId = params.tenantId;
    this.correlationId = params.correlationId;
    this.httpStatus = PayrollTransitionError.resolveHttpStatus(params.code);

    // Preserve prototype chain for instanceof checks
    Object.setPrototypeOf(this, PayrollTransitionError.prototype);
  }

  private static buildMessage(params: {
    code: TransitionErrorCode;
    batchId: string;
    fromState: string;
    toState: string;
    actorId?: string;
    actorRoles?: string[];
  }): string {
    switch (params.code) {
      case 'ILLEGAL_TRANSITION':
        return (
          `[PayrollTransitionError] ILLEGAL_TRANSITION: ` +
          `"${params.fromState}" → "${params.toState}" is not a valid state transition. ` +
          `batchId=${params.batchId}`
        );
      case 'INSUFFICIENT_ROLE':
        return (
          `[PayrollTransitionError] INSUFFICIENT_ROLE: ` +
          `actor="${params.actorId ?? 'unknown'}" with roles=[${(params.actorRoles ?? []).join(',')}] ` +
          `cannot transition "${params.fromState}" → "${params.toState}". ` +
          `batchId=${params.batchId}`
        );
      case 'MISSING_JUSTIFICATION':
        return (
          `[PayrollTransitionError] MISSING_JUSTIFICATION: ` +
          `Transitioning to "${params.toState}" requires a justification string. ` +
          `batchId=${params.batchId}`
        );
      case 'BATCH_NOT_FOUND':
        return (
          `[PayrollTransitionError] BATCH_NOT_FOUND: ` +
          `batchId=${params.batchId} not found for this tenant.`
        );
    }
  }

  private static resolveHttpStatus(code: TransitionErrorCode): 422 | 403 | 404 {
    switch (code) {
      case 'ILLEGAL_TRANSITION':     return 422;
      case 'INSUFFICIENT_ROLE':      return 403;
      case 'MISSING_JUSTIFICATION':  return 422;
      case 'BATCH_NOT_FOUND':        return 404;
    }
  }

  /** Structured payload for SIEM/observability export */
  toSiemPayload(): Record<string, unknown> {
    return {
      errorType: 'PayrollTransitionError',
      code: this.code,
      batchId: this.batchId,
      fromState: this.fromState,
      toState: this.toState,
      actorId: this.actorId,
      actorRoles: this.actorRoles,
      tenantId: this.tenantId,
      correlationId: this.correlationId,
      httpStatus: this.httpStatus,
      message: this.message,
      timestamp: new Date().toISOString(),
    };
  }
}
