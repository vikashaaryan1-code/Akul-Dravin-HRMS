import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Revision Engine + Dead Letter Queue Tables
 *
 * Track C — Immutable Revision Engine
 * Track A — Dead Letter Queue persistence
 *
 * entity_revision_log:
 *  Generic append-only revision log for any entity type.
 *  Stores before/after state, JSON patch diff, changed field list,
 *  structured change reason code, actor, and correlation ID.
 *
 * queue_dead_letters:
 *  Persistent DLQ for all BullMQ queues.
 *  ON CONFLICT upsert allows retry storm deduplication.
 */
export class AddRevisionEngine1747390000000 implements MigrationInterface {
  name = 'AddRevisionEngine1747390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── entity_revision_log ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS entity_revision_log (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID        NOT NULL,
        entity_type     VARCHAR(100) NOT NULL,
        entity_id       VARCHAR(100) NOT NULL,

        -- Monotonic revision counter per aggregate stream
        revision        INTEGER     NOT NULL DEFAULT 1,

        -- Full snapshots (always stored for temporal reconstruction)
        before_state    JSONB,
        after_state     JSONB       NOT NULL,

        -- JSON Patch (RFC 6902) diff for efficient storage + display
        -- Example: [{"op":"replace","path":"/salary","value":120000}]
        json_patch      JSONB,

        -- Computed list of changed top-level field names (for display + filtering)
        changed_fields  TEXT[]      NOT NULL DEFAULT '{}',

        -- Structured intent (WHY the change was made — enterprise audit teams care)
        change_reason   VARCHAR(100),

        -- Who made the change
        actor_id        UUID,
        actor_role      VARCHAR(50),
        actor_email     VARCHAR(255),

        -- Distributed tracing
        correlation_id  VARCHAR(100),
        causation_id    VARCHAR(100),

        -- Immutable timestamps
        occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Prevent revision counter gaps — enforce monotonic ordering
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_revision_log_aggregate_revision
        ON entity_revision_log (tenant_id, entity_type, entity_id, revision)
    `);

    // Primary query: "show me all changes to employee X"
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_revision_log_entity
        ON entity_revision_log (tenant_id, entity_type, entity_id, occurred_at DESC)
    `);

    // Actor audit: "what did actor Y change?"
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_revision_log_actor
        ON entity_revision_log (tenant_id, actor_id, occurred_at DESC)
        WHERE actor_id IS NOT NULL
    `);

    // Correlation: "all changes in request X"
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_revision_log_correlation
        ON entity_revision_log (correlation_id)
        WHERE correlation_id IS NOT NULL
    `);

    // Change reason filtering: "all PROMOTION changes this quarter"
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_revision_log_reason
        ON entity_revision_log (tenant_id, change_reason, occurred_at DESC)
        WHERE change_reason IS NOT NULL
    `);

    // ── queue_dead_letters ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS queue_dead_letters (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        queue_name      VARCHAR(100) NOT NULL,
        job_name        VARCHAR(100) NOT NULL,
        tenant_id       UUID,
        idempotency_key VARCHAR(500) NOT NULL,
        payload         JSONB       NOT NULL,
        error_message   TEXT        NOT NULL,
        stack_trace     TEXT,
        attempts        INTEGER     NOT NULL DEFAULT 1,
        first_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_failed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        replayed_at     TIMESTAMPTZ,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT uq_qdl_idempotency_key UNIQUE (idempotency_key)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_qdl_queue_tenant
        ON queue_dead_letters (queue_name, tenant_id, last_failed_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_qdl_unresolved
        ON queue_dead_letters (last_failed_at DESC)
        WHERE replayed_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS queue_dead_letters`);
    await queryRunner.query(`DROP TABLE IF EXISTS entity_revision_log`);
  }
}
