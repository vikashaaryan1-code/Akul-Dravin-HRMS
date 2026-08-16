import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PayrollService } from '../payroll/payroll.service';
import { LoanService } from '../finance/loan.service';
import { FinanceService } from '../finance/finance.service';

// ─── Mock TenantContext ────────────────────────────────────────────────────────
const mockRepo = (dataArrayRef: { data: any[] }) => {
  const repo: any = {
    find: jest.fn().mockImplementation(() => Promise.resolve(dataArrayRef.data)),
    findOne: jest.fn().mockImplementation(({ where }: any) => {
      const item = dataArrayRef.data.find(d => d.id === where?.id);
      return Promise.resolve(item ?? null);
    }),
    count: jest.fn().mockImplementation(() => Promise.resolve(dataArrayRef.data.length)),
    create: jest.fn().mockImplementation((dto: any) => ({ id: 'new-id', ...dto })),
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
    remove: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    merge: jest.fn().mockImplementation((base: any, updates: any) => ({ ...base, ...updates })),
    findAndCount: jest.fn().mockImplementation(() => Promise.resolve([dataArrayRef.data, dataArrayRef.data.length])),
    createQueryBuilder: jest.fn().mockImplementation(() => {
      const builder: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockImplementation(async () => {
          const pendingLoans = dataArrayRef.data.filter(d => d.status === 'PENDING');
          const pendingCount = pendingLoans.length;
          const pendingAmount = pendingLoans.reduce((sum, l) => sum + Number(l.amount), 0);
          return {
            pending_count: pendingCount.toString(),
            pending_amount: pendingAmount.toString(),
          };
        }),
      };
      return builder;
    }),
  };
  return repo;
};

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';

// ─── LOAN SERVICE TESTS ───────────────────────────────────────────────────────

describe('LoanService', () => {
  const mockLoans = [
    { id: 'loan-1', amount: 50000, status: 'PENDING',  appliedAt: new Date() },
    { id: 'loan-2', amount: 30000, status: 'APPROVED', appliedAt: new Date() },
    { id: 'loan-3', amount: 20000, status: 'PENDING',  appliedAt: new Date() },
  ];

  let service: LoanService;
  let loansRef: { data: any[] };
  let repoMock: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    loansRef = { data: mockLoans.map(l => ({ ...l })) };
    repoMock = mockRepo(loansRef);
    (TenantContext.getRepository as jest.Mock).mockImplementation(() => repoMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoanService],
    }).compile();

    service = module.get<LoanService>(LoanService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll()', () => {
    it('should return all loans ordered by appliedAt DESC', async () => {
      const result = await service.findAll();
      expect(result).toEqual(mockLoans);
      expect(repoMock.find).toHaveBeenCalledWith({ order: { appliedAt: 'DESC' } });
    });
  });

  describe('findOne()', () => {
    it('should return a loan when found', async () => {
      const result = await service.findOne('loan-1');
      expect(result.id).toBe('loan-1');
    });

    it('should throw NotFoundException when loan not found', async () => {
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus()', () => {
    it('should update loan status to APPROVED', async () => {
      const result = await service.updateStatus('loan-1', 'APPROVED');
      expect(repoMock.save).toHaveBeenCalled();
      expect(result.status).toBe('APPROVED');
    });

    it('should update loan status to REJECTED', async () => {
      const result = await service.updateStatus('loan-1', 'REJECTED');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('getSummary()', () => {
    it('should compute correct pending loan summary', async () => {
      const summary = await service.getSummary();
      expect(summary.totalPendingCount).toBe(2);
      expect(summary.totalPendingAmount).toBe(70000);
      expect(summary.currency).toBe('INR');
    });

    it('should return 0 totals when no pending loans', async () => {
      loansRef.data = [
        { id: 'loan-a', amount: 10000, status: 'APPROVED', appliedAt: new Date() },
      ];
      const summary = await service.getSummary();
      expect(summary.totalPendingCount).toBe(0);
      expect(summary.totalPendingAmount).toBe(0);
    });
  });
});


// ─── FINANCE SERVICE TESTS ────────────────────────────────────────────────────

describe('FinanceService', () => {
  const mockInvoices = [
    { id: 'inv-1', amount: 100000, status: 'PAID',    createdAt: new Date() },
    { id: 'inv-2', amount:  50000, status: 'PENDING', createdAt: new Date() },
    { id: 'inv-3', amount:  75000, status: 'PAID',    createdAt: new Date() },
  ];
  const mockTransactions = [
    { id: 'tx-1', amount: 30000, type: 'DEBIT', createdAt: new Date() },
    { id: 'tx-2', amount: 20000, type: 'DEBIT', createdAt: new Date() },
  ];

  let service: FinanceService;
  let invoiceRepoMock: ReturnType<typeof mockRepo>;
  let txRepoMock: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    invoiceRepoMock = mockRepo({ data: mockInvoices.map(i => ({ ...i })) });
    txRepoMock      = mockRepo({ data: mockTransactions.map(t => ({ ...t })) });

    (TenantContext.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity?.name === 'TransactionEntity') return txRepoMock;
      return invoiceRepoMock;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [FinanceService],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getInvoices()', () => {
    it('should return invoices ordered by createdAt DESC', async () => {
      const result = await service.getInvoices();
      expect(result).toEqual(mockInvoices);
    });
  });

  describe('getSummary()', () => {
    it('should compute revenue, expenses, and GST correctly', async () => {
      const summary = await service.getSummary();

      expect(summary.totalRevenue).toBe(175000);           // 100k + 75k (PAID)
      expect(summary.receivables).toBe(50000);             // PENDING invoices
      expect(summary.totalExpenses).toBe(50000);           // 30k + 20k DEBIT
      expect(summary.gstPayable).toBe(Math.round(175000 * 0.18));
      expect(summary.operatingMarginPercent).toBeGreaterThan(0);
    });
  });
});
