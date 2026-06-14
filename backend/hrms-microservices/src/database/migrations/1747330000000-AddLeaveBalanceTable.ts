import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Leave Balance Table + Enhanced Leave Requests
 *
 * Adds:
 *   1. leave_balances     — per-employee, per-type, per-year balance ledger
 *   2. Enhances leave_requests with:
 *        - approval_chain (JSONB) — multi-level approval audit trail
 *        - approval_level (int)   — current pending approval level (1=Manager,2=HR,3=DeptHead)
 *        - approved_days (numeric) — actual approved days (may differ from total_days for partials)
 *        - cancelled_at, cancellation_reason
 *
 * PRD §5.5: Multi-level approval: Manager → HR → Department Head
 */
export class AddLeaveBalanceTable1747330000000 implements MigrationInterface {
  name = 'AddLeaveBalanceTable1747330000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. leave_balances ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id         UUID        NOT NULL,
        employee_id       UUID        NOT NULL,
        leave_type_id     UUID        NOT NULL,
        year              SMALLINT    NOT NULL,
        opening_balance   NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        credited          NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        utilized          NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        carry_forward_days NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        encashed_days     NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        closing_balance   NUMERIC(8,2) NOT NULL DEFAULT 0.00,
        last_computed_at  TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_lb_employee_type_year
        ON leave_balances (tenant_id, employee_id, leave_type_id, year);

      CREATE INDEX IF NOT EXISTS idx_lb_employee_id
        ON leave_balances (employee_id);

      CREATE INDEX IF NOT EXISTS idx_lb_leave_type_year
        ON leave_balances (leave_type_id, year);
    `);

    // ── 2. Enhance leave_requests ──────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE leave_requests
        ADD COLUMN IF NOT EXISTS approval_chain     JSONB       NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS approval_level     SMALLINT    NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS approved_days      NUMERIC(6,2),
        ADD COLUMN IF NOT EXISTS cancelled_at       TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
        ADD COLUMN IF NOT EXISTS half_day           BOOLEAN     NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS half_day_session   VARCHAR(10)
    `);

    // ── 3. Enhance leave_types with approval config ────────────────────────
    await queryRunner.query(`
      ALTER TABLE leave_types
        ADD COLUMN IF NOT EXISTS approval_levels    SMALLINT    NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS allow_half_day     BOOLEAN     NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS max_carry_forward  NUMERIC(6,2) NOT NULL DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS encash_rate_pct    NUMERIC(5,2) NOT NULL DEFAULT 100.00,
        ADD COLUMN IF NOT EXISTS min_days_for_apply NUMERIC(4,2) NOT NULL DEFAULT 0.50,
        ADD COLUMN IF NOT EXISTS gender_specific    VARCHAR(10)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS leave_balances CASCADE`);

    await queryRunner.query(`
      ALTER TABLE leave_requests
        DROP COLUMN IF EXISTS approval_chain,
        DROP COLUMN IF EXISTS approval_level,
        DROP COLUMN IF EXISTS approved_days,
        DROP COLUMN IF EXISTS cancelled_at,
        DROP COLUMN IF EXISTS cancellation_reason,
        DROP COLUMN IF EXISTS half_day,
        DROP COLUMN IF EXISTS half_day_session
    `);

    await queryRunner.query(`
      ALTER TABLE leave_types
        DROP COLUMN IF EXISTS approval_levels,
        DROP COLUMN IF EXISTS allow_half_day,
        DROP COLUMN IF EXISTS max_carry_forward,
        DROP COLUMN IF EXISTS encash_rate_pct,
        DROP COLUMN IF EXISTS min_days_for_apply,
        DROP COLUMN IF EXISTS gender_specific
    `);
  }
}
