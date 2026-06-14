import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OutboxEventEntity,
  OutboxEventStatus,
} from '../../database/entities/outbox-event.entity';
import { DomainEventEnvelope } from './domain-event.types';
import { DomainEventName } from '../governance/events/domain-events';

/**
 * OUTBOX EVENT WRITER
 *
 * The write surface for governance event durability.
 * Persists a DomainEventEnvelope to the outbox WITHIN the caller's transaction.
 *
 * This is the critical coupling point that closes the dual-write problem:
 *
 *   BEFORE (Commits 1–7):
 *     1. manager.save(entity)       [TX commits]
 *     2. bus.emit(...)              [in-process, not durable]
 *     RISK: process crash between 1 and 2 = event silently lost
 *
 *   AFTER (Commit 8):
 *     1. manager.save(entity)
 *     2. outboxWriter.write(manager, envelope)  [same TX]
 *     [TX commits atomically]
 *     3. OutboxDispatcher reads outbox → publishes to BullMQ → handlers consume
 *     GUARANTEE: if the mutation commits, the event will eventually be delivered
 *
 * Usage contract:
 *   outboxWriter.write() MUST be called with the same EntityManager as the
 *   domain mutation — both writes must commit in the same transaction.
 *   Calling write() outside a transaction defeats the durability guarantee.
 *
 * Severity mapping to max dispatch attempts:
 *   critical    → 10 attempts (financial mutations, compliance events)
 *   eventual    → 5 attempts  (search, activity feed)
 *   best_effort → 2 attempts  (notifications — ephemeral, not retried aggressively)
 */
@Injectable()
export class OutboxEventWriter {
  private readonly logger = new Logger(OutboxEventWriter.name);

  private static readonly MAX_ATTEMPTS_BY_SEVERITY: Record<
    'critical' | 'eventual' | 'best_effort',
    number
  > = {
    critical:    10,
    eventual:    5,
    best_effort: 2,
  };

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly repo: Repository<OutboxEventEntity>,
  ) {}

  /**
   * Write a domain event envelope to the outbox within the caller's transaction.
   *
   * @param manager    The EntityManager from the active transaction.
   *                   MUST be the same transaction as the domain mutation.
   * @param eventName  Canonical event name.
   * @param envelope   Full DomainEventEnvelope — serialized as-is into JSONB.
   * @param severity   Delivery tier — determines retry aggressiveness.
   */
  async write(
    manager: EntityManager,
    eventName: DomainEventName,
    envelope: DomainEventEnvelope,
    severity: 'critical' | 'eventual' | 'best_effort' = 'eventual',
  ): Promise<OutboxEventEntity> {
    const maxAttempts = OutboxEventWriter.MAX_ATTEMPTS_BY_SEVERITY[severity];

    const entry = manager.create(OutboxEventEntity, {
      tenantId:      envelope.tenantId,
      eventName,
      envelopeId:    envelope.id,       // unique — prevents double-write
      envelope:      envelope as unknown as Record<string, unknown>,
      status:        OutboxEventStatus.PENDING,
      attemptCount:  0,
      maxAttempts,
      nextRetryAt:   null,              // immediately eligible for dispatch
      lastError:     null,
      deliveredAt:   null,
      queueJobId:    null,
      correlationId: envelope.correlationId ?? null,
      causationId:   envelope.causationId ?? null,
      aggregateId:   envelope.aggregateId ?? null,
      aggregateType: envelope.aggregateType ?? null,
      severity,
    });

    const saved = await manager.save(entry);

    this.logger.debug(
      `OUTBOX_WRITE: ${eventName} [envelopeId=${envelope.id}] ` +
        `[aggregate=${envelope.aggregateType}/${envelope.aggregateId}] ` +
        `[severity=${severity}] [maxAttempts=${maxAttempts}]`,
    );

    return saved;
  }

  /**
   * Write multiple events in a single batch — for operations that emit
   * several events atomically (e.g., batch reversal emitting per-item events).
   * All writes share the same transaction.
   */
  async writeBatch(
    manager: EntityManager,
    events: Array<{
      eventName: DomainEventName;
      envelope: DomainEventEnvelope;
      severity?: 'critical' | 'eventual' | 'best_effort';
    }>,
  ): Promise<OutboxEventEntity[]> {
    const entries = await Promise.all(
      events.map(({ eventName, envelope, severity = 'eventual' }) =>
        this.write(manager, eventName, envelope, severity),
      ),
    );
    return entries;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * OUTBOX DISPATCHER
 *
 * The read surface for governance event durability.
 * Background worker that polls PENDING entries and delivers to BullMQ.
 *
 * Design:
 *   SKIP LOCKED prevents concurrent dispatcher instances from picking up
 *   the same entry — safe for horizontal scaling.
 *
 * Backoff strategy (exponential with jitter):
 *   Attempt 1: immediate
 *   Attempt 2: 30s
 *   Attempt 3: 2m
 *   Attempt 4: 10m
 *   Attempt 5: 30m
 *   Attempt 6+: 1h (cap)
 *
 * Dead-letter:
 *   When attemptCount >= maxAttempts, status → FAILED.
 *   FAILED entries are never retried automatically.
 *   Manual replay: reset status to PENDING, set nextRetryAt=null.
 *
 * Dispatch order:
 *   Critical events dispatch before eventual, eventual before best_effort.
 *   Within severity, FIFO (createdAt ASC).
 *
 * Deduplication at queue:
 *   BullMQ jobId = outbox row ID. If dispatcher crashes mid-flight and
 *   retries, the same jobId is used → BullMQ deduplicates the job.
 */
@Injectable()
export class OutboxDispatcher {
  private readonly logger = new Logger(OutboxDispatcher.name);

  /**
   * Backoff intervals in milliseconds — index = attemptCount (0-based after failure).
   * Beyond index 5, the last value (1h) is used as the cap.
   */
  private static readonly BACKOFF_MS = [
    0,           // attempt 1: immediate
    30_000,      // attempt 2: 30s
    120_000,     // attempt 3: 2m
    600_000,     // attempt 4: 10m
    1_800_000,   // attempt 5: 30m
    3_600_000,   // attempt 6+: 1h (cap)
  ];

  /** Batch size per dispatcher invocation — prevents stampedes on large queues. */
  private static readonly BATCH_SIZE = 50;

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly repo: Repository<OutboxEventEntity>,
  ) {}

  /**
   * Poll for PENDING events and dispatch them to the BullMQ queue.
   * Called by the OutboxDispatcherProcessor (BullMQ cron worker).
   *
   * @param enqueue  Function that publishes to BullMQ — injected to keep
   *                 OutboxDispatcher free of BullMQ coupling.
   *                 Returns the BullMQ job ID on success.
   */
  async dispatchPending(
    enqueue: (entry: OutboxEventEntity) => Promise<string>,
  ): Promise<{ dispatched: number; failed: number }> {
    const now = new Date();
    let dispatched = 0;
    let failed = 0;

    // Fetch eligible entries — SKIP LOCKED prevents concurrent pickup.
    // Order: critical first, then by age (FIFO within tier).
    const eligible = await this.repo
      .createQueryBuilder('outbox')
      .where('outbox.status = :status', { status: OutboxEventStatus.PENDING })
      .andWhere('(outbox.next_retry_at IS NULL OR outbox.next_retry_at <= :now)', { now })
      .orderBy(
        `CASE outbox.severity
           WHEN 'critical'    THEN 1
           WHEN 'eventual'    THEN 2
           WHEN 'best_effort' THEN 3
           ELSE 4
         END`,
        'ASC',
      )
      .addOrderBy('outbox.created_at', 'ASC')
      .take(OutboxDispatcher.BATCH_SIZE)
      .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .getMany();

    if (eligible.length === 0) return { dispatched: 0, failed: 0 };

    this.logger.debug(`OUTBOX_DISPATCH: processing ${eligible.length} pending entries`);

    for (const entry of eligible) {
      try {
        // Claim the entry — prevents other dispatcher instances from picking it up
        await this.repo.update(entry.id, { status: OutboxEventStatus.DISPATCHING });

        const jobId = await enqueue(entry);

        // Mark as delivered
        await this.repo.update(entry.id, {
          status:      OutboxEventStatus.DELIVERED,
          deliveredAt: new Date(),
          queueJobId:  jobId,
          attemptCount: entry.attemptCount + 1,
        });

        this.logger.log(
          `OUTBOX_DELIVERED: ${entry.eventName} [envelopeId=${entry.envelopeId}] [jobId=${jobId}]`,
        );
        dispatched++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const nextAttemptCount = entry.attemptCount + 1;
        const isDead = nextAttemptCount >= entry.maxAttempts;

        const backoffIndex = Math.min(nextAttemptCount, OutboxDispatcher.BACKOFF_MS.length - 1);
        const backoffMs = OutboxDispatcher.BACKOFF_MS[backoffIndex]!;
        const nextRetryAt = isDead
          ? null
          : new Date(now.getTime() + backoffMs + Math.floor(Math.random() * 5000)); // ±5s jitter

        await this.repo.update(entry.id, {
          status:       isDead ? OutboxEventStatus.FAILED : OutboxEventStatus.PENDING,
          attemptCount: nextAttemptCount,
          lastError:    message,
          nextRetryAt,
        });

        if (isDead) {
          this.logger.error(
            `OUTBOX_DEAD_LETTER: ${entry.eventName} [envelopeId=${entry.envelopeId}] ` +
              `exhausted ${entry.maxAttempts} attempts. Last error: ${message}`,
          );
        } else {
          this.logger.warn(
            `OUTBOX_RETRY: ${entry.eventName} [envelopeId=${entry.envelopeId}] ` +
              `attempt ${nextAttemptCount}/${entry.maxAttempts}. ` +
              `Next retry in ${backoffMs / 1000}s. Error: ${message}`,
          );
        }
        failed++;
      }
    }

    return { dispatched, failed };
  }

  /**
   * Returns counts of outbox entries by status — for the governance dashboard.
   * Safe to call without a transaction.
   */
  async getStatusSummary(tenantId: string): Promise<Record<OutboxEventStatus, number>> {
    const rows = await this.repo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.tenant_id = :tenantId', { tenantId })
      .groupBy('o.status')
      .getRawMany<{ status: OutboxEventStatus; count: string }>();

    const summary: Record<OutboxEventStatus, number> = {
      [OutboxEventStatus.PENDING]:     0,
      [OutboxEventStatus.DISPATCHING]: 0,
      [OutboxEventStatus.DELIVERED]:   0,
      [OutboxEventStatus.FAILED]:      0,
    };

    for (const row of rows) {
      summary[row.status] = parseInt(row.count, 10);
    }

    return summary;
  }

  /**
   * Get all dead-lettered events for a tenant — for the governance dashboard.
   * These require manual investigation and optional replay.
   */
  async getDeadLettered(
    tenantId: string,
    limit = 50,
  ): Promise<OutboxEventEntity[]> {
    return this.repo.find({
      where: { tenantId, status: OutboxEventStatus.FAILED },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Manual replay: reset a dead-lettered entry to PENDING for re-dispatch.
   * Used by governance tooling and the replay inspector (Commit 9).
   */
  async resetForReplay(outboxId: string, tenantId: string): Promise<void> {
    const entry = await this.repo.findOne({ where: { id: outboxId, tenantId } });
    if (!entry || entry.status !== OutboxEventStatus.FAILED) {
      throw new Error(
        `Cannot replay outbox entry ${outboxId}: ` +
          `not found or status is not FAILED (actual: ${entry?.status ?? 'NOT_FOUND'})`,
      );
    }

    await this.repo.update(outboxId, {
      status:       OutboxEventStatus.PENDING,
      attemptCount: 0,
      nextRetryAt:  null,
      lastError:    null,
    });

    this.logger.log(
      `OUTBOX_REPLAY: entry ${outboxId} reset to PENDING for re-dispatch. ` +
        `Event: ${entry.eventName} [envelopeId=${entry.envelopeId}]`,
    );
  }
}
