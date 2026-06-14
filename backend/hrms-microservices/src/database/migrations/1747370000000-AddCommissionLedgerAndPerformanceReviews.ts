import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Commission Ledger + Performance Review Cycles
 *
 * Adds:
 *  1. commission_ledger — explicit ledger with hold/release/dispute state machine
 *  2. performance_review_cycles — 360° review cycle management
 *  3. performance_goals — OKR/KPI goal tracking
 *  4. performance_feedback — 360° peer/manager/self feedback
 *
 * All tables are tenant-scoped with soft-delete (deleted_at).
 */
export class AddCommissionLedgerAndPerformanceReviews1747370000000 implements MigrationInterface {
  name = 'AddCommissionLedgerAndPerformanceReviews1747370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Commission Ledger ─────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS commission_ledger (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id         UUID        NOT NULL,
        recruiter_id      UUID        NOT NULL,
        period            VARCHAR(7)  NOT NULL,        -- YYYY-MM
        gross_revenue     NUMERIC(16,2) NOT NULL DEFAULT 0,
        commission_rate   NUMERIC(5,2)  NOT NULL,
        commission_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
        bonus_amount      NUMERIC(16,2) NOT NULL DEFAULT 0,
        total_payable     NUMERIC(16,2) NOT NULL DEFAULT 0,
        tier              VARCHAR(20)   NOT NULL,      -- BRONZE/SILVER/GOLD/PLATINUM
        status            VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','APPROVED','PAID','HELD','DISPUTED')),
        approved_by_id    UUID,
        paid_by_id        UUID,
        paid_at           TIMESTAMP WITH TIME ZONE,
        notes             TEXT,
        breakdown         JSONB        NOT NULL DEFAULT '[]',
        created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at        TIMESTAMP WITH TIME ZONE,
        UNIQUE (tenant_id, recruiter_id, period)   -- prevent double-commit per period
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_commission_ledger_tenant_recruiter
        ON commission_ledger (tenant_id, recruiter_id, period DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_commission_ledger_status
        ON commission_ledger (tenant_id, status, paid_at)
        WHERE status != 'PAID'
    `);

    // ── Performance Review Cycles ─────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS performance_review_cycles (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id      UUID        NOT NULL,
        name           VARCHAR(200) NOT NULL,
        cycle_type     VARCHAR(30)  NOT NULL
                         CHECK (cycle_type IN ('quarterly','half_yearly','annual','custom')),
        review_type    VARCHAR(30)  NOT NULL
                         CHECK (review_type IN ('360','self','manager','peer','okr','kpi')),
        period_start   DATE         NOT NULL,
        period_end     DATE         NOT NULL,
        status         VARCHAR(20)  NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','active','review_in_progress','completed','archived')),
        eligible_roles JSONB        NOT NULL DEFAULT '[]',
        settings       JSONB        NOT NULL DEFAULT '{}',   -- weights, scale, grace period
        created_by_id  UUID,
        created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at     TIMESTAMP WITH TIME ZONE,
        CHECK (period_end > period_start)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_prc_tenant_status
        ON performance_review_cycles (tenant_id, status, period_end DESC)
    `);

    // ── Performance Goals (OKR/KPI) ───────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS performance_goals (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id        UUID        NOT NULL,
        cycle_id         UUID        REFERENCES performance_review_cycles (id) ON DELETE SET NULL,
        employee_id      UUID        NOT NULL,
        title            VARCHAR(300) NOT NULL,
        description      TEXT,
        goal_type        VARCHAR(20)  NOT NULL DEFAULT 'kpi'
                           CHECK (goal_type IN ('okr','kpi','development','stretch')),
        target_value     NUMERIC(14,2),
        current_value    NUMERIC(14,2) NOT NULL DEFAULT 0,
        unit             VARCHAR(50),           -- e.g. %, INR, count
        weight           NUMERIC(5,2) NOT NULL DEFAULT 1.0,  -- relative importance
        due_date         DATE,
        status           VARCHAR(20)  NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','completed','cancelled','overdue')),
        completion_pct   NUMERIC(5,2) GENERATED ALWAYS AS (
                           CASE WHEN target_value IS NULL OR target_value = 0 THEN 0
                                ELSE LEAST(current_value / target_value * 100, 100)
                           END
                         ) STORED,
        created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_perf_goals_employee_cycle
        ON performance_goals (tenant_id, employee_id, cycle_id)
    `);

    // ── Performance Feedback (360°) ───────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS performance_feedback (
        id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID        NOT NULL,
        cycle_id        UUID        REFERENCES performance_review_cycles (id) ON DELETE CASCADE,
        reviewee_id     UUID        NOT NULL,   -- employee being reviewed
        reviewer_id     UUID        NOT NULL,   -- person giving feedback
        reviewer_type   VARCHAR(20) NOT NULL
                          CHECK (reviewer_type IN ('self','manager','peer','skip_level','subordinate')),
        ratings         JSONB       NOT NULL DEFAULT '{}',    -- { "execution": 4, "collaboration": 3, ... }
        comments        TEXT,
        overall_rating  NUMERIC(3,1),
        is_submitted    BOOLEAN     NOT NULL DEFAULT FALSE,
        submitted_at    TIMESTAMP WITH TIME ZONE,
        created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE (cycle_id, reviewee_id, reviewer_id)  -- one feedback per pair per cycle
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_perf_feedback_reviewee_cycle
        ON performance_feedback (tenant_id, reviewee_id, cycle_id);
      CREATE INDEX IF NOT EXISTS idx_perf_feedback_reviewer_cycle
        ON performance_feedback (tenant_id, reviewer_id, is_submitted)
        WHERE is_submitted = FALSE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS performance_feedback`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance_goals`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance_review_cycles`);
    await queryRunner.query(`DROP TABLE IF EXISTS commission_ledger`);
  }
}
