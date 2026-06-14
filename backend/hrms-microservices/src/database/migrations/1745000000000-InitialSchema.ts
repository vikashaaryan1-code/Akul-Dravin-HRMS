import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Initial Schema
 *
 * Creates all tables that TypeORM entities declare, in FK-dependency order:
 *   1. No-dependency tables first (permissions, roles, companies, etc.)
 *   2. Tables that reference others second (users → roles, employees → companies, etc.)
 *   3. Junction tables last (role_permissions)
 *
 * Rules:
 *   - All DDL uses IF NOT EXISTS — safe to run on partially-initialised DB
 *   - NO reference to schema.sql — TypeORM is the single schema authority
 *   - All enums created before their parent table
 *   - Rollback (down) drops in reverse FK order
 *
 * This migration covers the 49 TypeORM entities. The 4 subsequent delta
 * migrations (AddMfaColumns, AuditTrigger, AddUserId, CreatePaymentEvents)
 * are applied on top of this foundation.
 */
export class InitialSchema1745000000000 implements MigrationInterface {
  public readonly name = 'InitialSchema1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Enums ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payroll_batch_status_enum AS ENUM ('DRAFT','LOCKED','PROCESSING','COMPLETED','FAILED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payroll_item_execution_status_enum AS ENUM ('PENDING','SUCCESS','FAILED');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE invitation_status_enum AS ENUM ('pending','accepted','expired','revoked');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── 2. Root tables (no FK dependencies) ──────────────────────────────────

    // permissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
        "slug"        VARCHAR(100) NOT NULL,
        "name"        VARCHAR(255) NOT NULL,
        "description" TEXT,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_slug" UNIQUE ("slug")
      )
    `);

    // roles
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      UUID,
        "name"           VARCHAR(100) NOT NULL,
        "description"    TEXT,
        "is_system_role" BOOLEAN      NOT NULL DEFAULT FALSE,
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // role_permissions (junction)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id"       UUID NOT NULL,
        "permission_id" UUID NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role"       FOREIGN KEY ("role_id")       REFERENCES "roles"("id")       ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    // companies
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "companies" (
        "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"    UUID,
        "tenant_code"  VARCHAR(64)  NOT NULL,
        "legal_name"   VARCHAR(190) NOT NULL,
        "display_name" VARCHAR(190) NOT NULL,
        "industry"     VARCHAR(120) NOT NULL,
        "country"      VARCHAR(80)  NOT NULL DEFAULT 'India',
        "timezone"     VARCHAR(80)  NOT NULL DEFAULT 'Asia/Kolkata',
        "settings"     JSONB        NOT NULL DEFAULT '{}',
        "status"       VARCHAR(30)  NOT NULL DEFAULT 'active',
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_companies_tenant_code" UNIQUE ("tenant_code")
      )
    `);

    // ── 3. Tables that depend on root tables ─────────────────────────────────

    // users (depends on roles)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"        UUID,
        "email"            VARCHAR(190) NOT NULL,
        "password_hash"    VARCHAR(255) NOT NULL,
        "full_name"        VARCHAR(140) NOT NULL,
        "role_id"          UUID,
        "is_active"        BOOLEAN      NOT NULL DEFAULT TRUE,
        "last_login_at"    TIMESTAMPTZ,
        "deactivated_at"   TIMESTAMPTZ,
        "mfa_totp_secret"  VARCHAR(64),
        "mfa_enabled"      BOOLEAN      NOT NULL DEFAULT FALSE,
        "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_email" ON "users" ("email")`);

    // user_invitations (depends on roles)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_invitations" (
        "id"            UUID                    NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"     UUID,
        "email"         VARCHAR(190)            NOT NULL,
        "role_id"       UUID                    NOT NULL,
        "token"         VARCHAR(255)            NOT NULL,
        "expires_at"    TIMESTAMPTZ             NOT NULL,
        "status"        invitation_status_enum  NOT NULL DEFAULT 'pending',
        "invited_by_id" UUID,
        "created_at"    TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_invitations_token" UNIQUE ("token"),
        CONSTRAINT "FK_user_invitations_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_invitations_email" ON "user_invitations" ("email")`);

    // employees (depends on companies)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employees" (
        "id"               UUID          NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"        UUID,
        "company_id"       UUID          NOT NULL,
        "branch_id"        UUID,
        "department_id"    UUID,
        "manager_id"       UUID,
        "employee_code"    VARCHAR(50)   NOT NULL,
        "first_name"       VARCHAR(80)   NOT NULL,
        "last_name"        VARCHAR(80),
        "work_email"       VARCHAR(255)  NOT NULL,
        "personal_email"   VARCHAR(255),
        "phone"            VARCHAR(30),
        "employment_type"  VARCHAR(20)   NOT NULL DEFAULT 'full_time',
        "designation"      VARCHAR(120)  NOT NULL,
        "join_date"        DATE          NOT NULL,
        "exit_date"        DATE,
        "monthly_ctc"      NUMERIC(14,2),
        "status"           VARCHAR(20)   NOT NULL DEFAULT 'active',
        "user_id"          UUID,
        "created_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_employees" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employees_code" UNIQUE ("employee_code")
      )
    `);

    // notifications (depends on users/tenants — uses user_id as loose reference)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"    UUID,
        "user_id"      UUID         NOT NULL,
        "channel"      VARCHAR(50)  NOT NULL,
        "type"         VARCHAR(60)  NOT NULL,
        "title"        VARCHAR(180) NOT NULL,
        "message"      TEXT         NOT NULL,
        "scheduled_at" TIMESTAMPTZ,
        "sent_at"      TIMESTAMPTZ,
        "status"       VARCHAR(40)  NOT NULL DEFAULT 'queued',
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_user_id" ON "notifications" ("user_id")`);

    // subscriptions (depends on companies)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      UUID,
        "company_id"     UUID         NOT NULL,
        "plan_name"      VARCHAR(120) NOT NULL,
        "billing_cycle"  VARCHAR(30)  NOT NULL DEFAULT 'monthly',
        "price"          NUMERIC(12,2) NOT NULL,
        "features"       JSONB        NOT NULL DEFAULT '{}',
        "start_date"     DATE         NOT NULL,
        "end_date"       DATE,
        "status"         VARCHAR(40)  NOT NULL DEFAULT 'active',
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);

    // invoices (depends on subscriptions)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"       UUID,
        "subscription_id" UUID,
        "invoice_number"  VARCHAR(60)  NOT NULL,
        "amount"          NUMERIC(12,2) NOT NULL,
        "currency"        VARCHAR(10)  NOT NULL DEFAULT 'INR',
        "due_date"        DATE         NOT NULL,
        "status"          VARCHAR(40)  NOT NULL DEFAULT 'pending',
        "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_number" UNIQUE ("invoice_number")
      )
    `);

    // ── 4. Attendance (depends on employees) ─────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_records" (
        "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"       UUID,
        "employee_id"     UUID         NOT NULL,
        "attendance_date" DATE         NOT NULL,
        "check_in_at"     TIMESTAMPTZ,
        "check_out_at"    TIMESTAMPTZ,
        "status"          VARCHAR(40)  NOT NULL DEFAULT 'present',
        "company_id"      UUID,
        "geo_location"    VARCHAR(255),
        "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_attendance_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendance_employee" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_attendance_employee_id" ON "attendance_records" ("employee_id")`);

    // ── 5. Leave (depends on employees) ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_types" (
        "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"           UUID,
        "company_id"          UUID          NOT NULL,
        "leave_code"          VARCHAR(40)   NOT NULL,
        "leave_name"          VARCHAR(140)  NOT NULL,
        "days_per_year"       NUMERIC(6,2)  NOT NULL DEFAULT 0,
        "carry_forward_limit" NUMERIC(6,2)  NOT NULL DEFAULT 0,
        "encashable"          BOOLEAN       NOT NULL DEFAULT FALSE,
        "is_active"           BOOLEAN       NOT NULL DEFAULT TRUE,
        "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_leave_types" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_types_company_id" ON "leave_types" ("company_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"     UUID,
        "employee_id"   UUID          NOT NULL,
        "leave_type_id" UUID          NOT NULL,
        "start_date"    DATE          NOT NULL,
        "end_date"      DATE          NOT NULL,
        "total_days"    NUMERIC(6,2)  NOT NULL,
        "status"        VARCHAR(40)   NOT NULL DEFAULT 'pending',
        "reason"        TEXT,
        "approved_by"   UUID,
        "approved_at"   TIMESTAMPTZ,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_leave_requests" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_requests_employee_id"   ON "leave_requests" ("employee_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_requests_leave_type_id" ON "leave_requests" ("leave_type_id")`);

    // ── 6. Payroll ────────────────────────────────────────────────────────────

    // ledger_transactions (no entity FK in public schema — standalone)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ledger_transactions" (
        "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      UUID,
        "reference_type" VARCHAR(80)  NOT NULL,
        "reference_id"   UUID         NOT NULL,
        "amount"         NUMERIC(19,4) NOT NULL,
        "currency"       VARCHAR(10)  NOT NULL DEFAULT 'INR',
        "direction"      VARCHAR(10)  NOT NULL DEFAULT 'debit',
        "status"         VARCHAR(40)  NOT NULL DEFAULT 'pending',
        "metadata"       JSONB,
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_ledger_transactions" PRIMARY KEY ("id")
      )
    `);

    // payroll_batches
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payroll_batches" (
        "id"               UUID                        NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"        UUID,
        "year"             INTEGER                     NOT NULL,
        "month"            INTEGER                     NOT NULL,
        "status"           payroll_batch_status_enum   NOT NULL DEFAULT 'DRAFT',
        "total_gross"      NUMERIC(19,4)               NOT NULL DEFAULT '0.0000',
        "total_deductions" NUMERIC(19,4)               NOT NULL DEFAULT '0.0000',
        "total_net"        NUMERIC(19,4)               NOT NULL DEFAULT '0.0000',
        "currency"         VARCHAR(10)                 NOT NULL DEFAULT 'INR',
        "locked_at"        TIMESTAMPTZ,
        "period_start"     TIMESTAMPTZ,
        "period_end"       TIMESTAMPTZ,
        "cutoff_at"        TIMESTAMPTZ,
        "timezone"         VARCHAR(50)                 NOT NULL DEFAULT 'UTC',
        "executed_at"      TIMESTAMPTZ,
        "batch_seal"       VARCHAR(64),
        "created_at"       TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
        "updated_at"       TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_payroll_batches" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payroll_batches_period_start" ON "payroll_batches" ("period_start")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payroll_batches_period_end"   ON "payroll_batches" ("period_end")`);

    // payroll_items (depends on payroll_batches + ledger_transactions)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payroll_items" (
        "id"                    UUID                              NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"             UUID,
        "employee_id"           UUID                              NOT NULL,
        "batch_id"              UUID                              NOT NULL,
        "gross_salary"          NUMERIC(19,4)                    NOT NULL,
        "deductions"            NUMERIC(19,4)                    NOT NULL,
        "net_payable"           NUMERIC(19,4)                    NOT NULL,
        "currency"              VARCHAR(10)                       NOT NULL DEFAULT 'INR',
        "calculation_status"    VARCHAR(30)                       NOT NULL DEFAULT 'draft',
        "execution_status"      payroll_item_execution_status_enum NOT NULL DEFAULT 'PENDING',
        "error_log"             TEXT,
        "idempotency_key"       VARCHAR(255),
        "linked_transaction_id" UUID,
        "metadata"              JSONB,
        "created_at"            TIMESTAMPTZ                       NOT NULL DEFAULT NOW(),
        "updated_at"            TIMESTAMPTZ                       NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_payroll_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payroll_items_batch"       FOREIGN KEY ("batch_id")              REFERENCES "payroll_batches"("id")      ON DELETE CASCADE,
        CONSTRAINT "FK_payroll_items_transaction"  FOREIGN KEY ("linked_transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payroll_items_employee_id"    ON "payroll_items" ("employee_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payroll_items_idempotency_key" ON "payroll_items" ("idempotency_key")`);

    // ── 7. Audit log (standalone — immutability trigger added by migration 2) ─
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"   UUID,
        "actor_id"    UUID,
        "actor_type"  VARCHAR(40)  NOT NULL DEFAULT 'user',
        "action"      VARCHAR(100) NOT NULL,
        "entity_type" VARCHAR(80)  NOT NULL,
        "entity_id"   UUID,
        "old_value"   JSONB,
        "new_value"   JSONB,
        "ip_address"  VARCHAR(60),
        "user_agent"  TEXT,
        "created_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_actor"  ON "audit_logs" ("actor_id", "created_at" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse FK dependency order
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payroll_batches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ledger_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_types"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_invitations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "invitation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payroll_item_execution_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payroll_batch_status_enum"`);
  }
}
