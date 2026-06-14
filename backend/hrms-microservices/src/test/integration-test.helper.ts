import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { INestApplication, ValidationPipe } from '@nestjs/common';

// ── Entities (add any new entities here when you add integration test suites) ──
import { PayrollBatchEntity } from '../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../database/entities/payroll-item.entity';
import { EmployeeEntity } from '../database/entities/employee.entity';
import { AttendanceEntity } from '../database/entities/attendance.entity';
import { BankFileArtifactEntity } from '../database/entities/bank-file-artifact.entity';
import { A2zWorkflowEntity, A2zRolloutRequestEntity } from '../database/entities/a2z-engine.entities';
import { LedgerTransactionEntity } from '../database/entities/ledger-transaction.entity';
import { ExternalTransactionEntity } from '../database/entities/external-transaction.entity';
import { ForensicAuditEntity } from '../database/entities/forensic-audit.entity';

/**
 * ALL ENTITIES used by any integration test suite.
 * SQLite :memory: schema is synchronised from these at test startup.
 * ADD new entities here before writing a test that touches them.
 */
export const TEST_ENTITIES = [
  PayrollBatchEntity,
  PayrollItemEntity,
  EmployeeEntity,
  AttendanceEntity,
  BankFileArtifactEntity,
  A2zWorkflowEntity,
  A2zRolloutRequestEntity,
  LedgerTransactionEntity,
  ExternalTransactionEntity,
  ForensicAuditEntity,
];

/**
 * SQLite (sqljs) TypeORM config for integration tests.
 * Uses sql.js — pure JavaScript SQLite, zero native compilation required.
 * Works on Windows without Visual Studio or node-gyp.
 * - dropSchema: true  → each test module gets a clean slate
 * - synchronize: true → infers schema from entities (no migration needed)
 */
export const sqliteTestDataSourceOptions = {
  type: 'sqljs' as const,
  autoSave: false,
  location: ':memory:',
  dropSchema: true,
  entities: TEST_ENTITIES,
  synchronize: true,
};

/**
 * createTestingModule — builds a NestJS TestingModule wired to an in-memory SQLite DB.
 *
 * Usage:
 *   const { module, app } = await createTestingModule([SomeModule]);
 *   const svc = module.get(SomeService);
 *
 * @param modules  Array of feature modules to import (e.g. [PayrollModule])
 * @param overrides Optional array of provider overrides (e.g. stub services)
 */
export async function createTestingModule(
  modules: any[],
  overrides: Array<{ token: any; useValue: any }> = [],
): Promise<{ module: TestingModule; app: INestApplication }> {
  let builder = Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot(sqliteTestDataSourceOptions),
      ...modules,
    ],
  });

  for (const override of overrides) {
    builder = builder.overrideProvider(override.token).useValue(override.useValue);
  }

  const module = await builder.compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  await app.init();
  return { module, app };
}

/**
 * closeTestingModule — gracefully closes app and DB connection after each suite.
 * Call in afterAll() to prevent open handle warnings.
 */
export async function closeTestingModule(app: INestApplication): Promise<void> {
  await app.close();
}

/**
 * seedEmployee — creates a minimal EmployeeEntity in the test DB.
 * Pass the TestingModule to get the repository, then call this helper.
 */
export async function seedEmployee(
  module: TestingModule,
  overrides: Partial<EmployeeEntity> = {},
): Promise<EmployeeEntity> {
  const repo = module.get(getRepositoryToken(EmployeeEntity));
  const emp = repo.create({
    tenantId: 'test-tenant',
    companyId: 'test-company',
    firstName: 'Test',
    lastName: 'Employee',
    workEmail: `test-${Date.now()}@example.com`,
    employeeCode: `EMP-${Date.now()}`,
    departmentId: 'dept-engineering',
    position: 'Engineer',
    status: 'active',
    ...overrides,
  });
  return repo.save(emp);
}
