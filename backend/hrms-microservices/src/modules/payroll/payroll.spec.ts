import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import { LedgerService } from '../finance/ledger.service';
import { FinancialOutboxService } from '../finance/financial-outbox.service';
import { PerformanceManagementService } from '../performance-management/performance-management.service';
import { RedlockService } from '../../common/locks/redlock.service';
import { TransitionPolicyEngine } from '../../common/governance/transitions/transition-policy-engine';
import { TaxEngineService } from './tax-engine.service';
import { PayrollBatchEntity, PayrollBatchStatus } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('tenant-payroll-test'),
    getRequiredTenantId: jest.fn().mockReturnValue('tenant-payroll-test'),
    getRepository:       jest.fn(),
  },
}));
jest.mock('../../common/audit/audit-log.service');
jest.mock('../notification/notification.service');

import { TenantContext } from '../../common/context/tenant-context';
import { PayrollService } from './payroll.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { NotificationService } from '../notification/notification.service';

// ─── Mock repo factory ────────────────────────────────────────────────────────
const makeRepo = (data: Record<string, unknown>[] = []) => ({
  find:     jest.fn().mockResolvedValue(data),
  findOne:  jest.fn().mockImplementation(({ where }: any) =>
    Promise.resolve(data.find(d => d.id === where?.id) ?? null)),
  create:   jest.fn().mockImplementation((dto: any) => ({ id: 'new-id', ...dto })),
  save:     jest.fn().mockImplementation((e: any) => Promise.resolve({ ...e, id: e.id ?? 'new-id' })),
  update:   jest.fn().mockResolvedValue({ affected: 1 }),
  count:    jest.fn().mockResolvedValue(data.length),
});

const mockBatches = [
  { id: 'batch-1', periodLabel: 'May 2026', status: 'processing', totalEmployees: 45, totalGross: 4500000, tenantId: 'tenant-payroll-test' },
  { id: 'batch-2', periodLabel: 'Apr 2026', status: 'completed',  totalEmployees: 45, totalGross: 4350000, tenantId: 'tenant-payroll-test' },
];

const mockSlips = [
  { id: 'slip-1', batchId: 'batch-1', employeeId: 'emp-1', grossPay: 100000, netPay: 78000, tenantId: 'tenant-payroll-test' },
  { id: 'slip-2', batchId: 'batch-1', employeeId: 'emp-2', grossPay: 90000,  netPay: 70200, tenantId: 'tenant-payroll-test' },
];

describe('PayrollService', () => {
  let service: PayrollService;
  let batchRepo: ReturnType<typeof makeRepo>;
  let slipRepo:  ReturnType<typeof makeRepo>;
  let mockQueue: any;

  const mockDataSource = {
    getRepository: jest.fn().mockImplementation((entity) => {
      if (entity === PayrollBatchEntity) return batchRepo;
      if (entity === PayrollItemEntity) return slipRepo;
      return makeRepo();
    }),
    transaction: jest.fn().mockImplementation((cb) => cb({
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    })),
  };

  beforeEach(async () => {
    batchRepo = makeRepo(mockBatches);
    slipRepo  = makeRepo(mockSlips);
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0 }),
    };

    (TenantContext.getRepository as jest.Mock)
      .mockReturnValueOnce(batchRepo)   // Batch repo
      .mockReturnValue(slipRepo);       // Slip repo

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        { provide: DataSource,          useValue: mockDataSource },
        { provide: LedgerService,       useValue: { findTransactionByIdempotencyKey: jest.fn(), executeTransaction: jest.fn(), markAsSettlementPending: jest.fn(), ensureAllReconciled: jest.fn(), reverseTransaction: jest.fn() } },
        { provide: FinancialOutboxService, useValue: {} },
        { provide: PerformanceManagementService, useValue: {} },
        { provide: getQueueToken('payroll'), useValue: mockQueue },
        { provide: RedlockService,       useValue: { withLock: jest.fn().mockImplementation((key, ttl, cb) => cb()) } },
        { provide: TransitionPolicyEngine, useValue: { transition: jest.fn() } },
        { provide: TaxEngineService,      useValue: { calculateIndianTax: jest.fn().mockReturnValue({ grossSalary: '100000', deductions: { total: '22000', tds: '10000', pf: '12000', esi: '0', professionalTax: '0' }, netPayable: '78000', currency: 'INR', taxRegime: 'new' }) } },
        { provide: AuditLogService,     useValue: { log: jest.fn() } },
        { provide: NotificationService, useValue: { create: jest.fn(), enqueue: jest.fn() } },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getGlobalSummary ───────────────────────────────────────────────────────

  describe('getGlobalSummary()', () => {
    it('should return totalBatches from repo count', async () => {
      const result = await service.getGlobalSummary();
      expect(result).toHaveProperty('totalBatches');
      expect(result.totalBatches).toBe(2);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should return all batches', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('should return a batch by id', async () => {
      const result = await service.findOne('batch-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('batch-1');
    });
  });

  // ── enqueueBatch ───────────────────────────────────────────────────────────

  describe('enqueueBatch()', () => {
    it('should enqueue a payroll job and return jobId', async () => {
      const result = await service.enqueueBatch(2026, 6);
      expect(result).toBeDefined();
      expect(result.jobId).toBe('job-1');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'generate-batch',
        expect.objectContaining({ year: 2026, month: 6 }),
        expect.any(Object),
      );
    });
  });

  // ── findByEmployee ─────────────────────────────────────────────────────────

  describe('findByEmployee()', () => {
    it('should return payroll items for an employee', async () => {
      const result = await service.findByEmployee('emp-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });
});
