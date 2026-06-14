import { v4 as uuidv4 } from 'uuid';

/**
 * EMPLOYEE LIFECYCLE TRANSITIONED EVENT
 *
 * Emitted whenever the EmployeeLifecycleService performs a validated
 * state transition on an employee record.
 *
 * This event is the integration point for:
 *   - Document generation (Confirmation Letter, Promotion Letter, Experience Letter)
 *   - Audit log enrichment
 *   - Notification dispatch (email/SMS to HR, manager, employee)
 *   - Payroll adjustment triggers (CTC change on PROMOTED, deductions on EXIT)
 *   - Analytics event stream (attrition, headcount, tenure tracking)
 *   - Compliance timeline reconstruction
 *
 * The event is immutable once created — the state machine guard ensures
 * only valid transitions produce it.
 *
 * Schema Design:
 *   - correlationId: UUID linking all events in a single HR workflow
 *     (e.g., the same correlationId spans OFFER → ONBOARDING → PROBATION → CONFIRMED)
 *   - causationId: ID of the upstream request/command that caused this transition
 *   - metadata: open bag for stage-specific data (new designation, CTC, etc.)
 */
export class EmployeeLifecycleTransitionedEvent {
  /** Unique event ID for deduplication and idempotency. */
  readonly eventId: string;

  /** ISO timestamp of when the transition occurred. */
  readonly occurredAt: string;

  /** Event type discriminator for downstream routing. */
  readonly eventType = 'employee.lifecycle.transitioned' as const;

  constructor(
    /** ID of the employee whose lifecycle changed. */
    readonly employeeId: string,

    /** Tenant that owns this employee. */
    readonly tenantId: string,

    /** The lifecycle stage before this transition. */
    readonly previousState: string,

    /** The lifecycle stage after this transition. */
    readonly nextState: string,

    /** User ID of the HR actor who triggered the transition. */
    readonly actorId: string | null,

    /** Human-readable reason or note for the transition (optional). */
    readonly reason: string | null,

    /**
     * Links this event to a parent workflow (e.g., ATS hire → onboarding).
     * Enables full workflow replay and distributed tracing.
     */
    readonly correlationId: string,

    /**
     * ID of the command/request that caused this event.
     * Used for event sourcing causation chains.
     */
    readonly causationId: string | null,

    /**
     * Stage-specific payload bag.
     * Examples:
     *   CONFIRMED:  { confirmationDate, revisedCtc, performanceRating }
     *   PROMOTED:   { newDesignation, previousDesignation, effectiveDate, revisedCtc }
     *   TRANSFERRED:{ newBranchId, preBranchId, effectiveDate }
     *   RESIGNED:   { lastWorkingDay, noticePeriodDays }
     *   TERMINATED: { terminationType, effectiveDate }
     */
    readonly metadata: Record<string, unknown>,
  ) {
    this.eventId    = uuidv4();
    this.occurredAt = new Date().toISOString();
  }

  /** Serialize to a plain object (for outbox persistence). */
  toJSON(): Record<string, unknown> {
    return {
      eventId:       this.eventId,
      eventType:     this.eventType,
      occurredAt:    this.occurredAt,
      employeeId:    this.employeeId,
      tenantId:      this.tenantId,
      previousState: this.previousState,
      nextState:     this.nextState,
      actorId:       this.actorId,
      reason:        this.reason,
      correlationId: this.correlationId,
      causationId:   this.causationId,
      metadata:      this.metadata,
    };
  }

  /** Factory: create with auto-generated correlationId. */
  static create(params: {
    employeeId:    string;
    tenantId:      string;
    previousState: string;
    nextState:     string;
    actorId?:      string | null;
    reason?:       string | null;
    correlationId?: string;
    causationId?:  string | null;
    metadata?:     Record<string, unknown>;
  }): EmployeeLifecycleTransitionedEvent {
    return new EmployeeLifecycleTransitionedEvent(
      params.employeeId,
      params.tenantId,
      params.previousState,
      params.nextState,
      params.actorId         ?? null,
      params.reason          ?? null,
      params.correlationId   ?? uuidv4(),
      params.causationId     ?? null,
      params.metadata        ?? {},
    );
  }
}
