import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceDashboardController } from './governance-dashboard.controller';
import { GovernanceHealthService } from '../../common/governance/governance-health.service';
import { ViolationLogPersisterService } from '../../common/governance/violation-log-persister.service';
import { GovernanceDriftAnalyticsService } from '../../common/governance/governance-drift-analytics.service';
import { OutboxEventEntity } from '../../database/entities/outbox-event.entity';
import { ProcessedEventEntity } from '../../database/entities/processed-event.entity';
import { TransitionJournalEntity } from '../../database/entities/transition-journal.entity';
import { ViolationLogEntity } from '../../database/entities/violation-log.entity';
import { OutboxModule } from '../../common/domain-events/outbox.module';
import { GovernanceOrchestrationModule } from '../../common/governance/governance-orchestration.module';
import { GlobalComplianceService } from './global-compliance.service';
import { ZeroTrustSecurityService } from './zero-trust-security.service';
import { ForensicAuditEntity } from '../../database/entities/forensic-audit.entity';

/**
 * GOVERNANCE MODULE — Commit 12 (Drift Analytics)
 *
 * Exposes the governance control plane as a standalone NestJS module.
 * Import this into AppModule to activate the /governance/* endpoints.
 *
 * Dependencies:
 *   OutboxModule           → provides OutboxDispatcher for replay operations
 *   TypeOrmModule          → provides repository access to all five truth-plane tables
 *
 * Five truth planes now fully wired:
 *   1. Operational entities      → domain feature modules
 *   2. Transition journal        → TransitionJournalEntity
 *   3. Outbox events             → OutboxEventEntity
 *   4. Processed events          → ProcessedEventEntity
 *   5. Violation log (NEW)       → ViolationLogEntity + ViolationLogPersisterService
 *
 * READ-ONLY contract:
 *   GovernanceHealthService is purely a read service.
 *   GovernanceDashboardController is read-only except for:
 *     POST /governance/replay/:id  — controlled re-dispatch
 *     POST /governance/scan        — triggers live AST scan (persists to ViolationLogEntity)
 *   Neither endpoint mutates operational domain entities.
 *
 * Handler mutation invariant (enforced by ForbiddenDependencyMatrix rule GOVERNANCE_MODULE_NO_DOMAIN_IMPORTS):
 *   This module MUST NEVER import domain feature modules (PayrollModule,
 *   LeaveModule, etc.). Governance reads data from shared infrastructure
 *   tables (outbox, processed_events, transition_journal, violation_log).
 *   Any such import would be caught by the governance:scan CI step.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      OutboxEventEntity,
      ProcessedEventEntity,
      TransitionJournalEntity,
      ViolationLogEntity,
      ForensicAuditEntity,
    ]),
    OutboxModule,
    GovernanceOrchestrationModule,
  ],
  controllers: [GovernanceDashboardController],
  providers:   [
    GovernanceHealthService,
    ViolationLogPersisterService,
    GovernanceDriftAnalyticsService,
    GlobalComplianceService,
    ZeroTrustSecurityService,
  ],
  exports:     [
    GovernanceHealthService,
    ViolationLogPersisterService,
    GovernanceDriftAnalyticsService,
    GlobalComplianceService,
    ZeroTrustSecurityService,
  ],
})
export class GovernanceModule {}
