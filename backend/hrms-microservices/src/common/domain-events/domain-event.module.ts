import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainEventBus } from './domain-event-bus';
import { ActivityProjectionHandler } from './handlers/activity.projection-handler';
import { AuditProjectionHandler } from './handlers/audit.projection-handler';
import { SearchProjectionHandler } from './handlers/search.projection-handler';
import { NotificationProjectionHandler } from './handlers/notification.projection-handler';
import {
  DatabaseReplayProtectionStore,
  ReplayProtectionStore,
} from './replay-protection-store';
import { IdempotentHandler } from './governance-span-factory';
import { ProcessedEventEntity } from '../../database/entities/processed-event.entity';
import { ActivityFeedModule } from '../../modules/activity/activity-feed.module';
import { SearchModule } from '../../modules/search/search.module';
import { NotificationModule } from '../../modules/notification/notification.module';
import { AuditLogModule } from '../audit/audit-log.module';

/**
 * Injection token for ReplayProtectionStore.
 * Allows tests to swap in InMemoryReplayProtectionStore without touching
 * the module — use `providers: [{ provide: REPLAY_PROTECTION_STORE, useClass: InMemoryReplayProtectionStore }]`
 * in the test module.
 */
export const REPLAY_PROTECTION_STORE = 'REPLAY_PROTECTION_STORE';

/**
 * DOMAIN EVENT MODULE — Commit 7 (Replay Integrity)
 *
 * Wires the DomainEventBus with all registered projection handlers.
 * Import this module into any feature module that needs to emit domain events.
 *
 * All handlers are wrapped in IdempotentHandler at registration time.
 * This makes every handler replay-safe without any changes to the
 * handler implementations themselves.
 *
 * Replay protection TTL by severity:
 *   critical    → permanent (audit records are forever idempotent)
 *   eventual    → 30 days   (search can be replayed if needed)
 *   best_effort → 7 days    (notifications are ephemeral)
 *
 * Span instrumentation:
 *   Every handler execution emits a governance.handler.execute span.
 *   Every replay check emits a governance.replay.check span.
 *   All spans are structured JSON log lines — OTel-ready for Phase 2.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessedEventEntity]),
    AuditLogModule,
    ActivityFeedModule,
    SearchModule,
    NotificationModule,
  ],
  providers: [
    DomainEventBus,
    AuditProjectionHandler,
    ActivityProjectionHandler,
    SearchProjectionHandler,
    NotificationProjectionHandler,
    // The production replay store — backed by governance_processed_events table
    {
      provide: REPLAY_PROTECTION_STORE,
      useClass: DatabaseReplayProtectionStore,
    },
    DatabaseReplayProtectionStore,
  ],
  exports: [DomainEventBus, REPLAY_PROTECTION_STORE, DatabaseReplayProtectionStore],
})
export class DomainEventModule implements OnModuleInit {
  constructor(
    private readonly bus: DomainEventBus,
    private readonly auditHandler: AuditProjectionHandler,
    private readonly activityHandler: ActivityProjectionHandler,
    private readonly searchHandler: SearchProjectionHandler,
    private readonly notificationHandler: NotificationProjectionHandler,
    private readonly replayStore: DatabaseReplayProtectionStore,
  ) {}

  onModuleInit(): void {
    // Wrap all handlers in IdempotentHandler at registration time.
    // Order: severity-descending for log readability.
    // The wrapper is transparent — severity, handles, and name are preserved.
    this.bus.registerHandler(IdempotentHandler.wrap(this.auditHandler,        this.replayStore));
    this.bus.registerHandler(IdempotentHandler.wrap(this.activityHandler,     this.replayStore));
    this.bus.registerHandler(IdempotentHandler.wrap(this.searchHandler,       this.replayStore));
    this.bus.registerHandler(IdempotentHandler.wrap(this.notificationHandler, this.replayStore));
  }
}

