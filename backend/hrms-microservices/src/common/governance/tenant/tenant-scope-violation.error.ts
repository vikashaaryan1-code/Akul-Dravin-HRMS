/**
 * TENANT SCOPE VIOLATION ERROR
 *
 * Thrown at the query boundary when a repository or QueryBuilder call
 * executes (or is about to execute) without a resolved tenant scope.
 *
 * This is an authentication boundary failure — not a validation error.
 *
 * Carries structured context for:
 *  - Observability: spans, structured logs, metrics
 *  - SIEM: alerting on unscoped query attempts
 *  - Forensics: audit reconstruction
 *  - CI: integration test assertions on thrown error type
 */
export class TenantScopeViolationError extends Error {
  /** Machine-readable error code for SIEM and gateway routing. */
  readonly code = 'TENANT_SCOPE_VIOLATION' as const;

  /** HTTP-equivalent status — 401, not 400. Missing tenant context is an auth gap. */
  readonly httpStatus = 401 as const;

  /** Governance metadata for observability propagation. */
  readonly context: {
    readonly service: string;
    readonly entity: string;
    readonly operation: string;
    readonly correlationId: string | undefined;
    readonly timestamp: string;
  };

  constructor(
    service: string,
    entity: string,
    operation: string = 'unknown',
    correlationId?: string,
  ) {
    super(
      `[TENANT_SCOPE_VIOLATION] Attempted unscoped query in service="${service}" ` +
        `entity="${entity}" operation="${operation}". ` +
        `All queries against tenant-scoped entities require an explicit tenantId. ` +
        `This is a governance enforcement boundary — not a validation failure.`,
    );

    this.name = 'TenantScopeViolationError';

    this.context = {
      service,
      entity,
      operation,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    // Preserve stack trace in V8 (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TenantScopeViolationError);
    }
  }

  /**
   * Structured log payload — attach to logger.error() calls directly.
   * Compatible with pino/winston structured logging.
   */
  toLogPayload(): Record<string, unknown> {
    return {
      errorCode: this.code,
      httpStatus: this.httpStatus,
      message: this.message,
      ...this.context,
    };
  }

  /**
   * Span attributes for distributed tracing.
   * Attach to the active OpenTelemetry span on violation.
   */
  toSpanAttributes(): Record<string, string | number | boolean> {
    return {
      'governance.violation': true,
      'governance.violation.code': this.code,
      'governance.service': this.context.service,
      'governance.entity': this.context.entity,
      'governance.operation': this.context.operation,
      'correlationId': this.context.correlationId ?? 'none',
    };
  }
}
