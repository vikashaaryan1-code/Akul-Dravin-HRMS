import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Phase 6 Auth Hardening
 * Adds: refresh_tokens, login_history, totp_secrets, user_sessions
 * Safe to run on existing DB — all IF NOT EXISTS
 */
export class AddPhase6AuthHardening1747100000000 implements MigrationInterface {
  name = 'AddPhase6AuthHardening1747100000000';

  async up(qr: QueryRunner): Promise<void> {
    // ── Refresh Tokens ──────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash     VARCHAR(64) NOT NULL UNIQUE,
        user_id        UUID NOT NULL,
        tenant_id      UUID,
        device_id      VARCHAR(128),
        device_name    VARCHAR(200),
        ip_address     VARCHAR(45),
        user_agent     TEXT,
        is_revoked     BOOLEAN NOT NULL DEFAULT FALSE,
        family_id      UUID NOT NULL,
        rotation_count INT NOT NULL DEFAULT 0,
        expires_at     TIMESTAMPTZ NOT NULL,
        last_used_at   TIMESTAMPTZ,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_rt_user_tenant ON refresh_tokens(user_id, tenant_id);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_rt_family ON refresh_tokens(family_id);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_rt_expires ON refresh_tokens(expires_at);`);

    // ── Login History ───────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          UUID NOT NULL,
        tenant_id        UUID,
        event_type       VARCHAR(30) NOT NULL,
        ip_address       VARCHAR(45),
        user_agent       TEXT,
        device_name      VARCHAR(200),
        location_country VARCHAR(60),
        failure_reason   VARCHAR(200),
        session_id       VARCHAR(128),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_lh_user_time ON login_history(user_id, created_at DESC);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_lh_ip ON login_history(ip_address);`);

    // ── TOTP Secrets (2FA) ───────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS totp_secrets (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL UNIQUE,
        secret_enc    TEXT NOT NULL,
        is_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
        backup_codes  JSONB,
        verified_at   TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_totp_user ON totp_secrets(user_id);`);

    // ── Active Sessions ──────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL,
        tenant_id     UUID,
        session_token VARCHAR(64) NOT NULL UNIQUE,
        device_id     VARCHAR(128),
        device_name   VARCHAR(200),
        ip_address    VARCHAR(45),
        user_agent    TEXT,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at    TIMESTAMPTZ NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_us_user ON user_sessions(user_id, is_active);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_us_expires ON user_sessions(expires_at);`);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS user_sessions;`);
    await qr.query(`DROP TABLE IF EXISTS totp_secrets;`);
    await qr.query(`DROP TABLE IF EXISTS login_history;`);
    await qr.query(`DROP TABLE IF EXISTS refresh_tokens;`);
  }
}
