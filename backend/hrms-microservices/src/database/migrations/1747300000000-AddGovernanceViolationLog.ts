import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Create governance_violation_log table (Fifth Truth Plane)
 *
 * This table records every governance violation detected by the platform
 * — both runtime violations (ILLEGAL_TRANSITION, INSUFFICIENT_ROLE, etc.)
 * and static-analysis violations (HANDLER_ENTITY_INJECTION, etc.).
 *
 * Design decisions:
 *
 * 1. Inherits from TenantScopedEntity (id UUID, tenant_id, created_at, updated_at).
 *    Static analysis violations use tenant_id = 'PLATFORM' (cross-tenant sentinel).
 *
 * 2. Partial unique index on fingerprint WHERE fingerprint IS NOT NULL:
 *    - Enforces DB-level deduplication for static analysis violations.
 *    - NULL fingerprints (runtime violations) are excluded — each is unique.
 *    - Cannot be expressed via TypeORM decorators; must be a raw SQL index.
 *
 * 3. All columns are named with snake_case to match PostgreSQL conventions.
 *
 * 4. severity uses PostgreSQL enum type (violation_severity_enum) for efficient
 *    index scans and constraint enforcement.
 *
 * 5. Immutability: NO UPDATE triggers enforced at the application layer.
 *    The only mutable fields are resolved_at, resolution_note, resolved_by,
 *    last_seen_at, and occurrence_count (dedup tracking).
 */
export class AddGovernanceViolationLog1747300000000 implements MigrationInterface {
  name = 'AddGovernanceViolationLog1747300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for violation severity (if not already present)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'violation_severity_enum') THEN
          CREATE TYPE violation_severity_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
        END IF;
      END $$;
    `);

    // Create the governance_violation_log table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS governance_violation_log (
        id               UUID        NOT NULL DEFAULT gen_random_uuid(),
        tenant_id        VARCHAR(36) NOT NULL DEFAULT 'PLATFORM',
        created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        -- Classification
        violation_type   VARCHAR(60) NOT NULL,
        severity         violation_severity_enum NOT NULL DEFAULT 'HIGH',
        domain           VARCHAR(50) NOT NULL,

        -- Actor context
        actor_id         VARCHAR(36),
        actor_role       VARCHAR(50),

        -- Aggregate context
        aggregate_id     VARCHAR(255),
        aggregate_type   VARCHAR(100),

        -- Transition context (runtime violations)
        from_status      VARCHAR(50),
        to_status        VARCHAR(50),

        -- Request context
        correlation_id   VARCHAR(36),

        -- Violation detail
        message          TEXT        NOT NULL,
        metadata         JSONB       NOT NULL DEFAULT '{}',

        -- Timestamp
        occurred_at      TIMESTAMP WITH TIME ZONE NOT NULL,

        -- Soft resolution
        resolved_at      TIMESTAMP WITH TIME ZONE,
        resolution_note  TEXT,
        resolved_by      VARCHAR(36),

        -- Deduplication (static analysis violations only)
        fingerprint      VARCHAR(64),
        first_seen_at    TIMESTAMP WITH TIME ZONE,
        last_seen_at     TIMESTAMP WITH TIME ZONE,
        occurrence_count INTEGER     NOT NULL DEFAULT 1,

        CONSTRAINT pk_governance_violation_log PRIMARY KEY (id)
      );
    `);

    // ── Indexes ──────────────────────────────────────────────────────────────

    // Trend queries: violations by tenant + type in time windows
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_tenant_type_time
        ON governance_violation_log (tenant_id, violation_type, occurred_at);
    `);

    // Abuse detection: repeated violations by same actor
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_actor_tenant_time
        ON governance_violation_log (actor_id, tenant_id, occurred_at)
        WHERE actor_id IS NOT NULL;
    `);

    // Per-aggregate forensics (e.g., all violations on a PayrollBatch)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_aggregate_type
        ON governance_violation_log (aggregate_id, violation_type)
        WHERE aggregate_id IS NOT NULL;
    `);

    // Time-window queries (post-mortems, SLA dashboards)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_occurred_at
        ON governance_violation_log (occurred_at);
    `);

    // Violation type fast filter (dashboard: "show me all ILLEGAL_TRANSITION")
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_type
        ON governance_violation_log (violation_type);
    `);

    // Severity filter (dashboard: "show me all CRITICAL violations")
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_severity
        ON governance_violation_log (severity, occurred_at);
    `);

    // PARTIAL UNIQUE INDEX for fingerprint deduplication —
    // NULL fingerprints (runtime violations) are excluded: each runtime event is unique.
    // Non-null fingerprints must be unique: same static analysis problem = same row.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uidx_viol_fingerprint
        ON governance_violation_log (fingerprint)
        WHERE fingerprint IS NOT NULL;
    `);

    // Chronic violation detection (high occurrence_count = lingering debt)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_occurrence_count
        ON governance_violation_log (occurrence_count DESC, resolved_at)
        WHERE fingerprint IS NOT NULL;
    `);

    // Domain aggregate (dashboard: violations per domain)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_domain_time
        ON governance_violation_log (domain, occurred_at);
    `);

    // ── Updated_at trigger ───────────────────────────────────────────────────
    // Keep updated_at current for soft-resolution updates (resolved_at / resolution_note)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_governance_violation_log_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_viol_log_updated_at ON governance_violation_log;
      CREATE TRIGGER trg_viol_log_updated_at
        BEFORE UPDATE ON governance_violation_log
        FOR EACH ROW EXECUTE FUNCTION update_governance_violation_log_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_viol_log_updated_at ON governance_violation_log;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_governance_violation_log_updated_at();`);
    await queryRunner.query(`DROP TABLE IF EXISTS governance_violation_log;`);
    await queryRunner.query(`DROP TYPE IF EXISTS violation_severity_enum;`);
  }
}
