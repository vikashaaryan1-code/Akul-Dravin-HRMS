import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from '../../database/entities/tenant-scoped.entity';

/**
 * TRANSITION JOURNAL ENTITY — IMMUTABLE HISTORICAL TRUTH
 *
 * Append-only log of every PayrollBatch state transition.
 * This entity is the HISTORICAL record — not operational state.
 *
 * The three truths of the platform:
 *  - PayrollBatchEntity.status    = mutable operational truth (current state)
 *  - TransitionJournalEntry        = immutable historical truth (what happened)
 *  - DomainEventEnvelope           = distributed-system truth (what was propagated)
 *
 * Immutability contract:
 *  - Rows in this table are NEVER updated or deleted.
 *  - The only valid operation is INSERT.
 *  - Any attempt to UPDATE or DELETE a journal row is a governance violation.
 *  - TypeORM: no update() or delete() calls on this repo — TransitionPolicyEngine
 *    exclusively uses repo.save() on fresh instances.
 *
 * Forensic reconstruction:
 *  Given a batchId, the full transition history can be replayed in order of
 *  createdAt to reconstruct the complete lifecycle of any payroll batch.
 *
 * Governance properties:
 *  - justification is required for REVERSED transitions (enforced by policy engine)
 *  - eventEnvelopeId links back to the DomainEventEnvelope for cross-plane tracing
 *  - correlationId threads back to the originating HTTP request
 *  - causationId identifies the upstream event that caused this transition (if any)
 */
@Entity({ name: 'payroll_transition_journal' })
@Index(['batchId', 'createdAt'])         // primary access pattern: history by batch
@Index(['tenantId', 'toStatus'])         // secondary: find all batches in a target state
@Index(['actorId', 'createdAt'])         // audit: find all transitions by a specific actor
export class TransitionJournalEntity extends TenantScopedEntity {
  /** ID of the PayrollBatch being transitioned. */
  @Index()
  @Column({ name: 'batch_id', type: 'uuid' })
  batchId!: string;

  /** State the batch was in BEFORE this transition. */
  @Column({ name: 'from_status', type: 'varchar', length: 30 })
  fromStatus!: string;

  /** State the batch transitioned INTO. */
  @Index()
  @Column({ name: 'to_status', type: 'varchar', length: 30 })
  toStatus!: string;

  /**
   * ID of the actor who authorized this transition.
   * Null for system-originated transitions (PROCESSING, COMPLETED, FAILED).
   */
  @Index()
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  /**
   * Roles held by the actor at the time of transition.
   * Stored as JSON array for forensic RBAC audit.
   * "What permissions did this person have when they made this decision?"
   */
  @Column({ name: 'actor_roles', type: 'jsonb', default: '[]' })
  actorRoles!: string[];

  /**
   * Human-readable justification — REQUIRED for REVERSED transitions.
   * Optional for all other transitions.
   * Becomes part of the forensic record explaining WHY the reversal occurred.
   */
  @Column({ name: 'justification', type: 'text', nullable: true })
  justification!: string | null;

  /**
   * Canonical rationale text from TRANSITION_RATIONALE — explains what
   * this transition semantically means. Stored at write time so forensic
   * replay does not depend on the current state of the codebase.
   */
  @Column({ name: 'governance_rationale', type: 'text', nullable: true })
  governanceRationale!: string | null;

  /**
   * The id from the DomainEventEnvelope emitted for this transition.
   * Links the journal entry to the distributed-system truth plane.
   * Enables cross-plane trace: journal entry ↔ event envelope ↔ HTTP request.
   */
  @Index()
  @Column({ name: 'event_envelope_id', type: 'uuid', nullable: true })
  eventEnvelopeId!: string | null;

  /**
   * HTTP request correlation ID — threads back to the originating request.
   * Enables: "show me everything that happened as a result of request X".
   */
  @Index()
  @Column({ name: 'correlation_id', type: 'varchar', length: 64, nullable: true })
  correlationId!: string | null;

  /**
   * ID of the upstream DomainEventEnvelope that caused this transition.
   * Set when this transition is itself a downstream effect of another event.
   * Enables full event causation graph reconstruction.
   */
  @Column({ name: 'causation_id', type: 'uuid', nullable: true })
  causationId!: string | null;

  /**
   * Additional context metadata stored as JSON.
   * Used for domain-specific data: batch seal, year/month, item counts, etc.
   */
  @Column({ name: 'metadata', type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;
}
