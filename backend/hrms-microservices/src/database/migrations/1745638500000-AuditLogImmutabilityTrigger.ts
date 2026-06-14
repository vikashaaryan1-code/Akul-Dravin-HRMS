import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Audit Log Immutability Trigger
 *
 * Enforces physical immutability of the `audit_logs` table at the Postgres level.
 * Previously the "append-only" contract was a code convention; this migration makes it
 * a hard database constraint.
 *
 * Effect: any attempt to UPDATE or DELETE a row in `audit_logs` will raise an exception:
 *   ERROR: audit_logs is an immutable append-only table; UPDATE/DELETE are not permitted
 *
 * This satisfies HR-grade compliance requirements (SOC 2, ISO 27001).
 *
 * Safe to apply on live table — no schema change, no row mutations.
 * Rollback: drops trigger and function cleanly.
 */
export class AuditLogImmutabilityTrigger1745638500000 implements MigrationInterface {
  public readonly name = 'AuditLogImmutabilityTrigger1745638500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the guard function first
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION fn_audit_logs_immutable()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION
          'audit_logs is an immutable append-only table; UPDATE/DELETE are not permitted. '
          'Action: %, Row ID: %', TG_OP, OLD.id;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Attach the trigger — fires BEFORE any UPDATE or DELETE
    await queryRunner.query(`
      CREATE TRIGGER trg_audit_logs_immutable
      BEFORE UPDATE OR DELETE ON audit_logs
      FOR EACH ROW EXECUTE FUNCTION fn_audit_logs_immutable();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS fn_audit_logs_immutable()`);
  }
}
