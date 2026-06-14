import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Enhance ATS Pipeline
 *
 * PRD §6–§8: Full ATS pipeline from Job Posting → Candidate Application →
 * Screening → Shortlist → Interview → Offer → Hire → Onboarding Trigger.
 *
 * Changes:
 *   1. recruitment_jobs     — add department, skills, deadline, experience range, publish toggle
 *   2. recruitment_applications — add pipeline_history JSONB, offer_details, rejection info
 *   3. recruitment_interviews   — NEW table for interview scheduling + scorecards
 *   4. recruitment_offers       — NEW table for formal offer records
 */
export class EnhanceATSPipeline1747340000000 implements MigrationInterface {
  name = 'EnhanceATSPipeline1747340000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Create baseline tables if they do not exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recruitment_jobs (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        company_id              UUID          NOT NULL,
        requisition_code        VARCHAR(80)   NOT NULL,
        title                   VARCHAR(160)  NOT NULL,
        description             TEXT          NOT NULL,
        location                VARCHAR(120)  NOT NULL,
        employment_type         VARCHAR(60)   NOT NULL,
        salary_min              NUMERIC(12,2),
        salary_max              NUMERIC(12,2),
        posted_by               UUID          NOT NULL,
        hiring_manager_id       UUID,
        required_skills         JSONB         NOT NULL DEFAULT '[]',
        experience_level        VARCHAR(60),
        is_marketplace_visible  BOOLEAN       NOT NULL DEFAULT false,
        status                  VARCHAR(40)   NOT NULL DEFAULT 'open',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT UQ_recruitment_jobs_requisition_code UNIQUE (requisition_code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recruitment_applications (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        job_id                  UUID          NOT NULL,
        candidate_id            UUID          NOT NULL,
        stage                   VARCHAR(60)   NOT NULL DEFAULT 'applied',
        score                   NUMERIC(5,2),
        source                  VARCHAR(60)   NOT NULL DEFAULT 'portal',
        status                  VARCHAR(40)   NOT NULL DEFAULT 'active',
        assigned_recruiter_id   UUID,
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // ── 1. Enhance recruitment_jobs ────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE recruitment_jobs
        ADD COLUMN IF NOT EXISTS department_id          UUID,
        ADD COLUMN IF NOT EXISTS branch_id              UUID,
        ADD COLUMN IF NOT EXISTS skills_required        JSONB       NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS experience_min_years   SMALLINT    NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS experience_max_years   SMALLINT,
        ADD COLUMN IF NOT EXISTS application_deadline   DATE,
        ADD COLUMN IF NOT EXISTS is_published           BOOLEAN     NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_featured            BOOLEAN     NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS max_applicants         INTEGER,
        ADD COLUMN IF NOT EXISTS applicant_count        INTEGER     NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS hired_count            INTEGER     NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS job_type               VARCHAR(40),
        ADD COLUMN IF NOT EXISTS remote_allowed         BOOLEAN     NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS benefits               JSONB       NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS ai_match_enabled       BOOLEAN     NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS closed_at              TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS metadata               JSONB       NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_rj_is_published
        ON recruitment_jobs (is_published, status, tenant_id);
      CREATE INDEX IF NOT EXISTS idx_rj_deadline
        ON recruitment_jobs (application_deadline)
        WHERE application_deadline IS NOT NULL;
    `);

    // ── 2. Enhance recruitment_applications ───────────────────────────────
    await queryRunner.query(`
      ALTER TABLE recruitment_applications
        ADD COLUMN IF NOT EXISTS pipeline_history       JSONB       NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS offer_id               UUID,
        ADD COLUMN IF NOT EXISTS rejection_reason       TEXT,
        ADD COLUMN IF NOT EXISTS rejection_stage        VARCHAR(60),
        ADD COLUMN IF NOT EXISTS resume_url             TEXT,
        ADD COLUMN IF NOT EXISTS cover_letter           TEXT,
        ADD COLUMN IF NOT EXISTS ai_score               NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS ai_match_details       JSONB       NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS notes                  TEXT,
        ADD COLUMN IF NOT EXISTS last_stage_changed_at  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS hired_at               TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS withdrawn_at           TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS expected_ctc           NUMERIC(14,2),
        ADD COLUMN IF NOT EXISTS current_ctc            NUMERIC(14,2),
        ADD COLUMN IF NOT EXISTS notice_period_days     INTEGER
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ra_stage
        ON recruitment_applications (stage, tenant_id);
      CREATE INDEX IF NOT EXISTS idx_ra_job_stage
        ON recruitment_applications (job_id, stage);
    `);

    // ── 3. recruitment_interviews (NEW) ───────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recruitment_interviews (
        id                  UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id           UUID          NOT NULL,
        application_id      UUID          NOT NULL,
        job_id              UUID          NOT NULL,
        candidate_id        UUID          NOT NULL,
        round_number        SMALLINT      NOT NULL DEFAULT 1,
        interview_type      VARCHAR(40)   NOT NULL DEFAULT 'video',
        scheduled_at        TIMESTAMPTZ   NOT NULL,
        duration_minutes    SMALLINT      NOT NULL DEFAULT 60,
        mode                VARCHAR(20)   NOT NULL DEFAULT 'video',
        meeting_link        TEXT,
        location            TEXT,
        interviewer_ids     JSONB         NOT NULL DEFAULT '[]',
        status              VARCHAR(30)   NOT NULL DEFAULT 'scheduled',
        scorecard           JSONB         NOT NULL DEFAULT '{}',
        overall_rating      NUMERIC(3,1),
        recommendation      VARCHAR(20),
        feedback            TEXT,
        completed_at        TIMESTAMPTZ,
        cancelled_at        TIMESTAMPTZ,
        cancellation_reason TEXT,
        created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ri_application_id
        ON recruitment_interviews (application_id);
      CREATE INDEX IF NOT EXISTS idx_ri_candidate_id
        ON recruitment_interviews (candidate_id, tenant_id);
      CREATE INDEX IF NOT EXISTS idx_ri_scheduled_at
        ON recruitment_interviews (scheduled_at);
    `);

    // ── 4. recruitment_offers (NEW) ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recruitment_offers (
        id                  UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id           UUID          NOT NULL,
        application_id      UUID          NOT NULL,
        job_id              UUID          NOT NULL,
        candidate_id        UUID          NOT NULL,
        offer_code          VARCHAR(60)   NOT NULL,
        offered_designation VARCHAR(120)  NOT NULL,
        offered_ctc         NUMERIC(14,2) NOT NULL,
        joining_date        DATE          NOT NULL,
        offer_expiry_date   DATE,
        status              VARCHAR(30)   NOT NULL DEFAULT 'draft',
        salary_breakdown    JSONB         NOT NULL DEFAULT '{}',
        benefits            JSONB         NOT NULL DEFAULT '[]',
        offer_letter_url    TEXT,
        sent_at             TIMESTAMPTZ,
        accepted_at         TIMESTAMPTZ,
        rejected_at         TIMESTAMPTZ,
        rejection_reason    TEXT,
        revoked_at          TIMESTAMPTZ,
        negotiation_notes   TEXT,
        created_by          UUID,
        created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ro_offer_code
        ON recruitment_offers (tenant_id, offer_code);
      CREATE INDEX IF NOT EXISTS idx_ro_application_id
        ON recruitment_offers (application_id);
      CREATE INDEX IF NOT EXISTS idx_ro_candidate_status
        ON recruitment_offers (candidate_id, status);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS recruitment_offers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS recruitment_interviews CASCADE`);

    await queryRunner.query(`
      ALTER TABLE recruitment_applications
        DROP COLUMN IF EXISTS pipeline_history,
        DROP COLUMN IF EXISTS offer_id,
        DROP COLUMN IF EXISTS rejection_reason,
        DROP COLUMN IF EXISTS rejection_stage,
        DROP COLUMN IF EXISTS resume_url,
        DROP COLUMN IF EXISTS cover_letter,
        DROP COLUMN IF EXISTS ai_score,
        DROP COLUMN IF EXISTS ai_match_details,
        DROP COLUMN IF EXISTS notes,
        DROP COLUMN IF EXISTS last_stage_changed_at,
        DROP COLUMN IF EXISTS hired_at,
        DROP COLUMN IF EXISTS withdrawn_at,
        DROP COLUMN IF EXISTS expected_ctc,
        DROP COLUMN IF EXISTS current_ctc,
        DROP COLUMN IF EXISTS notice_period_days
    `);

    await queryRunner.query(`
      ALTER TABLE recruitment_jobs
        DROP COLUMN IF EXISTS department_id,
        DROP COLUMN IF EXISTS branch_id,
        DROP COLUMN IF EXISTS skills_required,
        DROP COLUMN IF EXISTS experience_min_years,
        DROP COLUMN IF EXISTS experience_max_years,
        DROP COLUMN IF EXISTS application_deadline,
        DROP COLUMN IF EXISTS is_published,
        DROP COLUMN IF EXISTS is_featured,
        DROP COLUMN IF EXISTS max_applicants,
        DROP COLUMN IF EXISTS applicant_count,
        DROP COLUMN IF EXISTS hired_count,
        DROP COLUMN IF EXISTS job_type,
        DROP COLUMN IF EXISTS remote_allowed,
        DROP COLUMN IF EXISTS benefits,
        DROP COLUMN IF EXISTS ai_match_enabled,
        DROP COLUMN IF EXISTS closed_at,
        DROP COLUMN IF EXISTS metadata
    `);
  }
}
