import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

/**
 * OUTBOX EVENT STATUS
 *
 * Lifecycle of an outbox entry from write to delivery.
 *
 * PENDING      → Written transactionally with the domain mutation.
 *               Dispatcher will pick it up.
 * DISPATCHING  → Dispatcher has claimed this entry (SKIP LOCKED prevents
 *               concurrent pickup). In-flight to the queue.
 * DELIVERED    → Successfully published to BullMQ. Handlers will process via queue.
 * FAILED       → All retry attempts exhausted. Entry is dead-lettered.
 *               Requires manual intervention or explicit replay tooling.
 *
 * Terminal states: DELIVERED, FAILED.
 * The dispatcher never deletes rows — all state transitions are auditable.
 */
export enum OutboxEventStatus {
  PENDING     = 'PENDING',
  DISPATCHING = 'DISPATCHING',
  DELIVERED   = 'DELIVERED',
  FAILED      = 'FAILED',
}

/**
 * OUTBOX EVENT ENTITY — GOVERNANCE EVENT DURABILITY STORE
 *
 * The transactional outbox for the governance domain event system.
 * Bridges the dual-write gap between domain mutations and event delivery.
 *
 * Dual-write problem (now closed):
 *   BEFORE: PayrollService mutates DB → then calls bus.emit() → if process
 *           crashes between these, the event is lost with no recovery path.
 *
 *   AFTER:  PayrollService mutates DB + writes outbox row in ONE transaction
 *           → Dispatcher reads outbox → publishes to BullMQ
 *           → Handlers consume from queue (with replay protection from Commit 7)
 *
 * Exactly-once delivery guarantee (end-to-end):
 *   - Outbox write: atomic with domain mutation (ACID)
 *   - Dispatcher pickup: SKIP LOCKED prevents duplicate dispatch
 *   - Queue delivery: BullMQ jobId = outboxId (deduplication)
 *   - Handler execution: Commit 7 ReplayProtectionStore (deduplication)
 *
 * This entity is APPEND-ONLY from the domain mutation perspective.
 * Only the dispatcher updates status after writing.
 *
 * CRITICAL SEPARATION from FinancialOutboxEntity:
 *   FinancialOutboxEntity = financial command bus (PayrollItem → Ledger)
 *   OutboxEventEntity     = governance event bus (DomainEvent → Queue → Handlers)
 *   These must remain separate — they have different recipients and semantics.
 */
@Entity({ name: 'governance_outbox_events' })
@Index(['tenantId', 'status', 'nextRetryAt'])   // dispatcher polling index
@Index(['aggregateId', 'tenantId'])              // replay targeting index
export class OutboxEventEntity extends TenantScopedEntity {
  /**
   * Canonical domain event name from domain-events.ts.
   * Example: 'payroll.batch.reversed', 'task.assignment.created'.
   */
  @Column({ name: 'event_name', type: 'varchar', length: 100 })
  @Index()
  eventName!: string;

  /**
   * Full DomainEventEnvelope serialized as JSONB.
   * Includes: id, event, tenantId, payload, correlationId, causationId,
   * aggregateId, aggregateType, version, occurredAt, actorId.
   * Preserved exactly as emitted — no lossy re-serialization.
   */
  @Column({ type: 'jsonb' })
  envelope!: Record<string, unknown>;

  /**
   * The envelope.id — stored as a top-level column for uniqueness enforcement
   * and dispatcher deduplication without parsing JSONB on every poll.
   * UQ constraint prevents the same event from being written twice.
   */
  @Column({ name: 'envelope_id', type: 'uuid', unique: true })
  @Index()
  envelopeId!: string;

  /**
   * Delivery status. See OutboxEventStatus for lifecycle semantics.
   */
  @Column({
    type: 'enum',
    enum: OutboxEventStatus,
    default: OutboxEventStatus.PENDING,
  })
  status!: OutboxEventStatus;

  /**
   * Number of dispatch attempts so far.
   * Incremented by the dispatcher on each attempt (success or failure).
   */
  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount!: number;

  /**
   * Maximum dispatch attempts before transitioning to FAILED.
   * Set at write time — can vary per event severity.
   * Default: 5 (configurable by OutboxEventWriter).
   */
  @Column({ name: 'max_attempts', type: 'int', default: 5 })
  maxAttempts!: number;

  /**
   * When the dispatcher should next attempt delivery.
   * Null = immediately eligible. Set to future timestamp on retry with backoff.
   * Indexed — dispatcher uses: WHERE status='PENDING' AND next_retry_at <= NOW().
   */
  @Column({ name: 'next_retry_at', type: 'timestamp with time zone', nullable: true })
  @Index()
  nextRetryAt!: Date | null;

  /**
   * Last error message from the dispatcher — preserved for debugging.
   * Overwritten on each failed attempt. Final value = reason for dead-letter.
   */
  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  /**
   * Timestamp when the event was successfully delivered to BullMQ.
   * Null until status = DELIVERED.
   */
  @Column({ name: 'delivered_at', type: 'timestamp with time zone', nullable: true })
  deliveredAt!: Date | null;

  /**
   * BullMQ job ID assigned on delivery — for queue-side tracing.
   * Null until delivered.
   */
  @Column({ name: 'queue_job_id', type: 'varchar', length: 128, nullable: true })
  queueJobId!: string | null;

  // ── Event Provenance Fields (from envelope) ─────────────────────────────────
  // Stored as top-level columns for efficient provenance queries
  // without parsing JSONB. Mirrors DomainEventEnvelope fields.

  /** HTTP request correlation ID — stored for dispatcher log correlation. */
  @Column({ name: 'correlation_id', type: 'varchar', length: 36, nullable: true })
  correlationId!: string | null;

  /** Upstream event that caused this emission — event lineage graph. */
  @Column({ name: 'causation_id', type: 'uuid', nullable: true })
  causationId!: string | null;

  /** Root aggregate ID — for replay targeting. */
  @Column({ name: 'aggregate_id', type: 'uuid', nullable: true })
  aggregateId!: string | null;

  /** Root aggregate type — for replay filtering by type. */
  @Column({ name: 'aggregate_type', type: 'varchar', length: 100, nullable: true })
  aggregateType!: string | null;

  /**
   * Severity hint written by the emitting service.
   * Used by the dispatcher to prioritize dispatch order:
   *   critical events dispatch before eventual, eventual before best_effort.
   */
  @Column({ name: 'severity', type: 'varchar', length: 20, default: 'eventual' })
  severity!: 'critical' | 'eventual' | 'best_effort';
}
