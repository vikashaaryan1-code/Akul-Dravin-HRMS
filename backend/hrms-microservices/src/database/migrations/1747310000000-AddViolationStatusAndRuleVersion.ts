import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Add ViolationStatus lifecycle + ruleVersion to governance_violation_log
 *
 * Adds 4 columns to the existing governance_violation_log table:
 *
 *   status           ENUM(ACTIVE|SUPPRESSED|ACCEPTED|RESOLVED)  DEFAULT 'ACTIVE'
 *   suppressed_until TIMESTAMPTZ NULL  — expiry for SUPPRESSED violations
 *   suppressed_by    VARCHAR(36) NULL  — actor who suppressed
 *   rule_version     VARCHAR(10) DEFAULT '1'  — fingerprint stability field
 *
 * Existing rows (if any) are assigned status='ACTIVE' and rule_version='1'
 * via the column DEFAULT values — no data migration needed.
 *
 * Fingerprint backward compatibility:
 *   The original computeViolationFingerprint() used:
 *     hash(`${ruleId}:${filePath}:${line}:${pattern}`)
 *   The new version uses:
 *     hash(`${ruleId}:${normalizedPath}:${line}:${pattern}:v${ruleVersion}`)
 *   with ruleVersion='1'.
 *
 *   These produce DIFFERENT hashes. If violations were already persisted with old
 *   fingerprints, they will not deduplicate with new-format fingerprints.
 *   Resolution: run `npm run governance:baseline` after this migration to capture
 *   current state, then let the scanner regenerate fingerprints on the next CI run.
 *
 *   This is intentional: rule_version='1' signals "this fingerprint was computed
 *   with the stable v1 algorithm" — future algorithm changes bump to '2'.
 */
export class AddViolationStatusAndRuleVersion1747310000000 implements MigrationInterface {
  name = 'AddViolationStatusAndRuleVersion1747310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the violation_status_enum type (if not already present)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'violation_status_enum') THEN
          CREATE TYPE violation_status_enum AS ENUM ('ACTIVE', 'SUPPRESSED', 'ACCEPTED', 'RESOLVED');
        END IF;
      END $$;
    `);

    // Add status column with ACTIVE default — all existing rows become ACTIVE
    await queryRunner.query(`
      ALTER TABLE governance_violation_log
        ADD COLUMN IF NOT EXISTS status violation_status_enum NOT NULL DEFAULT 'ACTIVE';
    `);

    // Add suppression lifecycle columns
    await queryRunner.query(`
      ALTER TABLE governance_violation_log
        ADD COLUMN IF NOT EXISTS suppressed_until TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS suppressed_by    VARCHAR(36);
    `);

    // Add rule_version column — default '1' for all existing rows
    await queryRunner.query(`
      ALTER TABLE governance_violation_log
        ADD COLUMN IF NOT EXISTS rule_version VARCHAR(10) NOT NULL DEFAULT '1';
    `);

    // Index: status + occurred_at for dashboard "show all ACTIVE violations in last 7 days"
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_status_time
        ON governance_violation_log (status, occurred_at);
    `);

    // Partial index: active fingerprinted violations only — chronic violation dashboard
    // Replaces the plain occurrence_count index from the original migration with a
    // status-scoped version that correctly excludes RESOLVED/ACCEPTED from chronic reports.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_chronic_active
        ON governance_violation_log (occurrence_count DESC, last_seen_at)
        WHERE fingerprint IS NOT NULL AND status = 'ACTIVE';
    `);

    // Index: suppressed violations due for reactivation (cron job support)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_viol_suppressed_expiry
        ON governance_violation_log (suppressed_until)
        WHERE status = 'SUPPRESSED' AND suppressed_until IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_viol_suppressed_expiry;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_viol_chronic_active;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_viol_status_time;`);

    await queryRunner.query(`
      ALTER TABLE governance_violation_log
        DROP COLUMN IF EXISTS rule_version,
        DROP COLUMN IF EXISTS suppressed_by,
        DROP COLUMN IF EXISTS suppressed_until,
        DROP COLUMN IF EXISTS status;
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS violation_status_enum;`);
  }
}
