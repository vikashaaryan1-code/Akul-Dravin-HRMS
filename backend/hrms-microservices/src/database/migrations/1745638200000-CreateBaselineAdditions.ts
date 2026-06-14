import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBaselineAdditions1745638200000 implements MigrationInterface {
  name = 'CreateBaselineAdditions1745638200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Ensure existing tables have newly added columns
    await queryRunner.query(`
      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
    `);

    // 1. recruitment_jobs
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
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1',
        CONSTRAINT UQ_recruitment_jobs_requisition_code UNIQUE (requisition_code)
      )
    `);

    // 2. recruitment_applications
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
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 3. candidate_profiles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS candidate_profiles (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        user_id                 UUID,
        full_name               VARCHAR(150)  NOT NULL,
        email                   VARCHAR(190)  NOT NULL,
        phone                   VARCHAR(25)   NOT NULL,
        total_experience_years  NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
        skills                  JSONB         NOT NULL DEFAULT '[]',
        current_ctc             NUMERIC(12,2),
        expected_ctc            NUMERIC(12,2),
        location                VARCHAR(120)  NOT NULL,
        resume_url              VARCHAR(255),
        education               JSONB         NOT NULL DEFAULT '[]',
        experience_highlights   JSONB         NOT NULL DEFAULT '[]',
        ai_score                NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
        is_blue_collar          BOOLEAN       NOT NULL DEFAULT false,
        verified_skills         JSONB         NOT NULL DEFAULT '[]',
        status                  VARCHAR(40)   NOT NULL DEFAULT 'active',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 4. recruiter_profiles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recruiter_profiles (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        user_id                 UUID          NOT NULL,
        recruiter_type          VARCHAR(60)   NOT NULL,
        agency_name             VARCHAR(180),
        commission_rate         NUMERIC(5,2)  NOT NULL DEFAULT 15.00,
        rating                  NUMERIC(3,2)  NOT NULL DEFAULT 0.00,
        status                  VARCHAR(40)   NOT NULL DEFAULT 'active',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 5. sales_commissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sales_commissions (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        company_id              UUID,
        employee_id             UUID          NOT NULL,
        sales_target_id         UUID,
        deal_id                 UUID,
        commission_model        VARCHAR(24)   NOT NULL DEFAULT 'percentage',
        commission_rate         NUMERIC(7,4)  NOT NULL DEFAULT 0.0000,
        base_amount             NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        calculated_commission   NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        bonus_tier              VARCHAR(8),
        payout_status           VARCHAR(24)   NOT NULL DEFAULT 'planned',
        payroll_reference_id    UUID,
        payout_due_date         DATE,
        commission_payload      JSONB         NOT NULL DEFAULT '{}',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 6. sales_targets
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sales_targets (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        company_id              UUID,
        employee_id             UUID,
        target_period           VARCHAR(24)   NOT NULL,
        period_key              VARCHAR(20)   NOT NULL,
        target_value            NUMERIC(14,2) NOT NULL,
        achieved_value          NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        is_team_target          BOOLEAN       NOT NULL DEFAULT false,
        status                  VARCHAR(24)   NOT NULL DEFAULT 'active',
        target_payload          JSONB         NOT NULL DEFAULT '{}',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 7. sales_deals
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sales_deals (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        company_id              UUID,
        lead_id                 UUID,
        customer_account_id     UUID,
        deal_name               VARCHAR(180)  NOT NULL,
        deal_value              NUMERIC(14,2) NOT NULL,
        stage                   VARCHAR(30)   NOT NULL DEFAULT 'new-lead',
        expected_close_date     DATE,
        sales_representative_id UUID,
        probability             NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
        status                  VARCHAR(24)   NOT NULL DEFAULT 'open',
        closed_at               TIMESTAMPTZ,
        deal_payload            JSONB         NOT NULL DEFAULT '{}',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 8. sales_leads
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sales_leads (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        company_id              UUID,
        source                  VARCHAR(80)   NOT NULL,
        first_name              VARCHAR(80)   NOT NULL,
        last_name               VARCHAR(80),
        email                   VARCHAR(140)  NOT NULL,
        phone                   VARCHAR(30),
        organization            VARCHAR(160),
        assigned_to             UUID,
        score                   NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
        status                  VARCHAR(30)   NOT NULL DEFAULT 'new-lead',
        pipeline_stage          VARCHAR(30)   NOT NULL DEFAULT 'new-lead',
        nurturing_status        VARCHAR(30)   NOT NULL DEFAULT 'active',
        notes                   TEXT,
        lead_payload            JSONB         NOT NULL DEFAULT '{}',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 9. sales_customer_accounts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sales_customer_accounts (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        company_id              UUID,
        account_name            VARCHAR(180)  NOT NULL,
        industry                VARCHAR(120),
        website                 VARCHAR(220),
        address                 VARCHAR(160),
        owner_employee_id       UUID,
        account_status          VARCHAR(24)   NOT NULL DEFAULT 'active',
        annual_recurring_value  NUMERIC(14,2) NOT NULL DEFAULT 0.00,
        account_payload         JSONB         NOT NULL DEFAULT '{}',
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 10. sales_customer_contacts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sales_customer_contacts (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        customer_account_id     UUID          NOT NULL,
        first_name              VARCHAR(80)   NOT NULL,
        last_name               VARCHAR(80),
        email                   VARCHAR(140)  NOT NULL,
        phone                   VARCHAR(30),
        designation             VARCHAR(100),
        is_primary              BOOLEAN       NOT NULL DEFAULT false,
        last_interaction_at     TIMESTAMPTZ,
        interaction_history     JSONB         NOT NULL DEFAULT '[]',
        notes                   TEXT,
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1'
      )
    `);

    // 11. career_growth_events
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS career_growth_events (
        id                      UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id               UUID,
        employee_id             UUID          NOT NULL,
        type                    VARCHAR(50)   NOT NULL,
        old_designation         VARCHAR(120),
        new_designation         VARCHAR(120),
        old_salary              NUMERIC(14,2),
        new_salary              NUMERIC(14,2),
        trigger_score           NUMERIC(5,2)  NOT NULL,
        status                  VARCHAR(40)   NOT NULL DEFAULT 'proposed',
        effective_date          DATE,
        forensic_trace_id       VARCHAR(100),
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        governance_provenance_hash character varying(64),
        epistemic_confidence    double precision DEFAULT '1',
        CONSTRAINT FK_career_growth_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS career_growth_events CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_customer_contacts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_customer_accounts CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_leads CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_deals CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_targets CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sales_commissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS recruiter_profiles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS candidate_profiles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS recruitment_applications CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS recruitment_jobs CASCADE`);
  }
}
