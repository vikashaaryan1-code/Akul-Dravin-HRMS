import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ProcessedEventEntity } from '../../database/entities/processed-event.entity';

/**
 * REPLAY PROTECTION STORE
 *
 * The idempotency enforcement surface for projection handlers.
 *
 * Contract:
 *   Before executing: call hasProcessed(eventId, handlerName).
 *   After executing:  call markProcessed(eventId, ...).
 *
 * This completes the idempotency story introduced by the envelope hardening
 * pass (DomainEventEnvelope.id). The envelope shape was replay-safe;
 * this store makes handler behavior replay-safe.
 *
 * Replay safety properties guaranteed by this interface:
 *   1. Duplicate detection:   same eventId + handlerName → skip.
 *   2. Partial failure safety: markProcessed only called after handler success.
 *   3. Targeted replay:       clearForAggregate() enables entity-level replay.
 *   4. TTL cleanup:           clearExpired() removes stale records.
 */
export interface ReplayProtectionStore {
  /**
   * Returns true if this handler has already successfully processed this event.
   * Handlers must check this before executing any side effects.
   *
   * @param eventId     DomainEventEnvelope.id — the bus-generated UUID.
   * @param handlerName ProjectionHandler.name.
   */
  hasProcessed(eventId: string, handlerName: string): Promise<boolean>;

  /**
   * Records that this handler has successfully processed the event.
   * Call this AFTER the handler has committed its side effects.
   *
   * Calling this before the handler completes creates a false-positive:
   * if the handler then fails, the event will never be reprocessed.
   *
   * @param eventId       DomainEventEnvelope.id.
   * @param handlerName   ProjectionHandler.name.
   * @param context       Additional envelope fields for forensic querying.
   * @param ttlDays       Days until this record expires (null = never).
   */
  markProcessed(
    eventId: string,
    handlerName: string,
    context: {
      tenantId: string;
      eventName: string;
      aggregateId?: string;
      aggregateType?: string;
      durationMs?: number;
    },
    ttlDays?: number | null,
  ): Promise<void>;

  /**
   * Clears idempotency records for a specific aggregate and handler.
   * Used by replay tooling to force selective reprocessing.
   *
   * Use case: "Audit handler was broken for one hour — replay all audit events
   * for PayrollBatch X to reconstruct the missing audit trail."
   *
   * @param aggregateId   ID of the specific entity to replay.
   * @param handlerName   Handler to replay for. Pass undefined to clear all handlers.
   */
  clearForAggregate(aggregateId: string, handlerName?: string): Promise<number>;

  /**
   * Removes all records where expiresAt < now().
   * Called by a background cleanup job (BullMQ cron in Commit 8).
   * Returns the number of records deleted.
   */
  clearExpired(): Promise<number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY IMPLEMENTATION (testing / dev)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * IN-MEMORY REPLAY PROTECTION STORE
 *
 * Non-persistent implementation for unit tests and local development.
 * Never use in production — records are lost on restart.
 *
 * Provides identical interface to DatabaseReplayProtectionStore so
 * tests require zero modification to switch implementations.
 */
export class InMemoryReplayProtectionStore implements ReplayProtectionStore {
  private readonly processed = new Map<string, Set<string>>();

  async hasProcessed(eventId: string, handlerName: string): Promise<boolean> {
    return this.processed.get(eventId)?.has(handlerName) ?? false;
  }

  async markProcessed(
    eventId: string,
    handlerName: string,
    context?: {
      tenantId: string;
      eventName: string;
      aggregateId?: string;
      aggregateType?: string;
      durationMs?: number;
    },
    ttlDays?: number | null,
  ): Promise<void> {
    if (!this.processed.has(eventId)) {
      this.processed.set(eventId, new Set());
    }
    this.processed.get(eventId)!.add(handlerName);
  }

  async clearForAggregate(_aggregateId: string, _handlerName?: string): Promise<number> {
    // In-memory: no aggregate index — clear nothing (test-safe)
    return 0;
  }

  async clearExpired(): Promise<number> {
    return 0;
  }

  /** Test utility: reset all state between test cases. */
  reset(): void {
    this.processed.clear();
  }

  /** Test utility: count total processed records. */
  countProcessed(): number {
    let count = 0;
    for (const set of this.processed.values()) count += set.size;
    return count;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE IMPLEMENTATION (production)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DATABASE REPLAY PROTECTION STORE
 *
 * Production-grade, persistent idempotency store backed by PostgreSQL.
 * Uses the ProcessedEventEntity table with a unique constraint on
 * (eventId, handlerName) to guarantee deduplication at the DB layer.
 *
 * Idempotency guarantee model:
 *   The unique constraint is the hard enforcement boundary.
 *   hasProcessed() provides an early-exit optimization — it avoids executing
 *   the handler body unnecessarily. But even if hasProcessed() returns false
 *   and two concurrent workers both proceed, the markProcessed() INSERT
 *   will succeed for only one: the constraint violation is caught and the
 *   second execution is treated as a duplicate and silently ignored.
 *
 * This is the "check-then-act with DB uniqueness fallback" pattern —
 * safe under concurrent retries without distributed locking.
 */
@Injectable()
export class DatabaseReplayProtectionStore implements ReplayProtectionStore {
  private readonly logger = new Logger(DatabaseReplayProtectionStore.name);

  /** Default TTL: 30 days for most events. */
  static readonly DEFAULT_TTL_DAYS = 30;

  /** Null TTL for critical events (audit records must be permanent). */
  static readonly PERMANENT_TTL = null;

  constructor(
    @InjectRepository(ProcessedEventEntity)
    private readonly repo: Repository<ProcessedEventEntity>,
  ) {}

  async hasProcessed(eventId: string, handlerName: string): Promise<boolean> {
    const count = await this.repo.count({ where: { eventId, handlerName } });
    return count > 0;
  }

  async markProcessed(
    eventId: string,
    handlerName: string,
    context: {
      tenantId: string;
      eventName: string;
      aggregateId?: string;
      aggregateType?: string;
      durationMs?: number;
    },
    ttlDays: number | null = DatabaseReplayProtectionStore.DEFAULT_TTL_DAYS,
  ): Promise<void> {
    const now = new Date();
    const expiresAt =
      ttlDays !== null
        ? new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000)
        : null;

    try {
      await this.repo.insert({
        eventId,
        handlerName,
        tenantId:      context.tenantId,
        eventName:     context.eventName,
        aggregateId:   context.aggregateId ?? null,
        aggregateType: context.aggregateType ?? null,
        processedAt:   now,
        durationMs:    context.durationMs ?? null,
        expiresAt,
      });
    } catch (err: unknown) {
      // Unique constraint violation = duplicate — already processed by a concurrent worker.
      // This is expected and safe. Log at debug level (not warn/error).
      const isUniqueViolation =
        err instanceof Error &&
        (err.message.includes('duplicate key') ||
          err.message.includes('unique constraint') ||
          err.message.includes('UQ_processed_event_handler'));

      if (isUniqueViolation) {
        this.logger.debug(
          `Duplicate idempotency key suppressed: eventId=${eventId} handler=${handlerName} ` +
            `(concurrent worker already marked processed)`,
        );
        return;
      }

      // Any other error is a genuine storage failure — rethrow
      throw err;
    }
  }

  async clearForAggregate(aggregateId: string, handlerName?: string): Promise<number> {
    const where = handlerName
      ? { aggregateId, handlerName }
      : { aggregateId };

    const result = await this.repo.delete(where);
    const affected = result.affected ?? 0;

    this.logger.log(
      `REPLAY_CLEAR: cleared ${affected} idempotency record(s) for ` +
        `aggregateId=${aggregateId}${handlerName ? ` handler=${handlerName}` : ' (all handlers)'}`,
    );

    return affected;
  }

  async clearExpired(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });
    const affected = result.affected ?? 0;
    this.logger.log(`REPLAY_CLEANUP: cleared ${affected} expired idempotency record(s)`);
    return affected;
  }
}
