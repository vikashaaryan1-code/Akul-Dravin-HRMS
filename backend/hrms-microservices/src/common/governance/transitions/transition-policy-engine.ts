import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GenericTransitionEngine,
  GenericTransitionRequest,
  GenericTransitionResult,
  TransitionEngineConfig,
  TransitionViolationError,
} from './generic-transition-engine';
import {
  PayrollBatchStatus,
  PAYROLL_TRANSITION_MAP,
  TRANSITION_ROLE_MAP,
  TRANSITION_RATIONALE,
} from './payroll-batch-status';
import { PayrollTransitionError } from './payroll-transition.error';
import { TransitionJournalEntity } from '../../../database/entities/transition-journal.entity';
import { DomainEventBus } from '../../domain-events/domain-event-bus';
import { PAYROLL_EVENTS } from '../events/domain-events';

/**
 * PAYROLL ENGINE CONFIG
 *
 * The complete domain knowledge for payroll batch state transitions.
 * Separated from the engine so it can be read, audited, and tested
 * independently of the execution machinery.
 */
const PAYROLL_ENGINE_CONFIG: TransitionEngineConfig<PayrollBatchStatus> = {
  transitionMap: PAYROLL_TRANSITION_MAP,
  roleMap: TRANSITION_ROLE_MAP,
  rationaleMap: TRANSITION_RATIONALE,

  /**
   * REVERSED is the only state requiring justification.
   * A reversal without an explanation is not permitted — this is
   * an operational governance requirement, not just validation.
   */
  justificationRequiredStates: new Set([PayrollBatchStatus.REVERSED]),

  aggregateType: 'PayrollBatch',
  domainName:    'payroll',

  /**
   * Maps target states to canonical domain events.
   * DRAFT and LOCKED are not emitted — they are pre-execution states.
   * PROCESSING is emitted as BATCH_SUBMITTED (intent to execute).
   */
  eventResolver: (toStatus: PayrollBatchStatus) => {
    const map: Partial<Record<PayrollBatchStatus, typeof PAYROLL_EVENTS[keyof typeof PAYROLL_EVENTS]>> = {
      [PayrollBatchStatus.PROCESSING]: PAYROLL_EVENTS.BATCH_SUBMITTED,
      [PayrollBatchStatus.COMPLETED]:  PAYROLL_EVENTS.BATCH_COMPLETED,
      [PayrollBatchStatus.FAILED]:     PAYROLL_EVENTS.BATCH_FAILED,
      [PayrollBatchStatus.REVERSED]:   PAYROLL_EVENTS.BATCH_REVERSED,
    };
    return map[toStatus];
  },
};

/**
 * PAYROLL TRANSITION ENGINE
 *
 * The concrete governed engine for PayrollBatch state transitions.
 * Extends GenericTransitionEngine<PayrollBatchStatus> — inheriting the
 * five-phase execution contract: legality → RBAC → justification →
 * journal → event emission.
 *
 * This class adds one payroll-specific override:
 *  buildViolation() → throws PayrollTransitionError (domain-typed error)
 *  instead of the generic TransitionViolationError.
 *
 * This preserves the existing PayrollTransitionError contract used by
 * the controller's exception filter and SIEM pipeline.
 */
@Injectable()
export class PayrollTransitionEngine extends GenericTransitionEngine<PayrollBatchStatus> {
  constructor(
    @InjectRepository(TransitionJournalEntity)
    journalRepo: Repository<TransitionJournalEntity>,
    domainEventBus: DomainEventBus,
  ) {
    super(journalRepo, domainEventBus, PAYROLL_ENGINE_CONFIG);
  }

  // ── Payroll-specific API surface ─────────────────────────────────────────

  /**
   * Typed alias for the generic transition method.
   * PayrollService uses this directly — keeps the call site readable.
   */
  async transition(
    request: GenericTransitionRequest<PayrollBatchStatus>,
  ): Promise<GenericTransitionResult> {
    return super.transition(request);
  }

  /**
   * Get all REVERSED transitions for a tenant.
   * Alias for getTransitionsByTarget(REVERSED) for financial reconciliation reports.
   */
  async getReversalAudit(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransitionJournalEntity[]> {
    return this.getTransitionsByTarget(PayrollBatchStatus.REVERSED, tenantId, fromDate, toDate);
  }

  // ── Domain-specific error override ───────────────────────────────────────

  /**
   * Override buildViolation() to throw PayrollTransitionError instead of
   * the generic TransitionViolationError.
   *
   * This preserves the existing controller exception handling that depends
   * on PayrollTransitionError.httpStatus and .toSiemPayload().
   */
  protected override buildViolation(
    code: 'ILLEGAL_TRANSITION' | 'INSUFFICIENT_ROLE' | 'MISSING_JUSTIFICATION',
    request: GenericTransitionRequest<PayrollBatchStatus>,
  ): TransitionViolationError {
    // Delegate to PayrollTransitionError for backward compat + richer SIEM output
    return new PayrollTransitionError({
      code: code as any,
      batchId:    request.aggregateId,
      fromState:  String(request.fromStatus),
      toState:    String(request.toStatus),
      actorId:    request.actor.actorId,
      actorRoles: request.actor.actorRoles,
      tenantId:   request.tenantId,
      correlationId: request.actor.correlationId,
    }) as unknown as TransitionViolationError;
  }
}

/**
 * BACKWARD-COMPAT ALIAS
 *
 * PayrollService and PayrollModule import 'TransitionPolicyEngine'.
 * This alias keeps those imports working without changes.
 *
 * Commit 6 migration path:
 *   Phase 1 (now): alias keeps existing imports unchanged
 *   Phase 2 (future): rename callers to PayrollTransitionEngine directly
 */
export { PayrollTransitionEngine as TransitionPolicyEngine };

/**
 * Re-export the actor context interface so PayrollService callers
 * don't need to add a new import path.
 */
export type { GenericTransitionRequest as TransitionRequest };

/**
 * COMPATIBILITY SHIM: TransitionActorContext
 * Extracts the actor shape from GenericTransitionRequest for convenience.
 */
export interface TransitionActorContext {
  actorId: string;
  actorRoles: string[];
  correlationId?: string;
  causationId?: string;
}
