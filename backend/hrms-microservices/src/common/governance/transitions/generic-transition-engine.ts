import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DomainEventBus } from '../../domain-events/domain-event-bus';
import { TransitionJournalEntity } from '../../../database/entities/transition-journal.entity';
import { DomainEventName } from '../events/domain-events';

/**
 * TRANSITION ENGINE CONFIG
 *
 * The complete specification for a domain state machine.
 * Pass one of these to a GenericTransitionEngine subclass
 * to get a fully governed state transition engine for any domain.
 *
 * Design principle: the config IS the domain knowledge.
 * The engine is the execution machinery.
 * Keep them separated so domain knowledge can be read/audited independently.
 */
export interface TransitionEngineConfig<S extends string> {
  /**
   * All legal state transitions.
   * Any transition not present here is structurally illegal.
   * Format: from → Set<to>.
   */
  readonly transitionMap: ReadonlyMap<S, ReadonlySet<S>>;

  /**
   * RBAC roles required to authorize each target state.
   * Format: target state → Set<authorized role>.
   * Empty Set = SYSTEM-only (no human actor authorized).
   */
  readonly roleMap: ReadonlyMap<S, ReadonlySet<string>>;

  /**
   * Human-readable governance rationale per target state.
   * Written to the journal at transition time —
   * forensic replay does not depend on the current codebase.
   */
  readonly rationaleMap: ReadonlyMap<S, string>;

  /**
   * States that require a non-empty justification string.
   * Typically high-risk or destructive states (REVERSED, REJECTED, CANCELLED).
   */
  readonly justificationRequiredStates: ReadonlySet<S>;

  /**
   * Resolves the domain event to emit for a given target state.
   * Return undefined to skip event emission (e.g. PROCESSING is system-internal).
   */
  readonly eventResolver: (toStatus: S) => DomainEventName | undefined;

  /**
   * The root aggregate type name — stored in the journal and event envelope.
   * Enables replay partitioning by type: "replay all LeaveRequest events".
   * Example: 'PayrollBatch', 'LeaveRequest', 'WorkflowExecution'.
   */
  readonly aggregateType: string;

  /**
   * Human-readable domain name for log messages.
   * Example: 'payroll', 'leave', 'workflow'.
   */
  readonly domainName: string;
}

/**
 * GENERIC TRANSITION REQUEST
 *
 * Domain-agnostic input to GenericTransitionEngine.transition().
 * S is the status enum of the owning domain.
 */
export interface GenericTransitionRequest<S extends string> {
  /** ID of the aggregate being transitioned. */
  aggregateId: string;
  /** Current state — caller reads from entity before calling. */
  fromStatus: S;
  /** Target state. */
  toStatus: S;
  /** Tenant scope — mandatory. */
  tenantId: string;
  /** Actor identity and authorization context. */
  actor: {
    actorId: string;
    actorRoles: string[];
    correlationId?: string;
    causationId?: string;
  };
  /**
   * Required when toStatus is in config.justificationRequiredStates.
   * Stored in the journal as the human rationale for the transition.
   */
  justification?: string;
  /** Domain-specific context stored in the journal entry. */
  metadata?: Record<string, unknown>;
}

/**
 * TRANSITION RESULT (generic)
 *
 * Returned by GenericTransitionEngine.transition() on success.
 */
export interface GenericTransitionResult {
  journalEntry: TransitionJournalEntity;
  eventEnvelopeId: string | undefined;
}

/**
 * GENERIC TRANSITION ENGINE
 *
 * The reusable governance engine for any domain state machine.
 *
 * To create a governed engine for a new domain:
 *   1. Define your status enum and the three maps (transition, role, rationale).
 *   2. Create a DOMAIN_ENGINE_CONFIG constant.
 *   3. Extend this class, inject the repo + bus, pass config to super().
 *
 * Example:
 *   @Injectable()
 *   class LeaveTransitionEngine extends GenericTransitionEngine<LeaveRequestStatus> {
 *     constructor(
 *       @InjectRepository(TransitionJournalEntity) repo: Repository<TransitionJournalEntity>,
 *       bus: DomainEventBus,
 *     ) {
 *       super(repo, bus, LEAVE_ENGINE_CONFIG);
 *     }
 *   }
 *
 * The five-phase execution contract is inherited by all domain engines:
 *   Phase 1: legality validation    → config.transitionMap
 *   Phase 2: RBAC validation        → config.roleMap
 *   Phase 3: justification check    → config.justificationRequiredStates
 *   Phase 4: immutable journal save → TransitionJournalEntity
 *   Phase 5: domain event emission  → DomainEventBus via config.eventResolver
 *
 * Sequencing invariant (preserved from Commit 4):
 *   journal.save() always precedes bus.emit()
 *   bus.emit() always precedes caller's entity status mutation.
 *
 * This invariant guarantees forensic reconstructability even under
 * partial failure: the journal remains true even if propagation fails.
 */
export abstract class GenericTransitionEngine<S extends string> {
  protected readonly logger: Logger;

  constructor(
    protected readonly journalRepo: Repository<TransitionJournalEntity>,
    protected readonly domainEventBus: DomainEventBus,
    protected readonly config: TransitionEngineConfig<S>,
  ) {
    this.logger = new Logger(`TransitionEngine[${config.domainName}]`);
  }

  /**
   * Execute a governed state transition.
   *
   * @throws TransitionViolationError on any validation failure.
   * @returns GenericTransitionResult — caller applies the status mutation.
   *
   * CONTRACT: this method does NOT mutate the entity.
   * The caller applies: entity.status = request.toStatus after this resolves.
   */
  async transition(request: GenericTransitionRequest<S>): Promise<GenericTransitionResult> {
    const { aggregateId, fromStatus, toStatus, tenantId, actor, justification, metadata } = request;

    // ── Phase 1: Legality Check ────────────────────────────────────────────
    const legalTargets = this.config.transitionMap.get(fromStatus);
    if (!legalTargets || !legalTargets.has(toStatus)) {
      const violation = this.buildViolation('ILLEGAL_TRANSITION', request);
      this.logger.warn(
        `[${this.config.domainName}] ILLEGAL_TRANSITION: ` +
          `${aggregateId} ${String(fromStatus)}→${String(toStatus)} ` +
          `actor=${actor.actorId}`,
      );
      throw violation;
    }

    // ── Phase 2: RBAC Check ───────────────────────────────────────────────
    const requiredRoles = this.config.roleMap.get(toStatus);
    if (requiredRoles && requiredRoles.size > 0) {
      const actorHasRole = actor.actorRoles.some((r) => requiredRoles.has(r));
      if (!actorHasRole) {
        const violation = this.buildViolation('INSUFFICIENT_ROLE', request);
        this.logger.warn(
          `[${this.config.domainName}] INSUFFICIENT_ROLE: ` +
            `actor=${actor.actorId} roles=[${actor.actorRoles.join(',')}] ` +
            `cannot transition to ${String(toStatus)}`,
        );
        throw violation;
      }
    }

    // ── Phase 3: Justification Check ─────────────────────────────────────
    if (this.config.justificationRequiredStates.has(toStatus) && !justification?.trim()) {
      throw this.buildViolation('MISSING_JUSTIFICATION', request);
    }

    const governanceRationale = this.config.rationaleMap.get(toStatus) ?? null;

    // ── Phase 4: Append Immutable Journal Entry ───────────────────────────
    const journalEntry = this.journalRepo.create({
      tenantId,
      batchId: aggregateId,           // column reused as aggregateId
      fromStatus: String(fromStatus),
      toStatus: String(toStatus),
      actorId: actor.actorId === 'SYSTEM' ? null : actor.actorId,
      actorRoles: actor.actorRoles,
      justification: justification?.trim() ?? null,
      governanceRationale,
      correlationId: actor.correlationId ?? null,
      causationId: actor.causationId ?? null,
      metadata: {
        aggregateType: this.config.aggregateType,
        domainName: this.config.domainName,
        ...(metadata ?? {}),
      },
    });

    const savedEntry = await this.journalRepo.save(journalEntry);

    this.logger.log(
      `[${this.config.domainName}] JOURNAL: ${aggregateId} ` +
        `${String(fromStatus)}→${String(toStatus)} ` +
        `actor=${actor.actorId} journalId=${savedEntry.id}`,
    );

    // ── Phase 5: Emit Domain Event ────────────────────────────────────────
    const eventName = this.config.eventResolver(toStatus);
    let eventEnvelopeId: string | undefined;

    if (eventName) {
      await this.domainEventBus.emit(
        eventName,
        tenantId,
        {
          entityId:       aggregateId,
          fromStatus:     String(fromStatus),
          toStatus:       String(toStatus),
          journalEntryId: savedEntry.id,
          actorId:        actor.actorId,
          justification:  justification ?? undefined,
          ...(metadata ?? {}),
        },
        {
          actorId:       actor.actorId,
          correlationId: actor.correlationId,
          causationId:   actor.causationId,
          aggregateId,
          aggregateType: this.config.aggregateType,
        },
      );
      eventEnvelopeId = savedEntry.eventEnvelopeId ?? undefined;
    }

    return { journalEntry: savedEntry, eventEnvelopeId };
  }

  /**
   * Full transition history for an aggregate in chronological order.
   * Use for forensic reconstruction: replay transitions to recover lifecycle.
   */
  async getHistory(aggregateId: string, tenantId: string): Promise<TransitionJournalEntity[]> {
    return this.journalRepo.find({
      where: { batchId: aggregateId, tenantId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * All transitions that reached a specific target state, ordered newest-first.
   * Primary use case: compliance audit for REVERSED, REJECTED, CANCELLED states.
   */
  async getTransitionsByTarget(
    toStatus: S,
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransitionJournalEntity[]> {
    const qb = this.journalRepo
      .createQueryBuilder('j')
      .where('j.tenant_id = :tenantId', { tenantId })
      .andWhere('j.to_status = :toStatus', { toStatus: String(toStatus) })
      .andWhere("j.metadata->>'domainName' = :domain", { domain: this.config.domainName })
      .orderBy('j.created_at', 'DESC');

    if (fromDate) qb.andWhere('j.created_at >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('j.created_at <= :toDate', { toDate });

    return qb.getMany();
  }

  /**
   * Checks whether a transition is structurally legal (legality only, no RBAC).
   * Used for UI state machine visualization — shows which buttons to render.
   */
  isLegalTransition(fromStatus: S, toStatus: S): boolean {
    return this.config.transitionMap.get(fromStatus)?.has(toStatus) ?? false;
  }

  /**
   * Returns all reachable states from a given state.
   * Used for UI state machine rendering and API documentation.
   */
  getReachableStates(fromStatus: S): S[] {
    return Array.from(this.config.transitionMap.get(fromStatus) ?? []);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  /**
   * Build a structured violation error with full context.
   * Subclasses may override to produce domain-specific error types.
   */
  protected buildViolation(
    code: 'ILLEGAL_TRANSITION' | 'INSUFFICIENT_ROLE' | 'MISSING_JUSTIFICATION',
    request: GenericTransitionRequest<S>,
  ): TransitionViolationError {
    return new TransitionViolationError({
      code,
      domain: this.config.domainName,
      aggregateId: request.aggregateId,
      aggregateType: this.config.aggregateType,
      fromState: String(request.fromStatus),
      toState: String(request.toStatus),
      actorId: request.actor.actorId,
      actorRoles: request.actor.actorRoles,
      tenantId: request.tenantId,
      correlationId: request.actor.correlationId,
    });
  }
}

// ── Shared Violation Error ─────────────────────────────────────────────────────

export type TransitionViolationCode =
  | 'ILLEGAL_TRANSITION'
  | 'INSUFFICIENT_ROLE'
  | 'MISSING_JUSTIFICATION';

/**
 * TRANSITION VIOLATION ERROR — GENERIC
 *
 * Raised by GenericTransitionEngine on policy violations.
 * Carries full forensic context for SIEM ingestion.
 *
 * Domain-specific engines (PayrollTransitionEngine) may continue to
 * throw their own typed error (PayrollTransitionError) by overriding
 * buildViolation() — this is the fallback for generic engines.
 */
export class TransitionViolationError extends Error {
  readonly code: TransitionViolationCode;
  readonly domain: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly fromState: string;
  readonly toState: string;
  readonly actorId: string | undefined;
  readonly actorRoles: string[];
  readonly tenantId: string;
  readonly correlationId: string | undefined;
  readonly httpStatus: 403 | 422;

  constructor(params: {
    code: TransitionViolationCode;
    domain: string;
    aggregateId: string;
    aggregateType: string;
    fromState: string;
    toState: string;
    actorId?: string;
    actorRoles?: string[];
    tenantId: string;
    correlationId?: string;
  }) {
    const msg = TransitionViolationError.buildMessage(params);
    super(msg);
    this.name = 'TransitionViolationError';
    this.code = params.code;
    this.domain = params.domain;
    this.aggregateId = params.aggregateId;
    this.aggregateType = params.aggregateType;
    this.fromState = params.fromState;
    this.toState = params.toState;
    this.actorId = params.actorId;
    this.actorRoles = params.actorRoles ?? [];
    this.tenantId = params.tenantId;
    this.correlationId = params.correlationId;
    this.httpStatus = params.code === 'INSUFFICIENT_ROLE' ? 403 : 422;
    Object.setPrototypeOf(this, TransitionViolationError.prototype);
  }

  private static buildMessage(params: {
    code: TransitionViolationCode;
    domain: string;
    fromState: string;
    toState: string;
    actorId?: string;
    actorRoles?: string[];
    aggregateId: string;
  }): string {
    const prefix = `[${params.domain}] ${params.code}`;
    switch (params.code) {
      case 'ILLEGAL_TRANSITION':
        return `${prefix}: "${params.fromState}" → "${params.toState}" is not a valid transition. aggregateId=${params.aggregateId}`;
      case 'INSUFFICIENT_ROLE':
        return `${prefix}: actor="${params.actorId}" roles=[${(params.actorRoles ?? []).join(',')}] cannot transition to "${params.toState}". aggregateId=${params.aggregateId}`;
      case 'MISSING_JUSTIFICATION':
        return `${prefix}: transition to "${params.toState}" requires a justification string. aggregateId=${params.aggregateId}`;
    }
  }

  /** Structured payload for SIEM ingestion — identical shape to PayrollTransitionError.toSiemPayload() */
  toSiemPayload(): Record<string, unknown> {
    return {
      errorType: 'TransitionViolationError',
      code: this.code,
      domain: this.domain,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
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
