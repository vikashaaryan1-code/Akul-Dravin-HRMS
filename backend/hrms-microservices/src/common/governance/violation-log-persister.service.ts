import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull, Not, MoreThanOrEqual } from 'typeorm';
import {
  ViolationLogEntity,
  ViolationSeverity,
  ViolationStatus,
  ViolationType,
} from '../../database/entities/violation-log.entity';
import { ScanViolation } from './scanner/governance-scanner.service';

/**
 * VIOLATION LOG PERSISTER SERVICE
 *
 * Upserts static-analysis violations from the GovernanceScannerService
 * into the ViolationLogEntity (governance_violation_log) table.
 *
 * ── DEDUPLICATION SEMANTICS ─────────────────────────────────────────────────
 *
 * Static analysis violations are IDEMPOTENT across scanner runs:
 *   same rule + file + line + pattern = same fingerprint = same architectural problem.
 *
 *   First detection:  INSERT row with occurrenceCount = 1, firstSeenAt = now
 *   Re-detection:     UPDATE occurrenceCount++, lastSeenAt = now  (no new row)
 *   After fix:        No new violation → lastSeenAt stops updating (violation "gone cold")
 *
 * ── CONCURRENCY SAFETY ───────────────────────────────────────────────────────
 *
 * The upsert uses a SINGLE atomic SQL statement:
 *   INSERT ... ON CONFLICT (fingerprint) WHERE fingerprint IS NOT NULL
 *   DO UPDATE SET occurrence_count = occurrence_count + 1, last_seen_at = now()
 *
 * This is the only correct pattern. The previous findOne → save pattern had a
 * race condition window: two concurrent scanner runs could both see existing=null
 * and both attempt INSERT, causing one to fail on the partial unique index constraint.
 *
 * The TypeORM QueryBuilder .orUpdate() maps to ON CONFLICT DO UPDATE.
 * The occurrence_count increment uses a raw expression for atomicity.
 *
 * ── RUNTIME VIOLATIONS ───────────────────────────────────────────────────────
 *
 * Runtime violations (ILLEGAL_TRANSITION, OUTBOX_EXHAUSTED, etc.) have NO
 * fingerprint — each is a unique unrepeatable runtime event.
 * Those are inserted directly via persistRuntimeViolation().
 *
 * ── TENANT CONTEXT ───────────────────────────────────────────────────────────
 *
 * Static analysis violations are cross-tenant (they describe source code,
 * not tenant data). tenantId is set to the PLATFORM_TENANT_ID sentinel.
 */

/** Sentinel tenantId for platform-wide (cross-tenant) violations. */
export const PLATFORM_TENANT_ID = 'PLATFORM';

@Injectable()
export class ViolationLogPersisterService {
  private readonly logger = new Logger(ViolationLogPersisterService.name);

  constructor(
    @InjectRepository(ViolationLogEntity)
    private readonly repo: Repository<ViolationLogEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Persist a batch of static-analysis violations with fingerprint deduplication.
   *
   * Each violation is upserted via a SINGLE atomic INSERT ... ON CONFLICT DO UPDATE
   * statement. This is safe under concurrent scanner runs.
   *
   * Violations are processed in parallel (Promise.allSettled) because:
   *   - Each upsert is independently atomic at the DB level
   *   - Parallel execution is safe with atomic upserts (no race conditions)
   *   - CI scan batches are typically <100 violations; serial processing is unnecessary
   *
   * @param violations  Array of ScanViolation from GovernanceScannerService.scan()
   * @returns           Summary of inserts and updates performed
   */
  async persistScanViolations(violations: ScanViolation[]): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
  }> {
    if (violations.length === 0) {
      return { inserted: 0, updated: 0, skipped: 0 };
    }

    let inserted = 0;
    let updated  = 0;
    let skipped  = 0;

    const results = await Promise.allSettled(
      violations.map((v) => this.atomicUpsert(v)),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'inserted') inserted++;
        else updated++;
      } else {
        this.logger.error(
          `[ViolationLogPersister] Upsert failed: ${result.reason?.message ?? result.reason}`,
          result.reason?.stack,
        );
        skipped++;
      }
    }

    this.logger.log(
      `[ViolationLogPersister] Scan persisted: ${inserted} new, ${updated} updated, ${skipped} skipped`,
    );

    return { inserted, updated, skipped };
  }

  /**
   * Persist a single runtime violation (no fingerprint, always inserted as new row).
   *
   * Called by TransitionPolicyEngine, OutboxProcessor, etc.
   * Runtime violations have no deduplication — each is a unique runtime event.
   */
  async persistRuntimeViolation(params: {
    violationType:  ViolationType;
    severity:       ViolationSeverity;
    domain:         string;
    tenantId:       string;
    actorId?:       string | null;
    actorRole?:     string | null;
    aggregateId?:   string | null;
    aggregateType?: string | null;
    fromStatus?:    string | null;
    toStatus?:      string | null;
    correlationId?: string | null;
    message:        string;
    metadata?:      Record<string, unknown>;
  }): Promise<ViolationLogEntity> {
    const now = new Date();

    const entity = this.repo.create({
      violationType:   params.violationType,
      severity:        params.severity,
      domain:          params.domain,
      tenantId:        params.tenantId,
      actorId:         params.actorId ?? null,
      actorRole:       params.actorRole ?? null,
      aggregateId:     params.aggregateId ?? null,
      aggregateType:   params.aggregateType ?? null,
      fromStatus:      params.fromStatus ?? null,
      toStatus:        params.toStatus ?? null,
      correlationId:   params.correlationId ?? null,
      message:         params.message,
      metadata:        params.metadata ?? {},
      occurredAt:      now,
      // fingerprint / dedup fields are null for runtime violations
      fingerprint:     null,
      firstSeenAt:     null,
      lastSeenAt:      null,
      occurrenceCount: 1,
    });

    return this.repo.save(entity);
  }

  // ── Internal — Atomic Upsert ───────────────────────────────────────────────

  /**
   * Atomic upsert via INSERT ... ON CONFLICT DO UPDATE.
   *
   * Conflict target: the partial unique index `uidx_viol_fingerprint`
   *   (fingerprint) WHERE fingerprint IS NOT NULL
   *
   * On conflict (re-detection):
   *   - occurrence_count is incremented atomically in the DB
   *   - last_seen_at is updated to now()
   *   - severity and message may be updated if the rule was recategorized
   *
   * Returns 'inserted' if a new row was created, 'updated' if an existing row was bumped.
   */
  private async atomicUpsert(v: ScanViolation): Promise<'inserted' | 'updated'> {
    const now = new Date();

    const result = await this.dataSource.query<{ xmax: string }[]>(
      `
      INSERT INTO governance_violation_log (
        id, tenant_id, created_at, updated_at,
        violation_type, severity, domain,
        actor_id, actor_role,
        aggregate_id, aggregate_type,
        from_status, to_status, correlation_id,
        message, metadata, occurred_at,
        fingerprint, first_seen_at, last_seen_at, occurrence_count,
        status, rule_version
      ) VALUES (
        gen_random_uuid(), $1, now(), now(),
        $2, $3, $4,
        NULL, NULL,
        $5, 'HandlerFile',
        NULL, NULL, NULL,
        $6, $7::jsonb, now(),
        $8, now(), now(), 1,
        'ACTIVE', '1'
      )
      ON CONFLICT ON CONSTRAINT uidx_viol_fingerprint
      DO UPDATE SET
        occurrence_count = governance_violation_log.occurrence_count + 1,
        last_seen_at     = now(),
        updated_at       = now(),
        severity         = EXCLUDED.severity,
        message          = EXCLUDED.message,
        metadata         = EXCLUDED.metadata
      RETURNING xmax::text
      `,
      [
        PLATFORM_TENANT_ID,           // $1
        v.violationType,              // $2
        v.severity,                   // $3
        v.domain,                     // $4
        v.filePath,                   // $5  aggregate_id = file path
        v.message,                    // $6
        JSON.stringify(v.metadata),   // $7
        v.fingerprint,                // $8
      ],
    );

    // PostgreSQL: xmax = 0 means INSERT (no conflicting row existed)
    // xmax > 0 means UPDATE (existing row was updated)
    const wasInsert = result[0]?.xmax === '0';
    return wasInsert ? 'inserted' : 'updated';
  }

  // ── Query Helpers (used by GovernanceDashboardController) ─────────────────

  /**
   * Count violations by type within a time window.
   */
  async countByType(params: {
    violationType: ViolationType;
    since:         Date;
    tenantId?:     string | null;
  }): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('v')
      .where('v.violation_type = :type', { type: params.violationType })
      .andWhere('v.occurred_at >= :since', { since: params.since });

    if (params.tenantId) {
      qb.andWhere('v.tenant_id = :tenantId', { tenantId: params.tenantId });
    }

    return qb.getCount();
  }

  /**
   * Get top violating domains within a time window.
   */
  async getTopDomains(params: {
    since:     Date;
    limit?:    number;
    tenantId?: string | null;
  }): Promise<Array<{ domain: string; count: number }>> {
    const qb = this.repo
      .createQueryBuilder('v')
      .select('v.domain', 'domain')
      .addSelect('COUNT(*)', 'count')
      .where('v.occurred_at >= :since', { since: params.since })
      .groupBy('v.domain')
      .orderBy('"count"', 'DESC')
      .limit(params.limit ?? 5);

    if (params.tenantId) {
      qb.andWhere('v.tenant_id = :tenantId', { tenantId: params.tenantId });
    }

    const rows = await qb.getRawMany<{ domain: string; count: string }>();
    return rows.map((r) => ({ domain: r.domain, count: parseInt(r.count, 10) }));
  }

  /**
   * Get recent static-analysis violations for the dashboard.
   * Applies the since time window correctly.
   */
  async getRecentStaticViolations(params: {
    since:  Date;
    limit?: number;
  }): Promise<ViolationLogEntity[]> {
    return this.repo.find({
      where: {
        domain:      'static-analysis',
        fingerprint: Not(IsNull()),
        occurredAt:  MoreThanOrEqual(params.since),  // Fix: was ignored before
      },
      order: { lastSeenAt: 'DESC' },
      take:  params.limit ?? 50,
    });
  }

  /**
   * Get all unresolved chronic violations (occurrenceCount >= threshold).
   * Filters to ACTIVE status only — SUPPRESSED and ACCEPTED violations
   * are intentional decisions and should not pollute the chronic debt report.
   */
  async getChronicViolations(threshold = 3): Promise<ViolationLogEntity[]> {
    return this.repo
      .createQueryBuilder('v')
      .where('v.occurrence_count >= :threshold', { threshold })
      .andWhere('v.resolved_at IS NULL')
      .andWhere('v.fingerprint IS NOT NULL')
      .andWhere('v.status = :status', { status: ViolationStatus.ACTIVE })
      .orderBy('v.occurrence_count', 'DESC')
      .take(100)
      .getMany();
  }

  /**
   * Get all fingerprints currently in the violation log.
   * Used by the baseline loader to compare against the baseline file.
   */
  async getAllActiveFingerprints(): Promise<Set<string>> {
    const rows = await this.repo
      .createQueryBuilder('v')
      .select('v.fingerprint', 'fingerprint')
      .where('v.fingerprint IS NOT NULL')
      .andWhere('v.resolved_at IS NULL')
      .getRawMany<{ fingerprint: string }>();

    return new Set(rows.map((r) => r.fingerprint));
  }
}
