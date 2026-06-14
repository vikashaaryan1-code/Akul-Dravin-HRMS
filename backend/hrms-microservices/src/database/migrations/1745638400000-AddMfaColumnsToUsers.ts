import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add MFA columns to users table
 *
 * Adds:
 *  - mfa_totp_secret  VARCHAR(64) NULLABLE  — stores the TOTP secret for Google Authenticator
 *  - mfa_enabled      BOOLEAN NOT NULL DEFAULT FALSE — whether MFA is active on this account
 *
 * Non-breaking: both columns are nullable / have defaults, so existing rows are unaffected.
 *
 * Rollback: removes both columns (safe — no production data depends on them at migration time).
 */
export class AddMfaColumnsToUsers1745638400000 implements MigrationInterface {
  public readonly name = 'AddMfaColumnsToUsers1745638400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add mfa_totp_secret — null until MFA is set up via POST /auth/mfa/setup
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "mfa_totp_secret" VARCHAR(64) NULL
    `);

    // Add mfa_enabled — defaults to false so all existing users are unaffected
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "mfa_enabled" BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // Index on mfa_enabled for fast filtering of MFA-enrolled users (admin dashboards)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_mfa_enabled"
      ON "users" ("mfa_enabled")
      WHERE "mfa_enabled" = TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_mfa_enabled"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "mfa_enabled"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "mfa_totp_secret"`);
  }
}
