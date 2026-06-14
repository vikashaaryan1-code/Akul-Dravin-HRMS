import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add user_id to employees table
 *
 * Creates a nullable FK-style link between the auth `users` table and the
 * `employees` table. This enables JWT-authenticated employees to look up
 * their own payslip items via GET /payroll/me/payslips without needing to
 * know their employeeId.
 *
 * Design decisions:
 *  - NULLABLE: existing employee rows are unaffected; backfill is optional.
 *  - No FK constraint: avoids cascade complexity across tenant boundaries.
 *  - Indexed: (tenant_id, user_id) for fast JWT lookup in payroll queries.
 *
 * Non-breaking: all existing employee operations continue unchanged.
 */
export class AddUserIdToEmployees1745638600000 implements MigrationInterface {
  public readonly name = 'AddUserIdToEmployees1745638600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employees"
      ADD COLUMN IF NOT EXISTS "user_id" UUID NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_employees_tenant_user"
      ON "employees" ("tenant_id", "user_id")
      WHERE "user_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_tenant_user"`);
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "user_id"`);
  }
}
