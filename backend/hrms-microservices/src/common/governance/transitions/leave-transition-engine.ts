import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GenericTransitionEngine,
  TransitionEngineConfig,
} from './generic-transition-engine';
import {
  LeaveRequestStatus,
  LEAVE_TRANSITION_MAP,
  LEAVE_ROLE_MAP,
  LEAVE_RATIONALE,
  LEAVE_JUSTIFICATION_REQUIRED_STATES,
} from './leave-request-status';
import { TransitionJournalEntity } from '../../../database/entities/transition-journal.entity';
import { DomainEventBus } from '../../domain-events/domain-event-bus';
import { LEAVE_EVENTS } from '../events/domain-events';

/**
 * LEAVE ENGINE CONFIG
 *
 * Domain knowledge for LeaveRequest state transitions.
 * Separated from the engine so it can be audited independently.
 */
const LEAVE_ENGINE_CONFIG: TransitionEngineConfig<LeaveRequestStatus> = {
  transitionMap: LEAVE_TRANSITION_MAP,
  roleMap:       LEAVE_ROLE_MAP,
  rationaleMap:  LEAVE_RATIONALE,
  justificationRequiredStates: LEAVE_JUSTIFICATION_REQUIRED_STATES,
  aggregateType: 'LeaveRequest',
  domainName:    'leave',

  eventResolver: (toStatus: LeaveRequestStatus) => {
    const map: Partial<Record<LeaveRequestStatus, typeof LEAVE_EVENTS[keyof typeof LEAVE_EVENTS]>> = {
      [LeaveRequestStatus.PENDING]:   LEAVE_EVENTS.REQUEST_SUBMITTED,
      [LeaveRequestStatus.APPROVED]:  LEAVE_EVENTS.REQUEST_APPROVED,
      [LeaveRequestStatus.REJECTED]:  LEAVE_EVENTS.REQUEST_REJECTED,
      [LeaveRequestStatus.CANCELLED]: LEAVE_EVENTS.REQUEST_CANCELLED,
    };
    return map[toStatus];
  },
};

/**
 * LEAVE TRANSITION ENGINE
 *
 * Governed state transition engine for LeaveRequest.
 * Extends GenericTransitionEngine<LeaveRequestStatus> — inheriting the
 * five-phase execution contract without writing a single line of
 * legality/RBAC/journal/event logic.
 *
 * This is the proof of concept for Commit 6:
 * a new domain gets full governance infrastructure in ~30 lines
 * by providing only domain knowledge (the config) —
 * not repeating the execution machinery.
 *
 * Usage (in LeaveService):
 *   await this.leaveEngine.transition({
 *     aggregateId: request.id,
 *     fromStatus:  request.status,
 *     toStatus:    LeaveRequestStatus.APPROVED,
 *     tenantId,
 *     actor: { actorId: managerId, actorRoles: ['HR_MANAGER'], correlationId },
 *   });
 *   request.status = LeaveRequestStatus.APPROVED;
 *   await repo.save(request);
 *
 * Governance invariants enforced by inheritance:
 *   - APPROVED → any: ❌ ILLEGAL (terminal)
 *   - REJECTED → any: ❌ ILLEGAL (terminal)
 *   - CANCELLED from APPROVED: ❌ ILLEGAL (not in transition map)
 *   - REJECTED without justification: ❌ MISSING_JUSTIFICATION
 *   - EMPLOYEE approving their own leave: ❌ INSUFFICIENT_ROLE
 */
@Injectable()
export class LeaveTransitionEngine extends GenericTransitionEngine<LeaveRequestStatus> {
  constructor(
    @InjectRepository(TransitionJournalEntity)
    journalRepo: Repository<TransitionJournalEntity>,
    domainEventBus: DomainEventBus,
  ) {
    super(journalRepo, domainEventBus, LEAVE_ENGINE_CONFIG);
  }

  /**
   * Convenience audit query: all REJECTED requests for compliance review.
   */
  async getRejectionAudit(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransitionJournalEntity[]> {
    return this.getTransitionsByTarget(LeaveRequestStatus.REJECTED, tenantId, fromDate, toDate);
  }

  /**
   * Convenience audit query: all CANCELLED requests for HR analysis.
   */
  async getCancellationAudit(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<TransitionJournalEntity[]> {
    return this.getTransitionsByTarget(LeaveRequestStatus.CANCELLED, tenantId, fromDate, toDate);
  }
}
