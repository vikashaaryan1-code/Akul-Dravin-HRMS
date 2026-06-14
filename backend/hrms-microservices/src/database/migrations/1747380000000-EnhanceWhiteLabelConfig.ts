import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Enhance White Label Config
 *
 * Adds:
 *  - pricing_control JSONB  — reseller plan + pricing overrides
 *  - entitlements    JSONB  — module access, caps, AI/API flags
 *  - parent_tenant_id UUID  — reseller hierarchy
 *  - domain_verified BOOL   — DNS verification status
 *  - employee_count  INT    — cached for partner dashboard
 */
export class EnhanceWhiteLabelConfig1747380000000 implements MigrationInterface {
  name = 'EnhanceWhiteLabelConfig1747380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE white_label_configs
        ADD COLUMN IF NOT EXISTS pricing_control  JSONB    NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS entitlements      JSONB    NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS parent_tenant_id  UUID,
        ADD COLUMN IF NOT EXISTS domain_verified   BOOLEAN  NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS employee_count    INTEGER  NOT NULL DEFAULT 0
    `);

    // Index for parent→child reseller lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_wlc_parent_tenant
        ON white_label_configs (parent_tenant_id)
        WHERE parent_tenant_id IS NOT NULL
    `);

    // Index for custom domain resolution (middleware hot path)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_wlc_custom_domain
        ON white_label_configs (custom_domain)
        WHERE custom_domain IS NOT NULL
    `);

    // Backfill default entitlements for existing records
    await queryRunner.query(`
      UPDATE white_label_configs
      SET entitlements = '{
        "maxEmployees": 25,
        "maxRecruiters": 2,
        "maxJobPostings": 5,
        "allowedModules": ["employees","attendance","leave","payroll","documents"],
        "analyticsRetentionDays": 90,
        "aiEnabled": false,
        "customDomainEnabled": false,
        "whiteLabeled": false,
        "apiAccessEnabled": false
      }'
      WHERE entitlements = '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlc_custom_domain`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_wlc_parent_tenant`);

    await queryRunner.query(`
      ALTER TABLE white_label_configs
        DROP COLUMN IF EXISTS pricing_control,
        DROP COLUMN IF EXISTS entitlements,
        DROP COLUMN IF EXISTS parent_tenant_id,
        DROP COLUMN IF EXISTS domain_verified,
        DROP COLUMN IF EXISTS employee_count
    `);
  }
}
