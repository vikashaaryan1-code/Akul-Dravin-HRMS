import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Projection State Versioning — Track H
 *
 * analytics_projection_versions:
 *  Tracks the health and version of each analytics domain's materialized
 *  projection state. Enables safe rebuilds, projection migrations, and
 *  lag monitoring without destructive recomputation.
 *
 * projection_event_log:
 *  Append-only log of every projection state transition.
 *  Enables temporal debugging: "why is workforce KPI stale at 14:32?"
 */
export class AddProjectionVersioning1747400000000 implements MigrationInterface {
  name = 'AddProjectionVersioning1747400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── analytics_projection_versions ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS analytics_projection_versions (
        id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id           UUID          NOT NULL,

        -- Identifies which analytics read model this tracks
        -- Values: 'workforce' | 'recruitment' | 'revenue' | 'custom:<name>'
        domain              VARCHAR(100)  NOT NULL,

        -- Monotonically increasing schema version.
        -- Increment when projection schema changes — triggers safe rebuild.
        projection_version  INTEGER       NOT NULL DEFAULT 1,

        -- Operational state
        is_stale            BOOLEAN       NOT NULL DEFAULT FALSE,
        stale_reason        VARCHAR(500),

        -- Timestamps
        last_invalidated_at TIMESTAMPTZ,
        last_rebuilt_at     TIMESTAMPTZ,
        created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

        CONSTRAINT uq_proj_version_tenant_domain UNIQUE (tenant_id, domain)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_proj_version_tenant
        ON analytics_projection_versions (tenant_id, domain)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_proj_version_stale
        ON analytics_projection_versions (is_stale, last_invalidated_at DESC)
        WHERE is_stale = TRUE
    `);

    // ── projection_event_log ─────────────────────────────────────────────────
    // Append-only temporal log of projection state transitions.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projection_event_log (
        id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID          NOT NULL,
        domain          VARCHAR(100)  NOT NULL,

        -- 'stale_marked' | 'rebuild_started' | 'rebuild_completed' | 'schema_migrated'
        event_type      VARCHAR(50)   NOT NULL,

        -- Causation: what triggered this event
        causation_event VARCHAR(200),
        correlation_id  VARCHAR(100),

        -- Lag at the time of event (seconds since last_rebuilt_at)
        lag_seconds     INTEGER,

        occurred_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_proj_event_log_lookup
        ON projection_event_log (tenant_id, domain, occurred_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS projection_event_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS analytics_projection_versions`);
  }
}
