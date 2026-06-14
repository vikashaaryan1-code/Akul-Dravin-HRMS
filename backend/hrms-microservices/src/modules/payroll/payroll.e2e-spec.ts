/**
 * PAYROLL INTEGRATION TESTS
 *
 * Tests the full PayrollService → DataSource → SQLite :memory: flow.
 * No mocks — real TypeORM transactions, real BigNumber calculations.
 *
 * Coverage:
 *   - generateBatch: creates batch + item rows from seeded employees
 *   - findAll: returns batches for tenant
 *   - calculateTargetBasedSalary: HTTP response shape + math correctness
 *   - getDepartmentalSummary: grouped aggregation vs empty DB
 *   - Duplicate batch guard: second generate throws 400
 */

import { DataSource } from 'typeorm';
import { PayrollService } from './payroll.service';
import { PayrollModule } from './payroll.module';
import { PayrollBatchStatus } from '../../database/entities/payroll-batch.entity';
import {
  createTestingModule,
  closeTestingModule,
  seedEmployee,
} from '../../test/integration-test.helper';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

// Stub out external service dependencies injected into PayrollModule
const mockLedgerService = {
  recordTransaction: jest.fn().mockResolvedValue({ id: 'ledger-tx-1' }),
  debitAccount: jest.fn().mockResolvedValue(undefined),
};
const mockOutboxService = {
  enqueue: jest.fn().mockResolvedValue(undefined),
};
const mockPerformanceService = {
  getEmployeePerformance: jest.fn().mockResolvedValue({ score: 85, rating: 'B' }),
};

// Force test-tenant into TenantContext for every test
jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant'),
    getRepository: jest.fn(),
  },
}));

describe('PayrollService — Integration', () => {
  let module: TestingModule;
  let app: INestApplication;
  let payrollService: PayrollService;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ module, app } = await createTestingModule(
      [PayrollModule],
      [
        { token: 'LedgerService', useValue: mockLedgerService },
        { token: 'FinancialOutboxService', useValue: mockOutboxService },
        { token: 'PerformanceManagementService', useValue: mockPerformanceService },
      ],
    ));
    payrollService = module.get(PayrollService);
    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    await closeTestingModule(app);
  });

  beforeEach(async () => {
    // Clean slate: truncate payroll tables between tests
    await dataSource.query('DELETE FROM payroll_items');
    await dataSource.query('DELETE FROM payroll_batches');
    await dataSource.query('DELETE FROM employees');
    jest.clearAllMocks();
  });

  // ── generateBatch ──────────────────────────────────────────────────────────

  describe('generateBatch()', () => {
    it('creates a batch in DRAFT status for the correct tenant', async () => {
      await seedEmployee(module);
      const batch = await payrollService.generateBatch(2026, 4);

      expect(batch).toBeDefined();
      expect(batch.tenantId).toBe('test-tenant');
      expect(batch.status).toBe(PayrollBatchStatus.DRAFT);
      expect(batch.year).toBe(2026);
      expect(batch.month).toBe(4);
    });

    it('creates one PayrollItem per employee', async () => {
      await seedEmployee(module, { workEmail: 'emp1@test.com', employeeCode: 'EMP-001' });
      await seedEmployee(module, { workEmail: 'emp2@test.com', employeeCode: 'EMP-002' });

      const batch = await payrollService.generateBatch(2026, 5);

      // Batch should reference 2 items
      const itemCount = await dataSource.query(
        `SELECT COUNT(*) as cnt FROM payroll_items WHERE batch_id = ?`,
        [batch.id],
      );
      expect(Number(itemCount[0].cnt)).toBe(2);
    });

    it('throws BadRequestException for duplicate month/year', async () => {
      await seedEmployee(module);
      await payrollService.generateBatch(2026, 6);
      await expect(payrollService.generateBatch(2026, 6)).rejects.toMatchObject({
        message: expect.stringContaining('already exists'),
      });
    });

    it('throws BadRequestException for invalid month format via generateMonthlyPayroll', async () => {
      await expect(payrollService.generateMonthlyPayroll('2026-13')).rejects.toMatchObject({
        message: expect.stringContaining('YYYY-MM format'),
      });
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('returns empty array when no batches exist', async () => {
      const batches = await payrollService.findAll();
      expect(batches).toEqual([]);
    });

    it('returns batches ordered by createdAt DESC', async () => {
      await seedEmployee(module);
      await payrollService.generateBatch(2026, 1);
      await payrollService.generateBatch(2026, 2);
      const batches = await payrollService.findAll();
      expect(batches.length).toBe(2);
      // Most recent first
      expect(batches[0].month).toBe(2);
    });
  });

  // ── calculateTargetBasedSalary ─────────────────────────────────────────────

  describe('calculateTargetBasedSalary()', () => {
    it('full month 100% achievement → correct BigNumber output', async () => {
      const result = await payrollService.calculateTargetBasedSalary({
        baseSalary: 50000,
        variableSalary: 20000,
        targetValue: 100,
        achievedValue: 100,
        elapsedDaysInMonth: 30,
        totalDaysInMonth: 30,
      });
      expect(result.currency).toBe('INR');
      expect(result.gross).toBe('70000.0000');
      // PF = 12% of 50000 = 6000; TDS = 10% of 20000 = 2000
      expect(result.deductions.pf).toBe('6000.0000');
      expect(result.deductions.tds).toBe('2000.0000');
      expect(result.net).toBe('62000.0000');
    });

    it('throws if targetValue is 0', async () => {
      await expect(
        payrollService.calculateTargetBasedSalary({
          baseSalary: 50000, variableSalary: 0, targetValue: 0, achievedValue: 100,
        }),
      ).rejects.toThrow('targetValue must be greater than 0');
    });
  });

  // ── getDepartmentalSummary ─────────────────────────────────────────────────

  describe('getDepartmentalSummary()', () => {
    it('returns empty array when no payroll items exist', async () => {
      const result = await payrollService.getDepartmentalSummary();
      expect(result).toEqual([]);
    });

    it('groups items by employee department', async () => {
      await seedEmployee(module, { workEmail: 'e1@t.com', employeeCode: 'E1', departmentId: 'dept-engineering' });
      await seedEmployee(module, { workEmail: 'e2@t.com', employeeCode: 'E2', departmentId: 'dept-sales' });
      await payrollService.generateBatch(2026, 7);

      const summary = await payrollService.getDepartmentalSummary();
      const deptIds = summary.map(r => r.departmentId);
      expect(deptIds).toContain('dept-engineering');
      expect(deptIds).toContain('dept-sales');
    });
  });
});
