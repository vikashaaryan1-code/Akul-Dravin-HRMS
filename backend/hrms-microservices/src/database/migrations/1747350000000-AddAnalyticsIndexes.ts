import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Add Analytics Performance Indexes
 *
 * Adds composite indexes on the tables most frequently hit by the
 * Workforce Analytics, Recruitment Analytics, and Revenue Analytics services.
 *
 * Design note: all indexes are CONCURRENT-friendly via CREATE INDEX IF NOT EXISTS.
 * Targeted to avoid over-indexing write-heavy payroll tables.
 */
export class AddAnalyticsIndexes1747350000000 implements MigrationInterface {
  name = 'AddAnalyticsIndexes1747350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Employees Analytics Indexes ───────────────────────────────────────

    // Headcount + attrition queries filter by tenant_id + status + exit_date
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_tenant_status_exit
        ON employees (tenant_id, status, exit_date)
        WHERE exit_date IS NULL;
    `);

    // Department headcount breakdowns
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_tenant_dept_status
        ON employees (tenant_id, department_id, status)
        WHERE exit_date IS NULL;
    `);

    // Join date range queries (tenure, new hire counts)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_tenant_join_date
        ON employees (tenant_id, join_date);
    `);

    // Exit date range queries (attrition by period)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_tenant_exit_date
        ON employees (tenant_id, exit_date)
        WHERE exit_date IS NOT NULL;
    `);

    // ── Recruitment Analytics Indexes ─────────────────────────────────────

    // Pipeline stage + created_at for funnel metrics
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ra_tenant_stage_created
        ON recruitment_applications (tenant_id, stage, created_at);
    `);

    // Time-to-hire queries: hired_at filter
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ra_tenant_hired_at
        ON recruitment_applications (tenant_id, hired_at)
        WHERE hired_at IS NOT NULL;
    `);

    // Job-level joins for department time-to-hire
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rj_tenant_dept_status
        ON recruitment_jobs (tenant_id, department_id, status);
    `);

    // ── Subscription / Revenue Analytics Indexes ──────────────────────────

    // MRR, plan distribution queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status_plan
        ON subscriptions (status, plan_name);
    `);

    // Churn queries filter by status + updated_at
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_cancelled_updated
        ON subscriptions (status, updated_at)
        WHERE status = 'cancelled';
    `);

    // Growth trend by created_at month
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at
        ON subscriptions (created_at);
    `);

    // ── Leave Requests Analytics ──────────────────────────────────────────

    // Pending leaves for attrition risk scoring
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status
        ON leave_requests (employee_id, status)
        WHERE status = 'pending';
    `);

    // ── Attendance Analytics ──────────────────────────────────────────────

    // Late mark count for attrition risk scoring
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_attendances_employee_status_date
        ON attendance_records (employee_id, status, attendance_date)
        WHERE status = 'late';
    `);

    // ── Sales Commissions Indexes ─────────────────────────────────────────

    // Recruiter ledger queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_commissions_tenant_employee
        ON sales_commissions (tenant_id, employee_id, created_at DESC);
    `);

    // ── Helpdesk Tickets for AI Risk Scoring ─────────────────────────────

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_helpdesk_employee_created
        ON helpdesk_tickets (requester_id, created_at);
    `);

    // ── Add recruitment_jobs supplementary columns ────────────────────────

    // Columns used by AI Matching Service
    await queryRunner.query(`
      ALTER TABLE recruitment_jobs
        ADD COLUMN IF NOT EXISTS required_skills   TEXT[]   DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS preferred_skills  TEXT[]   DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS experience_min    INTEGER  DEFAULT 0,
        ADD COLUMN IF NOT EXISTS experience_max    INTEGER,
        ADD COLUMN IF NOT EXISTS salary_min        NUMERIC(14,2),
        ADD COLUMN IF NOT EXISTS salary_max        NUMERIC(14,2),
        ADD COLUMN IF NOT EXISTS is_remote         BOOLEAN  DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS placement_fee     NUMERIC(14,2),
        ADD COLUMN IF NOT EXISTS assigned_recruiter_id UUID
    `);

    // ── Add candidate_profiles supplementary columns ──────────────────────

    // Columns used by AI Matching Service
    await queryRunner.query(`
      ALTER TABLE candidate_profiles
        ADD COLUMN IF NOT EXISTS skills            TEXT[]   DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS experience_years  INTEGER  DEFAULT 0,
        ADD COLUMN IF NOT EXISTS current_location  VARCHAR(200),
        ADD COLUMN IF NOT EXISTS expected_salary   NUMERIC(14,2)
    `);

    // ── Add employees supplementary columns ───────────────────────────────

    // lifecycle_stage + last_promoted_at were added in migration 1747320000000.
    // skills[] column added here for AI matching; IF NOT EXISTS is a no-op if already present.
    await queryRunner.query(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}'
    `);

    // Add GIN index for skills array search on employees
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_employees_skills_gin
        ON employees USING GIN (skills)
    `);

    // Add GIN indexes for recruitment_jobs required_skills
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rj_required_skills_gin
        ON recruitment_jobs USING GIN (required_skills);
      CREATE INDEX IF NOT EXISTS idx_rj_preferred_skills_gin
        ON recruitment_jobs USING GIN (preferred_skills);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes (reverse order)
    const indexes = [
      'idx_employees_tenant_status_exit',
      'idx_employees_tenant_dept_status',
      'idx_employees_tenant_join_date',
      'idx_employees_tenant_exit_date',
      'idx_ra_tenant_stage_created',
      'idx_ra_tenant_hired_at',
      'idx_rj_tenant_dept_status',
      'idx_subscriptions_status_plan',
      'idx_subscriptions_cancelled_updated',
      'idx_subscriptions_created_at',
      'idx_leave_requests_employee_status',
      'idx_attendances_employee_status_date',
      'idx_sales_commissions_tenant_employee',
      'idx_helpdesk_employee_created',
      'idx_employees_skills_gin',
      'idx_rj_required_skills_gin',
      'idx_rj_preferred_skills_gin',
    ];

    for (const idx of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS ${idx}`);
    }

    // Drop added columns
    await queryRunner.query(`
      ALTER TABLE recruitment_jobs
        DROP COLUMN IF EXISTS required_skills,
        DROP COLUMN IF EXISTS preferred_skills,
        DROP COLUMN IF EXISTS experience_min,
        DROP COLUMN IF EXISTS experience_max,
        DROP COLUMN IF EXISTS salary_min,
        DROP COLUMN IF EXISTS salary_max,
        DROP COLUMN IF EXISTS is_remote,
        DROP COLUMN IF EXISTS placement_fee,
        DROP COLUMN IF EXISTS assigned_recruiter_id
    `);

    await queryRunner.query(`
      ALTER TABLE candidate_profiles
        DROP COLUMN IF EXISTS skills,
        DROP COLUMN IF EXISTS experience_years,
        DROP COLUMN IF EXISTS current_location,
        DROP COLUMN IF EXISTS expected_salary
    `);
  }
}
