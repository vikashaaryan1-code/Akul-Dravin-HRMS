import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create helpdesk_tickets, location_pings, and marketing_campaigns tables
 *
 * Converts three stub-data modules to real database-backed persistence:
 *   - helpdesk_tickets  : Support ticket lifecycle with SLA tracking
 *   - location_pings    : Employee location pings with GPS coordinates
 *   - marketing_campaigns: Campaign management with channel and performance metrics
 */
export class AddHelpdeskLocationMarketing1745800000000 implements MigrationInterface {
  public readonly name = 'AddHelpdeskLocationMarketing1745800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── helpdesk_tickets ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "helpdesk_tickets" (
        "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      UUID,
        "ticket_number"  VARCHAR(50)  NOT NULL,
        "subject"        VARCHAR(255) NOT NULL,
        "description"    TEXT,
        "requester_id"   UUID,
        "requester_name" VARCHAR(150) NOT NULL,
        "department"     VARCHAR(100),
        "category"       VARCHAR(100) NOT NULL DEFAULT 'General',
        "priority"       VARCHAR(20)  NOT NULL DEFAULT 'medium',
        "status"         VARCHAR(30)  NOT NULL DEFAULT 'open',
        "sla_hours"      INTEGER      NOT NULL DEFAULT 24,
        "assigned_to_id" UUID,
        "resolved_at"    TIMESTAMPTZ,
        "closed_at"      TIMESTAMPTZ,
        "created_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_helpdesk_tickets"       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_helpdesk_ticket_number" UNIQUE ("ticket_number")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_helpdesk_tickets_tenant_status"
      ON "helpdesk_tickets" ("tenant_id", "status", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_helpdesk_tickets_requester"
      ON "helpdesk_tickets" ("requester_id")
      WHERE "requester_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_helpdesk_tickets_assigned"
      ON "helpdesk_tickets" ("assigned_to_id")
      WHERE "assigned_to_id" IS NOT NULL
    `);

    // ── location_pings ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "location_pings" (
        "id"              UUID          NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"       UUID,
        "employee_id"     UUID          NOT NULL,
        "employee_name"   VARCHAR(150)  NOT NULL,
        "location_label"  VARCHAR(255)  NOT NULL,
        "zone_type"       VARCHAR(30)   NOT NULL DEFAULT 'office',
        "status"          VARCHAR(50)   NOT NULL DEFAULT 'inside-geofence',
        "latitude"        DECIMAL(10,7),
        "longitude"       DECIMAL(10,7),
        "accuracy_metres" INTEGER,
        "pinged_at"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "ping_date"       DATE          NOT NULL,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_location_pings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_location_pings_employee_date"
      ON "location_pings" ("employee_id", "ping_date" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_location_pings_tenant_date"
      ON "location_pings" ("tenant_id", "ping_date" DESC)
    `);

    // ── marketing_campaigns ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
        "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"      UUID,
        "campaign_name"  VARCHAR(255)  NOT NULL,
        "description"    TEXT,
        "channel"        VARCHAR(30)   NOT NULL,
        "status"         VARCHAR(30)   NOT NULL DEFAULT 'Draft',
        "audience_size"  INTEGER       NOT NULL DEFAULT 0,
        "reach"          INTEGER       NOT NULL DEFAULT 0,
        "conversions"    INTEGER       NOT NULL DEFAULT 0,
        "spend"          DECIMAL(14,2) NOT NULL DEFAULT 0,
        "scheduled_at"   TIMESTAMPTZ,
        "started_at"     TIMESTAMPTZ,
        "completed_at"   TIMESTAMPTZ,
        "created_by_id"  UUID,
        "created_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_marketing_campaigns" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketing_campaigns_tenant_status"
      ON "marketing_campaigns" ("tenant_id", "status", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketing_campaigns_scheduled"
      ON "marketing_campaigns" ("scheduled_at")
      WHERE "scheduled_at" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_campaigns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "location_pings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "helpdesk_tickets"`);
  }
}
