import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddGoogleOAuthToUsers
 *
 * Adds Google OAuth and enhanced auth fields to the `users` table:
 *  - google_id         — unique Google sub-ID for OAuth users
 *  - oauth_provider    — 'email' | 'google' (defaults to 'email')
 *  - avatar_url        — profile picture URL from Google
 *  - email_verified    — whether the email was verified by the provider
 *  - password_reset_token — hashed token for forgot-password flow
 *  - password_reset_expires_at — expiry for the reset token
 *
 * password_hash is made nullable to support Google-only (passwordless) accounts.
 */
export class AddGoogleOAuthToUsers1747440000000 implements MigrationInterface {
  name = 'AddGoogleOAuthToUsers1747440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add google_id — unique nullable (only set for OAuth users)
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "oauth_provider" VARCHAR(32) NOT NULL DEFAULT 'email',
        ADD COLUMN IF NOT EXISTS "avatar_url" TEXT,
        ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "password_reset_token" VARCHAR(128),
        ADD COLUMN IF NOT EXISTS "password_reset_expires_at" TIMESTAMP WITH TIME ZONE
    `);

    // Make password_hash nullable so Google-only accounts work
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "password_hash" DROP NOT NULL
    `);

    // Unique index on google_id (partial — only for non-null rows)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_google_id"
        ON "users" ("google_id")
        WHERE "google_id" IS NOT NULL
    `);

    // Index for fast lookup by oauth_provider
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_oauth_provider"
        ON "users" ("oauth_provider")
    `);

    // Index for reset token lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_password_reset_token"
        ON "users" ("password_reset_token")
        WHERE "password_reset_token" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_password_reset_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_oauth_provider"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_google_id"`);

    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "password_reset_expires_at",
        DROP COLUMN IF EXISTS "password_reset_token",
        DROP COLUMN IF EXISTS "email_verified",
        DROP COLUMN IF EXISTS "avatar_url",
        DROP COLUMN IF EXISTS "oauth_provider",
        DROP COLUMN IF EXISTS "google_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "password_hash" SET NOT NULL
    `);
  }
}
