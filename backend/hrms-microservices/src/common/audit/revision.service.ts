import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChangeReason } from '../queues/queue-job.types';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RevisionSnapshotOptions<T> {
  tenantId: string;
  entityType: string;
  entityId: string;
  before: T | null;
  after: T;
  changeReason?: ChangeReason;
  actorId?: string;
  actorRole?: string;
  actorEmail?: string;
  correlationId?: string;
  causationId?: string;
}

export interface RevisionEntry {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  revision: number;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown>;
  jsonPatch: JsonPatchOp[] | null;
  changedFields: string[];
  changeReason: ChangeReason | null;
  actorId: string | null;
  actorRole: string | null;
  actorEmail: string | null;
  correlationId: string | null;
  occurredAt: string;
}

export interface JsonPatchOp {
  op: 'add' | 'remove' | 'replace';
  path: string;
  value?: unknown;
  oldValue?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// REVISION SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * REVISION SERVICE — Track C
 *
 * Generic immutable revision engine for any entity type.
 *
 * PRD Enterprise Compliance:
 *  - Append-only: revisions are never updated or deleted.
 *  - Before/after snapshots for every mutation.
 *  - JSON Patch diff (RFC 6902) for efficient display + storage.
 *  - Structured change reason codes for enterprise audit intent provenance.
 *  - Temporal reconstruction: rebuild entity state at any point in time.
 *
 * Usage:
 *  // In a service that mutates an entity:
 *  const before = await this.employeeRepo.findOne(id);
 *  await this.employeeRepo.save(updated);
 *  await this.revisionService.snapshot({
 *    tenantId, entityType: 'Employee', entityId: id,
 *    before, after: updated,
 *    changeReason: 'PROMOTION', actorId, correlationId,
 *  });
 */
@Injectable()
export class RevisionService {
  private readonly logger = new Logger(RevisionService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Snapshot ──────────────────────────────────────────────────────────────

  /**
   * Records a revision snapshot for an entity mutation.
   * Computes JSON Patch diff and changed field list automatically.
   * Assigns next monotonic revision number atomically.
   */
  async snapshot<T extends Record<string, unknown>>(
    options: RevisionSnapshotOptions<T>,
  ): Promise<void> {
    const {
      tenantId, entityType, entityId,
      before, after,
      changeReason, actorId, actorRole, actorEmail,
      correlationId, causationId,
    } = options;

    const jsonPatch    = this.computeJsonPatch(before, after);
    const changedFields = this.computeChangedFields(before, after);

    try {
      await this.ds.query(
        `INSERT INTO entity_revision_log
           (tenant_id, entity_type, entity_id, revision,
            before_state, after_state, json_patch, changed_fields,
            change_reason, actor_id, actor_role, actor_email,
            correlation_id, causation_id, occurred_at)
         VALUES (
           $1, $2, $3,
           -- Atomic monotonic revision number
           COALESCE(
             (SELECT MAX(revision) + 1 FROM entity_revision_log
              WHERE tenant_id=$1 AND entity_type=$2 AND entity_id=$3),
             1
           ),
           $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
         )`,
        [
          tenantId, entityType, entityId,
          before ? JSON.stringify(before) : null,
          JSON.stringify(after),
          JSON.stringify(jsonPatch),
          changedFields,
          changeReason ?? null,
          actorId ?? null,
          actorRole ?? null,
          actorEmail ?? null,
          correlationId ?? null,
          causationId ?? null,
        ],
      );
      this.logger.debug(
        `REVISION_SNAPSHOT: ${entityType}/${entityId} fields=[${changedFields.join(',')}] reason=${changeReason ?? '-'}`,
      );
    } catch (err) {
      // Revision write failure must never abort the primary mutation
      this.logger.error(`REVISION_SNAPSHOT_FAILED: ${entityType}/${entityId} — ${String(err)}`);
    }
  }

  // ── History ───────────────────────────────────────────────────────────────

  async getHistory(
    tenantId: string,
    entityType: string,
    entityId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ data: RevisionEntry[]; total: number }> {
    const limit  = options.limit  ?? 50;
    const offset = options.offset ?? 0;

    const [rows, [{ count }]] = await Promise.all([
      this.ds.query<RevisionEntry[]>(
        `SELECT * FROM entity_revision_log
         WHERE tenant_id=$1 AND entity_type=$2 AND entity_id=$3
         ORDER BY revision DESC
         LIMIT $4 OFFSET $5`,
        [tenantId, entityType, entityId, limit, offset],
      ),
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM entity_revision_log
         WHERE tenant_id=$1 AND entity_type=$2 AND entity_id=$3`,
        [tenantId, entityType, entityId],
      ),
    ]);

    return { data: rows, total: parseInt(count, 10) };
  }

  async getRevision(revisionId: string, tenantId: string): Promise<RevisionEntry> {
    const [row] = await this.ds.query<RevisionEntry[]>(
      `SELECT * FROM entity_revision_log WHERE id=$1 AND tenant_id=$2`,
      [revisionId, tenantId],
    );
    if (!row) throw new NotFoundException(`Revision ${revisionId} not found.`);
    return row;
  }

  // ── Temporal Reconstruction ───────────────────────────────────────────────

  /**
   * Reconstructs the entity's state at a given point in time by
   * finding the most recent revision snapshot at or before `asOfDate`.
   */
  async reconstruct(
    tenantId: string,
    entityType: string,
    entityId: string,
    asOfDate: Date,
  ): Promise<Record<string, unknown> | null> {
    const [row] = await this.ds.query<Array<{ after_state: Record<string, unknown> }>>(
      `SELECT after_state FROM entity_revision_log
       WHERE tenant_id=$1 AND entity_type=$2 AND entity_id=$3
         AND occurred_at <= $4
       ORDER BY revision DESC
       LIMIT 1`,
      [tenantId, entityType, entityId, asOfDate.toISOString()],
    );
    return row?.after_state ?? null;
  }

  // ── Actor Audit ───────────────────────────────────────────────────────────

  async getActorChanges(
    tenantId: string,
    actorId: string,
    options: { entityType?: string; changeReason?: ChangeReason; limit?: number } = {},
  ): Promise<RevisionEntry[]> {
    const args: unknown[] = [tenantId, actorId];
    const clauses: string[] = [];

    if (options.entityType) { args.push(options.entityType); clauses.push(`AND entity_type = $${args.length}`); }
    if (options.changeReason) { args.push(options.changeReason); clauses.push(`AND change_reason = $${args.length}`); }

    args.push(options.limit ?? 100);

    return this.ds.query(
      `SELECT * FROM entity_revision_log
       WHERE tenant_id=$1 AND actor_id=$2 ${clauses.join(' ')}
       ORDER BY occurred_at DESC
       LIMIT $${args.length}`,
      args,
    );
  }

  // ── JSON Patch Computation (RFC 6902 subset) ──────────────────────────────

  private computeJsonPatch(
    before: Record<string, unknown> | null,
    after: Record<string, unknown>,
  ): JsonPatchOp[] {
    if (!before) {
      // New entity — single "add" for each top-level field
      return Object.keys(after).map(k => ({
        op: 'add',
        path: `/${k}`,
        value: after[k],
      }));
    }

    const ops: JsonPatchOp[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const bv = before[key];
      const av = after[key];

      if (!(key in after)) {
        ops.push({ op: 'remove', path: `/${key}`, oldValue: bv });
      } else if (!(key in before)) {
        ops.push({ op: 'add', path: `/${key}`, value: av });
      } else if (JSON.stringify(bv) !== JSON.stringify(av)) {
        ops.push({ op: 'replace', path: `/${key}`, value: av, oldValue: bv });
      }
    }

    return ops;
  }

  private computeChangedFields(
    before: Record<string, unknown> | null,
    after: Record<string, unknown>,
  ): string[] {
    if (!before) return Object.keys(after);
    return Object.keys(after).filter(k =>
      JSON.stringify(before[k]) !== JSON.stringify(after[k]),
    );
  }
}
