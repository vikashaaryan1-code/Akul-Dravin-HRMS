import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddGovernanceProvenanceToAllEntities
 *
 * Adds `governance_provenance_hash` and `epistemic_confidence` to all
 * tables that inherit from BaseEntityWithTimestamps. This materializes
 * the forensic provenance binding into the persistence layer.
 *
 * These columns are:
 *  - governance_provenance_hash: SHA-256 hash of the governance epoch
 *  - epistemic_confidence: float [0.0-1.0] representing mutation certainty
 *
 * Both are nullable/defaulted so existing rows are unaffected.
 */
export class AddGovernanceProvenanceToAllEntities1747430000000 implements MigrationInterface {
  name = 'AddGovernanceProvenanceToAllEntities1747430000000';

  // All tables that extend BaseEntityWithTimestamps (not views/join tables)
  private readonly tables = [
    'employees',
    'users',
    'companies',
    'tenants',
    'payroll_batches',
    'payroll_items',
    'tasks',
    'projects',
    'loans',
    'attendance',
    'performances',
    'leave_requests',
    'leave_types',
    'leave_balances',
    'helpdesk_tickets',
    'vendors',
    'vendor_purchase_orders',
    'crm_leads',
    'crm_customers',
    'crm_interactions',
    'sales_leads',
    'sales_deals',
    'sales_targets',
    'sales_commissions',
    'invoices',
    'transactions',
    'wallets',
    'ledger_accounts',
    'ledger_entries',
    'ledger_transactions',
    'marketing_campaigns',
    'document_records',
    'notifications',
    'subscriptions',
    'automation_workflows',
    'audit_logs',
    'roles',
    'permissions',
    'refresh_tokens',
    'user_invitations',
    'login_histories',
    'recruitment_jobs',
    'recruitment_applications',
    'candidate_profiles',
    'career_growths',
    'marketplace_jobs',
    'marketplace_listings',
    'location_pings',
    'work_activities',
    'workday_summaries',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      // Check table exists before altering (defensive)
      const tableExists = await queryRunner.hasTable(table);
      if (!tableExists) continue;

      const hasHash = await queryRunner.hasColumn(table, 'governance_provenance_hash');
      if (!hasHash) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "governance_provenance_hash" VARCHAR(64)`,
        );
      }

      const hasConfidence = await queryRunner.hasColumn(table, 'epistemic_confidence');
      if (!hasConfidence) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "epistemic_confidence" FLOAT NOT NULL DEFAULT 1.0`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of this.tables) {
      const tableExists = await queryRunner.hasTable(table);
      if (!tableExists) continue;

      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "governance_provenance_hash"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "epistemic_confidence"`,
      );
    }
  }
}
