import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Phase 1 — Add CRM, WorkTracking, Procurement, Audit, Tenant, WhiteLabel entities
 * Replaces all in-memory mock data with proper relational DB tables.
 * Safe to run on existing DB — only adds new tables.
 */
export class AddPhase1Entities1747000000000 implements MigrationInterface {
  name = 'AddPhase1Entities1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── CRM Leads ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_leads" (
        "id"              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"       VARCHAR NOT NULL,
        "lead_name"       VARCHAR NOT NULL,
        "organization"    VARCHAR,
        "email"           VARCHAR,
        "phone"           VARCHAR,
        "stage"           VARCHAR NOT NULL DEFAULT 'New',
        "owner_name"      VARCHAR,
        "score"           DECIMAL(5,2) NOT NULL DEFAULT 0,
        "source"          VARCHAR,
        "notes"           TEXT,
        "last_touch"      TIMESTAMPTZ,
        "expected_value"  DECIMAL(15,2),
        "company_id"      VARCHAR,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_leads_tenant_stage"  ON "crm_leads"("tenant_id","stage")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_leads_tenant"        ON "crm_leads"("tenant_id")`);

    // ── CRM Customers ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_customers" (
        "id"              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"       VARCHAR NOT NULL,
        "account_name"    VARCHAR NOT NULL,
        "industry"        VARCHAR,
        "owner_name"      VARCHAR,
        "health_status"   VARCHAR NOT NULL DEFAULT 'Healthy',
        "annual_value"    DECIMAL(15,2) NOT NULL DEFAULT 0,
        "email"           VARCHAR,
        "phone"           VARCHAR,
        "contract_end"    DATE,
        "company_id"      VARCHAR,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_customers_tenant" ON "crm_customers"("tenant_id")`);

    // ── CRM Interactions ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_interactions" (
        "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"        VARCHAR NOT NULL,
        "lead_id"          UUID REFERENCES "crm_leads"("id") ON DELETE SET NULL,
        "customer_id"      UUID REFERENCES "crm_customers"("id") ON DELETE SET NULL,
        "customer_name"    VARCHAR,
        "channel"          VARCHAR NOT NULL DEFAULT 'Email',
        "interaction_type" VARCHAR NOT NULL DEFAULT 'General',
        "happened_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "summary"          TEXT,
        "created_by"       VARCHAR,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_interactions_tenant_lead"     ON "crm_interactions"("tenant_id","lead_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_crm_interactions_tenant_customer"  ON "crm_interactions"("tenant_id","customer_id")`);

    // ── Work Activities ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "work_activities" (
        "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"        VARCHAR NOT NULL,
        "employee_id"      VARCHAR NOT NULL,
        "project_name"     VARCHAR,
        "date"             DATE NOT NULL DEFAULT CURRENT_DATE,
        "login_at"         TIME,
        "logout_at"        TIME,
        "tasks_completed"  INTEGER NOT NULL DEFAULT 0,
        "productive_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "metadata"         JSONB,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_work_activities_tenant_emp"  ON "work_activities"("tenant_id","employee_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_work_activities_tenant_date" ON "work_activities"("tenant_id","date")`);

    // ── Workday Summaries ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workday_summaries" (
        "id"             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"      VARCHAR NOT NULL,
        "employee_id"    VARCHAR NOT NULL,
        "employee_name"  VARCHAR,
        "month"          CHAR(7) NOT NULL,
        "present_days"   INTEGER NOT NULL DEFAULT 0,
        "absent_days"    INTEGER NOT NULL DEFAULT 0,
        "paid_leave"     INTEGER NOT NULL DEFAULT 0,
        "unpaid_leave"   INTEGER NOT NULL DEFAULT 0,
        "wfh_days"       INTEGER NOT NULL DEFAULT 0,
        "overtime_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workday_summaries_tenant_emp"   ON "workday_summaries"("tenant_id","employee_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workday_summaries_tenant_month"  ON "workday_summaries"("tenant_id","month")`);

    // ── Vendors ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendors" (
        "id"            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"     VARCHAR NOT NULL,
        "vendor_name"   VARCHAR NOT NULL,
        "category"      VARCHAR,
        "contact_email" VARCHAR,
        "contact_phone" VARCHAR,
        "owner_name"    VARCHAR,
        "status"        VARCHAR NOT NULL DEFAULT 'Active',
        "rating"        DECIMAL(3,2) NOT NULL DEFAULT 0,
        "tax_id"        VARCHAR,
        "address"       TEXT,
        "bank_details"  JSONB,
        "company_id"    VARCHAR,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_vendors_tenant_status"   ON "vendors"("tenant_id","status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_vendors_tenant_category" ON "vendors"("tenant_id","category")`);

    // ── Vendor Purchase Orders ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_purchase_orders" (
        "id"                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"              VARCHAR NOT NULL,
        "po_number"              VARCHAR NOT NULL,
        "vendor_id"              UUID REFERENCES "vendors"("id") ON DELETE SET NULL,
        "vendor_name"            VARCHAR,
        "amount"                 DECIMAL(15,2) NOT NULL DEFAULT 0,
        "currency"               CHAR(3) NOT NULL DEFAULT 'INR',
        "status"                 VARCHAR NOT NULL DEFAULT 'Draft',
        "approved_by"            VARCHAR,
        "expected_delivery_date" DATE,
        "items"                  JSONB,
        "notes"                  TEXT,
        "company_id"             VARCHAR,
        "created_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_vpo_tenant_status" ON "vendor_purchase_orders"("tenant_id","status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_vpo_tenant_vendor" ON "vendor_purchase_orders"("tenant_id","vendor_id")`);

    // ── Audit Logs ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id"          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"   VARCHAR,
        "actor_id"    VARCHAR,
        "actor_email" VARCHAR,
        "actor_role"  VARCHAR,
        "action"      VARCHAR NOT NULL,
        "entity_type" VARCHAR,
        "entity_id"   VARCHAR,
        "old_value"   JSONB,
        "new_value"   JSONB,
        "ip_address"  VARCHAR,
        "user_agent"  TEXT,
        "description" TEXT,
        "metadata"    JSONB,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_entity"  ON "audit_logs"("tenant_id","entity_type")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant_actor"   ON "audit_logs"("tenant_id","actor_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at"     ON "audit_logs"("created_at")`);

    // ── Tenants (Super Admin management) ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id"                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "slug"                   VARCHAR UNIQUE NOT NULL,
        "company_name"           VARCHAR NOT NULL,
        "owner_email"            VARCHAR UNIQUE NOT NULL,
        "owner_name"             VARCHAR,
        "status"                 VARCHAR NOT NULL DEFAULT 'trial',
        "plan"                   VARCHAR NOT NULL DEFAULT 'starter',
        "seat_limit"             INTEGER NOT NULL DEFAULT 10,
        "seat_used"              INTEGER NOT NULL DEFAULT 0,
        "stripe_customer_id"     VARCHAR,
        "stripe_subscription_id" VARCHAR,
        "trial_ends_at"          TIMESTAMPTZ,
        "suspended_at"           TIMESTAMPTZ,
        "suspended_reason"       TEXT,
        "feature_flags"          JSONB NOT NULL DEFAULT '{}',
        "custom_domain"          VARCHAR,
        "metadata"               JSONB,
        "created_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tenants_status" ON "tenants"("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tenants_plan"   ON "tenants"("plan")`);

    // ── White-Label Configs ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "white_label_configs" (
        "id"               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "tenant_id"        VARCHAR UNIQUE NOT NULL,
        "brand_name"       VARCHAR,
        "logo_url"         TEXT,
        "favicon_url"      TEXT,
        "primary_color"    CHAR(7) NOT NULL DEFAULT '#3b82f6',
        "secondary_color"  CHAR(7) NOT NULL DEFAULT '#8b5cf6',
        "accent_color"     CHAR(7) NOT NULL DEFAULT '#22d3ee',
        "sidebar_bg"       CHAR(7),
        "custom_domain"    VARCHAR,
        "smtp_host"        VARCHAR,
        "smtp_port"        INTEGER,
        "smtp_user"        VARCHAR,
        "smtp_password"    VARCHAR,
        "from_email"       VARCHAR,
        "from_name"        VARCHAR,
        "login_bg_url"     TEXT,
        "login_tagline"    VARCHAR,
        "feature_toggles"  JSONB NOT NULL DEFAULT '{}',
        "custom_css"       TEXT,
        "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "white_label_configs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_purchase_orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendors" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workday_summaries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "work_activities" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_interactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_customers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_leads" CASCADE`);
  }
}
