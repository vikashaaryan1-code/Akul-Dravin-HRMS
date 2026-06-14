import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create payment_events table
 *
 * Immutable event log for Stripe webhook events.
 * Enables:
 *   - idempotency (prevent double-processing of retried webhooks)
 *   - audit trail of all billing lifecycle events
 *   - replay capability for reconciliation
 */
export class CreatePaymentEventsTable1745700000000 implements MigrationInterface {
  public readonly name = 'CreatePaymentEventsTable1745700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_events" (
        "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id"         VARCHAR(64),
        "stripe_event_id"   VARCHAR(128) NOT NULL,
        "event_type"        VARCHAR(64)  NOT NULL,
        "company_id"        VARCHAR(64),
        "subscription_id"   UUID,
        "stripe_customer_id" VARCHAR(128),
        "amount_cents"      INTEGER,
        "currency"          VARCHAR(8)   DEFAULT 'inr',
        "status"            VARCHAR(32)  NOT NULL DEFAULT 'processed',
        "raw_payload"       JSONB,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_payment_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_events_stripe_id" UNIQUE ("stripe_event_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_events_tenant_type"
      ON "payment_events" ("tenant_id", "event_type", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_events_subscription"
      ON "payment_events" ("subscription_id")
      WHERE "subscription_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_events"`);
  }
}
