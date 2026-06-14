import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { OutboxDispatcher, OutboxEventWriter } from './outbox-event.service';
import { OutboxEventEntity } from '../../database/entities/outbox-event.entity';
import { DomainEventBus } from './domain-event-bus';
import { DomainEventEnvelope } from './domain-event.types';
import { DomainEventName } from '../governance/events/domain-events';

/**
 * QUEUE NAMES — Outbox tier
 *
 * Two queues separate dispatch from execution:
 *   OUTBOX_DISPATCHER_QUEUE: cron-driven poll → picks up PENDING outbox entries
 *   OUTBOX_DELIVERY_QUEUE:   receives the delivered envelopes → routes to handlers
 *
 * Why two queues?
 *   The dispatcher (poll + publish) and the delivery (consume + route) have
 *   different scaling characteristics:
 *     - Dispatcher: one active instance at a time (avoids SKIP LOCKED contention)
 *     - Delivery: horizontally scalable (idempotency handles concurrent delivery)
 */
export const OUTBOX_DISPATCHER_QUEUE = 'governance.outbox.dispatcher';
export const OUTBOX_DELIVERY_QUEUE   = 'governance.outbox.delivery';

/**
 * OUTBOX DISPATCH CRON JOB — BullMQ Repeatable
 *
 * Polls the governance_outbox_events table for PENDING entries and
 * publishes them to OUTBOX_DELIVERY_QUEUE.
 *
 * Cron: every 5 seconds. This is aggressive but correct:
 *   - critical events need sub-10s delivery
 *   - idle polling is cheap (the index handles empty scans in < 1ms)
 *   - SKIP LOCKED prevents contention even if multiple instances run
 *
 * This processor ONLY dispatches — it does NOT execute handlers.
 * Handler execution happens in OutboxDeliveryProcessor.
 */
@Processor(OUTBOX_DISPATCHER_QUEUE)
export class OutboxDispatcherProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxDispatcherProcessor.name);

  constructor(
    private readonly dispatcher: OutboxDispatcher,
    @InjectQueue(OUTBOX_DELIVERY_QUEUE)
    private readonly deliveryQueue: Queue,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    const result = await this.dispatcher.dispatchPending(
      async (entry: OutboxEventEntity): Promise<string> => {
        // Add to delivery queue — BullMQ jobId = outbox row ID for deduplication
        const job = await this.deliveryQueue.add(
          'deliver',
          { outboxId: entry.id, envelope: entry.envelope, eventName: entry.eventName },
          {
            jobId:    entry.id,   // deterministic — prevents duplicate queue entries
            attempts: 1,         // delivery queue does not retry — outbox handles retries
            removeOnComplete: { count: 1000 },
            removeOnFail:     { count: 500 },
          },
        );
        return job.id ?? entry.id;
      },
    );

    if (result.dispatched > 0 || result.failed > 0) {
      this.logger.log(
        `OUTBOX_DISPATCH_CYCLE: dispatched=${result.dispatched} failed=${result.failed}`,
      );
    }
  }
}

/**
 * OUTBOX DELIVERY PROCESSOR
 *
 * Consumes events from OUTBOX_DELIVERY_QUEUE and routes them through
 * the DomainEventBus to registered (idempotent) handlers.
 *
 * This is the consumer side of the outbox pattern.
 * At this point:
 *   - The envelope is guaranteed to exist (was committed to DB)
 *   - The delivery is guaranteed to be attempted (outbox wrote it)
 *   - Handler idempotency is guaranteed (Commit 7 ReplayProtectionStore)
 *
 * So the full exactly-once guarantee is:
 *   DB mutation + outbox write (atomic, ACID)
 *   → Dispatcher polls and enqueues (SKIP LOCKED)
 *   → BullMQ deduplicates by jobId
 *   → Handler checks ReplayProtectionStore
 *   → Handler executes (or skips)
 *   → ReplayProtectionStore.markProcessed() (after success)
 */
@Processor(OUTBOX_DELIVERY_QUEUE)
export class OutboxDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxDeliveryProcessor.name);

  constructor(
    private readonly domainEventBus: DomainEventBus,
  ) {
    super();
  }

  async process(job: Job<{
    outboxId:  string;
    envelope:  DomainEventEnvelope;
    eventName: DomainEventName;
  }>): Promise<void> {
    const { envelope, eventName, outboxId } = job.data;

    this.logger.debug(
      `OUTBOX_DELIVERY: delivering ${eventName} ` +
        `[outboxId=${outboxId}] [envelopeId=${envelope.id}]`,
    );

    // Route through the in-process bus — handlers are idempotent (Commit 7)
    // The bus emits to critical → eventual → best_effort handlers in severity order.
    // We re-use the existing emit() infrastructure; envelope.id flows to handlers
    // for replay protection store lookups.
    await this.domainEventBus.deliverFromOutbox(eventName, envelope);
  }
}
