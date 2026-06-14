import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { OutboxEventEntity } from '../../database/entities/outbox-event.entity';
import { OutboxEventWriter, OutboxDispatcher } from './outbox-event.service';
import {
  OutboxDispatcherProcessor,
  OutboxDeliveryProcessor,
  OUTBOX_DISPATCHER_QUEUE,
  OUTBOX_DELIVERY_QUEUE,
} from './outbox.processor';
import { DomainEventModule } from './domain-event.module';

/**
 * OUTBOX MODULE — Commit 8 (Durable Event Delivery)
 *
 * Closes the dual-write gap in the governance event system.
 *
 * Import this module into ANY feature module that needs durable event delivery:
 *   imports: [OutboxModule]
 *
 * What this module provides:
 *   OutboxEventWriter  → write envelopes transactionally (inject into services)
 *   OutboxDispatcher   → poll and dispatch (used internally by the cron processor)
 *
 * Queue topology:
 *   governance.outbox.dispatcher → cron every 5s → polls DB → publishes envelopes
 *   governance.outbox.delivery   → consumes envelopes → routes to DomainEventBus
 *
 * Migration path from in-process bus.emit():
 *   Phase 1 (now): outboxWriter.write(manager, eventName, envelope, severity)
 *                  replaces bus.emit() at transaction boundaries
 *   Phase 2 (Commit 9): bus.emit() deprecated for mutation-origin events —
 *                        only allowed for system-internal events without DB mutations
 *
 * Integration invariant:
 *   OutboxModule imports DomainEventModule to get the bus for delivery routing.
 *   This creates a one-way dependency: Outbox → DomainEventBus.
 *   DomainEventModule does NOT depend on OutboxModule (no circular dependency).
 *
 * BullMQ cron job for dispatcher:
 *   To register the repeatable cron job, call registerOutboxCron() from the
 *   OutboxModule's onModuleInit, or register it via BullMQ Board/admin.
 *   The dispatcher processor handles jobs named 'poll'.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEventEntity]),
    BullModule.registerQueue(
      { name: OUTBOX_DISPATCHER_QUEUE },
      { name: OUTBOX_DELIVERY_QUEUE },
    ),
    DomainEventModule,
  ],
  providers: [
    OutboxEventWriter,
    OutboxDispatcher,
    OutboxDispatcherProcessor,
    OutboxDeliveryProcessor,
  ],
  exports: [
    OutboxEventWriter,   // for services that write events transactionally
    OutboxDispatcher,    // for governance dashboard (status, dead-letter queries)
  ],
})
export class OutboxModule {}
