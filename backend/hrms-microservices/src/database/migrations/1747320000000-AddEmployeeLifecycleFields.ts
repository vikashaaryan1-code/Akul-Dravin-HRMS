import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Add Employee Lifecycle Fields
 *
 * Extends the employees table from a flat "status" column into a full
 * lifecycle state machine with temporal audit columns:
 *
 *   ONBOARDING → PROBATION → CONFIRMED → (PROMOTED | TRANSFERRED)* → EXIT
 *
 * The `lifecycle_stage` enum mirrors the EmployeeLifecycleStage enum
 * used by EmployeeLifecycleService.  The existing `status` varchar is
 * retained as a backward-compatible active/inactive flag.
 *
 * Additional columns capture the date boundaries for each stage so that
 * the document engine can auto-generate letters with accurate effective dates.
 */
export class AddEmployeeLifecycleFields1747320000000 implements MigrationInterface {
  name = 'AddEmployeeLifecycleFields1747320000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Lifecycle stage enum ─────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE employee_lifecycle_stage AS ENUM (
          'ONBOARDING',
          'PROBATION',
          'CONFIRMED',
          'PROMOTED',
          'TRANSFERRED',
          'NOTICE_PERIOD',
          'RESIGNED',
          'TERMINATED',
          'ABSCONDED',
          'SUSPENDED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ── 2. Core lifecycle columns ───────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS lifecycle_stage employee_lifecycle_stage
          NOT NULL DEFAULT 'PROBATION',

        ADD COLUMN IF NOT EXISTS probation_end_date        DATE,
        ADD COLUMN IF NOT EXISTS confirmation_date         DATE,

        ADD COLUMN IF NOT EXISTS last_promotion_date       DATE,
        ADD COLUMN IF NOT EXISTS last_promoted_designation VARCHAR(120),
        ADD COLUMN IF NOT EXISTS pre_promotion_designation VARCHAR(120),
        ADD COLUMN IF NOT EXISTS pre_promotion_ctc         NUMERIC(14,2),

        ADD COLUMN IF NOT EXISTS last_transfer_date        DATE,
        ADD COLUMN IF NOT EXISTS pre_transfer_branch_id    UUID,
        ADD COLUMN IF NOT EXISTS pre_transfer_department_id UUID,
        ADD COLUMN IF NOT EXISTS pre_transfer_manager_id   UUID,

        ADD COLUMN IF NOT EXISTS notice_start_date         DATE,
        ADD COLUMN IF NOT EXISTS notice_period_days        INTEGER,
        ADD COLUMN IF NOT EXISTS last_working_day          DATE,
        ADD COLUMN IF NOT EXISTS exit_reason               TEXT,
        ADD COLUMN IF NOT EXISTS exit_type                 VARCHAR(30),

        ADD COLUMN IF NOT EXISTS lifecycle_metadata        JSONB NOT NULL DEFAULT '{}'
    `);

    // ── 3. Back-fill: set lifecycle_stage from existing status ──────────────
    await queryRunner.query(`
      UPDATE employees
      SET lifecycle_stage =
        CASE
          WHEN status = 'resigned'   THEN 'RESIGNED'::employee_lifecycle_stage
          WHEN status = 'terminated' THEN 'TERMINATED'::employee_lifecycle_stage
          WHEN status = 'inactive'   THEN 'CONFIRMED'::employee_lifecycle_stage
          ELSE                            'CONFIRMED'::employee_lifecycle_stage
        END
      WHERE lifecycle_stage = 'PROBATION'
    `);

    // ── 4. Indexes ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_emp_lifecycle_stage
        ON employees (lifecycle_stage);

      CREATE INDEX IF NOT EXISTS idx_emp_probation_end
        ON employees (probation_end_date)
        WHERE probation_end_date IS NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_emp_last_working_day
        ON employees (last_working_day)
        WHERE last_working_day IS NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_emp_lifecycle_stage;
      DROP INDEX IF EXISTS idx_emp_probation_end;
      DROP INDEX IF EXISTS idx_emp_last_working_day;
    `);

    await queryRunner.query(`
      ALTER TABLE employees
        DROP COLUMN IF EXISTS lifecycle_stage,
        DROP COLUMN IF EXISTS probation_end_date,
        DROP COLUMN IF EXISTS confirmation_date,
        DROP COLUMN IF EXISTS last_promotion_date,
        DROP COLUMN IF EXISTS last_promoted_designation,
        DROP COLUMN IF EXISTS pre_promotion_designation,
        DROP COLUMN IF EXISTS pre_promotion_ctc,
        DROP COLUMN IF EXISTS last_transfer_date,
        DROP COLUMN IF EXISTS pre_transfer_branch_id,
        DROP COLUMN IF EXISTS pre_transfer_department_id,
        DROP COLUMN IF EXISTS pre_transfer_manager_id,
        DROP COLUMN IF EXISTS notice_start_date,
        DROP COLUMN IF EXISTS notice_period_days,
        DROP COLUMN IF EXISTS last_working_day,
        DROP COLUMN IF EXISTS exit_reason,
        DROP COLUMN IF EXISTS exit_type,
        DROP COLUMN IF EXISTS lifecycle_metadata
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS employee_lifecycle_stage;
    `);
  }
}
