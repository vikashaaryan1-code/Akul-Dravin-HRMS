import { Column, Entity, Index } from 'typeorm';
import { createHash } from 'crypto';
import { TenantScopedEntity } from './tenant-scoped.entity';

/**
 * Compute a stable SHA-256 fingerprint for a static analysis violation.
 *
 * Fingerprint components:
 *   ruleId      — stable rule identifier (GovernanceRuleId enum value)
 *   filePath    — relative path of the offending file (normalized to forward-slashes)
 *   line        — line number of the violation
 *   pattern     — the forbidden import token that matched (e.g. 'typeorm::Repository')
 *   ruleVersion — version of the rule's detection semantics (default: '1')
 *
 * The ruleVersion field exists to handle rule evolution:
 *   If detection semantics change (new symbols added, path normalisation changed),
 *   bump ruleVersion → new fingerprints → old DB rows go "cold" gracefully
 *   instead of silently matching different violations.
 *
 * Backward compatibility:
 *   ruleVersion defaults to '1'. All existing fingerprints computed without
 *   ruleVersion are equivalent to ruleVersion='1' — no migration needed.
 *
 * Runtime violations (ILLEGAL_TRANSITION, etc.) set fingerprint = null — each is a unique event.
 */
export function computeViolationFingerprint(
  ruleId:      string,
  filePath:    string,
  line:        number,
  pattern:     string,
  ruleVersion: string = '1',
): string {
  // Normalise filePath to forward-slashes (Windows path safety)
  const normalizedPath = filePath.replace(/\\/g, '/');
  return createHash('sha256')
    .update(`${ruleId}:${normalizedPath}:${line}:${pattern}:v${ruleVersion}`)
    .digest('hex');
}

/**
 * VIOLATION TYPE — Governance violation classification.
 *
 * Runtime violations (Commits 5–6 transition engine):
 *   ILLEGAL_TRANSITION    → state change not in the transition map
 *   INSUFFICIENT_ROLE     → actor lacks required role for target state
 *   MISSING_JUSTIFICATION → justification required but not provided
 *
 * Propagation violations (Commits 7–8 event bus):
 *   REPLAY_COLLISION      → concurrent duplicate event delivery (DB constraint caught it)
 *   OUTBOX_EXHAUSTED      → event exhausted all retry attempts → dead-lettered
 *
 * Static analysis violations (Commit 10 scanner):
 *   HANDLER_ENTITY_INJECTION     → projection handler injects a domain repository
 *   HANDLER_SERVICE_INJECTION    → projection handler injects a transactional service
 *   CONTROLLER_REPO_INJECTION    → controller injects a TypeORM repository directly
 *   FORBIDDEN_MODULE_IMPORT      → module imports a module it must not depend on
 *   TRANSITION_ENGINE_VIOLATION  → transition engine imports a controller/handler
 */
export enum ViolationType {
  // Runtime — transition engine
  ILLEGAL_TRANSITION    = 'ILLEGAL_TRANSITION',
  INSUFFICIENT_ROLE     = 'INSUFFICIENT_ROLE',
  MISSING_JUSTIFICATION = 'MISSING_JUSTIFICATION',

  // Runtime — event bus / outbox
  REPLAY_COLLISION  = 'REPLAY_COLLISION',
  OUTBOX_EXHAUSTED  = 'OUTBOX_EXHAUSTED',

  // Static analysis — import graph
  HANDLER_ENTITY_INJECTION    = 'HANDLER_ENTITY_INJECTION',
  HANDLER_SERVICE_INJECTION   = 'HANDLER_SERVICE_INJECTION',
  CONTROLLER_REPO_INJECTION   = 'CONTROLLER_REPO_INJECTION',
  FORBIDDEN_MODULE_IMPORT     = 'FORBIDDEN_MODULE_IMPORT',
  TRANSITION_ENGINE_VIOLATION = 'TRANSITION_ENGINE_VIOLATION',
}

export enum ViolationSeverity {
  /** Security incident — immediate investigation required. */
  CRITICAL = 'CRITICAL',
  /** Governance failure — SLA breach risk. */
  HIGH     = 'HIGH',
  /** Policy violation — review required within 24h. */
  MEDIUM   = 'MEDIUM',
  /** Informational — trend monitoring. */
  LOW      = 'LOW',
}

/**
 * VIOLATION STATUS — Lifecycle state of a governance violation.
 *
 * This is NOT the same as resolved_at (which tracks when soft-resolution happened).
 * Status provides a richer lifecycle for teams managing architectural debt:
 *
 *   ACTIVE      — Default. Violation is currently detected and unaddressed.
 *                 The scanner updates lastSeenAt on every run.
 *
 *   SUPPRESSED  — The team has acknowledged this violation and chosen to defer it.
 *                 Use suppressedUntil to enforce a deadline for resolution.
 *                 After suppressedUntil, the scanner can treat it as ACTIVE again.
 *                 Example: "We'll fix this in Sprint 24. Suppress until 2026-06-01."
 *
 *   ACCEPTED    — The violation is a permanent architectural decision that will
 *                 not be fixed. This is a deliberate trade-off, reviewed and approved.
 *                 Example: "This legacy handler predates the governance rules.
 *                  It's too risky to refactor before v2. Accepted."
 *
 *   RESOLVED    — The violation was fixed. The scanner no longer detects it.
 *                 Transitions to RESOLVED happen when:
 *                   a) The scanner runs and does NOT find the fingerprint
 *                   b) An operator marks it resolved (premature resolution)
 *
 * Note: The Git baseline (governance-baseline.json) is a separate mechanism
 * for bulk brownfield adoption. ViolationStatus is for per-violation lifecycle
 * management by individual teams once the platform is operational.
 */
export enum ViolationStatus {
  ACTIVE     = 'ACTIVE',
  SUPPRESSED = 'SUPPRESSED',
  ACCEPTED   = 'ACCEPTED',
  RESOLVED   = 'RESOLVED',
}

/**
 * VIOLATION LOG ENTITY — THE FIFTH TRUTH PLANE
 *
 * Persistent, queryable record of every governance violation detected
 * by the platform — runtime and static.
 *
 * This entity closes the gap noted in Commit 9:
 *   "Violations are operationally visible but not durably queryable historically."
 *
 * Now violations are:
 *   - Persisted for trend analysis (is the ILLEGAL_TRANSITION rate climbing?)
 *   - Queryable for abuse detection (same actor generating repeated RBAC violations?)
 *   - Exportable to SIEM (correlationId + actorId + violationType = audit entry)
 *   - Available for regression analysis (did a deployment spike violations?)
 *
 * The five truth planes are now complete:
 *   1. Operational entities     → current mutable state
 *   2. Transition journal       → immutable historical state
 *   3. Outbox events            → durable propagation intent
 *   4. Processed events         → replay execution history
 *   5. Violation log (this)     → governance enforcement history
 *
 * Immutability:
 *   Rows are NEVER deleted. Each violation is an immutable record.
 *   If a false-positive is detected, it is annotated via resolvedAt + resolutionNote
 *   (soft resolution), not deleted.
 *
 * Tenant scoping:
 *   tenantId is always set for runtime violations.
 *   For static analysis violations, tenantId is 'PLATFORM' (cross-tenant).
 */
@Entity({ name: 'governance_violation_log' })
@Index(['tenantId', 'violationType', 'occurredAt'])     // trend queries
@Index(['actorId', 'tenantId', 'occurredAt'])            // abuse detection
@Index(['aggregateId', 'violationType'])                 // per-aggregate forensics
@Index(['occurredAt'])                                   // time-window queries
@Index(['status', 'occurredAt'])                         // status filter (dashboard)
export class ViolationLogEntity extends TenantScopedEntity {

  /** Violation classification. */
  @Column({ name: 'violation_type', type: 'varchar', length: 60 })
  @Index()
  violationType!: ViolationType;

  /** Severity tier. */
  @Column({
    type: 'enum',
    enum: ViolationSeverity,
    default: ViolationSeverity.HIGH,
  })
  severity!: ViolationSeverity;

  /**
   * Lifecycle status of this violation.
   * Defaults to ACTIVE. Transitions: ACTIVE → SUPPRESSED → ACTIVE → RESOLVED | ACCEPTED.
   * See ViolationStatus enum for semantics.
   */
  @Column({
    type: 'enum',
    enum: ViolationStatus,
    default: ViolationStatus.ACTIVE,
  })
  status!: ViolationStatus;

  /**
   * Domain or subsystem that generated the violation.
   * Examples: 'payroll', 'leave', 'governance', 'static-analysis'.
   */
  @Column({ type: 'varchar', length: 50 })
  domain!: string;

  /**
   * Actor (user ID, SYSTEM, or scanner) that triggered the violation.
   * Null for system-originated violations (e.g., OUTBOX_EXHAUSTED).
   */
  @Column({ name: 'actor_id', type: 'varchar', length: 36, nullable: true })
  actorId!: string | null;

  /**
   * Actor's role at the time of the violation.
   * Enables "how many times has role X caused INSUFFICIENT_ROLE?" queries.
   */
  @Column({ name: 'actor_role', type: 'varchar', length: 50, nullable: true })
  actorRole!: string | null;

  /**
   * Root aggregate ID (PayrollBatch.id, LeaveRequest.id, etc.).
   * For static analysis violations, this is the file path of the offending file.
   */
  @Column({ name: 'aggregate_id', type: 'varchar', length: 255, nullable: true })
  aggregateId!: string | null;

  /** Aggregate type ('PayrollBatch', 'LeaveRequest', 'HandlerFile', etc.). */
  @Column({ name: 'aggregate_type', type: 'varchar', length: 100, nullable: true })
  aggregateType!: string | null;

  /** State the aggregate was in when the violation occurred. */
  @Column({ name: 'from_status', type: 'varchar', length: 50, nullable: true })
  fromStatus!: string | null;

  /** State that was illegally attempted or required a missing authorization. */
  @Column({ name: 'to_status', type: 'varchar', length: 50, nullable: true })
  toStatus!: string | null;

  /** HTTP request correlation ID — threads violation back to originating request. */
  @Column({ name: 'correlation_id', type: 'varchar', length: 36, nullable: true })
  correlationId!: string | null;

  /**
   * Human-readable violation message — shown in the governance dashboard.
   * For static analysis: the specific dependency rule that was violated.
   */
  @Column({ name: 'message', type: 'text' })
  message!: string;

  /**
   * Structured metadata for detailed inspection.
   * Contents vary by violation type:
   *   ILLEGAL_TRANSITION:         { transitionMap, requestedTransition }
   *   HANDLER_ENTITY_INJECTION:   { handlerClass, injectedRepo, filePath }
   *   FORBIDDEN_MODULE_IMPORT:    { sourceModule, forbiddenImport, filePath }
   */
  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  /** ISO timestamp when the violation occurred. Indexed for time-window queries. */
  @Column({ name: 'occurred_at', type: 'timestamp with time zone' })
  @Index()
  occurredAt!: Date;

  /**
   * Optional: when a false-positive was resolved. NOT a deletion — the original
   * record is preserved. Only the resolution annotation is added.
   */
  @Column({ name: 'resolved_at', type: 'timestamp with time zone', nullable: true })
  resolvedAt!: Date | null;

  /** Resolution note — why this was marked as a false-positive or accepted risk. */
  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote!: string | null;

  /** Who resolved this violation — for audit trail completeness. */
  @Column({ name: 'resolved_by', type: 'varchar', length: 36, nullable: true })
  resolvedBy!: string | null;

  /**
   * When a SUPPRESSED violation's suppression expires.
   * After this timestamp, the scanner treats the violation as ACTIVE again.
   * Null = no expiry (permanent suppression — should transition to ACCEPTED instead).
   */
  @Column({ name: 'suppressed_until', type: 'timestamp with time zone', nullable: true })
  suppressedUntil!: Date | null;

  /** Who suppressed this violation. */
  @Column({ name: 'suppressed_by', type: 'varchar', length: 36, nullable: true })
  suppressedBy!: string | null;

  // ── Deduplication Fields (static analysis violations only) ────────────────

  /**
   * SHA-256 fingerprint of (ruleId + filePath + lineNumber + pattern + ruleVersion).
   * Null for runtime violations (each is a unique unrepeatable event).
   * Non-null for static analysis violations (same architectural problem = same fingerprint).
   *
   * Dedup semantics (enforced at service layer via atomic UPSERT):
   *   - First detection:  INSERT with occurrenceCount=1, firstSeenAt=now
   *   - Re-detection:     UPDATE occurrenceCount++, lastSeenAt=now (no new row)
   *
   * Why service-layer and not DB unique constraint?
   *   PostgreSQL supports partial unique indexes (WHERE fingerprint IS NOT NULL)
   *   but TypeORM decorators cannot express them. The migration adds the partial index.
   *   See: 1747300000000-AddGovernanceViolationLog.ts
   *
   * Rule versioning:
   *   The ruleVersion component means changing rule detection semantics creates
   *   new fingerprints — old rows go "cold" rather than silently matching new violations.
   */
  @Index('IDX_violation_fingerprint')
  @Column({ name: 'fingerprint', type: 'varchar', length: 64, nullable: true })
  fingerprint!: string | null;

  /**
   * When this violation was first detected (the scanner's first run that found it).
   * For runtime violations: same as occurredAt.
   */
  @Column({ name: 'first_seen_at', type: 'timestamp with time zone', nullable: true })
  firstSeenAt!: Date | null;

  /**
   * When this violation was most recently detected.
   * Updated on every scanner run that still finds this violation.
   * Rising lastSeenAt = the violation is persistent, not intermittent.
   */
  @Column({ name: 'last_seen_at', type: 'timestamp with time zone', nullable: true })
  lastSeenAt!: Date | null;

  /**
   * How many consecutive scanner runs have detected this violation.
   * Used for trend analysis: count > N = chronic architectural debt.
   * Resets to 1 when a violation disappears and reappears.
   */
  @Column({ name: 'occurrence_count', type: 'int', default: 1 })
  occurrenceCount!: number;

  /**
   * Version of the rule's detection semantics when this fingerprint was computed.
   * Defaults to '1'. Bump this in the rule definition when detection semantics change.
   * Used as input to computeViolationFingerprint() to ensure stable deduplication.
   */
  @Column({ name: 'rule_version', type: 'varchar', length: 10, default: '1' })
  ruleVersion!: string;
}
