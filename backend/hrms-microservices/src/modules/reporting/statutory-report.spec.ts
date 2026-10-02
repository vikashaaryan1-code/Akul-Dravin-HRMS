import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { StatutoryReportService } from './statutory-report.service';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('tenant-123'),
    getRequiredTenantId: jest.fn().mockReturnValue('tenant-123'),
  },
}));

describe('StatutoryReportService', () => {
  let service: StatutoryReportService;

  const mockAccounts = [
    { id: 'acc-1', code: 'LIAB-TDS', name: 'TDS Liability' },
    { id: 'acc-2', code: 'LIAB-PF', name: 'PF Liability' },
    { id: 'acc-3', code: 'LIAB-ESI', name: 'ESI Liability' },
  ];

  const mockCreditAggregates = [
    { accountId: 'acc-1', openingCredit: '1000.0000', additions: '500.0000' },
    { accountId: 'acc-2', openingCredit: '2000.0000', additions: '800.0000' },
  ];

  const mockDebitAggregates = [
    { accountId: 'acc-1', openingDebit: '200.0000', payments: '400.0000' },
    { accountId: 'acc-2', openingDebit: '500.0000', payments: '1000.0000' },
  ];

  let setParameterCalls: Record<string, any> = {};

  const createQueryBuilderMock = (type: 'credit' | 'debit') => {
    const qb: any = {};
    qb.select = jest.fn().mockReturnThis();
    qb.addSelect = jest.fn().mockReturnThis();
    qb.where = jest.fn().mockReturnThis();
    qb.andWhere = jest.fn().mockReturnThis();
    qb.groupBy = jest.fn().mockReturnThis();
    qb.setParameter = jest.fn().mockImplementation((key, val) => {
      setParameterCalls[key] = val;
      return qb;
    });
    qb.getRawMany = jest.fn().mockResolvedValue(
      type === 'credit' ? mockCreditAggregates : mockDebitAggregates
    );
    return qb;
  };

  const mockLedgerEntryRepo = {
    createQueryBuilder: jest.fn((alias: string) => {
      return createQueryBuilderMock('credit');
    }),
  };

  const mockLedgerAccountRepo = {
    find: jest.fn().mockResolvedValue(mockAccounts),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockImplementation((entity: any) => {
      if (entity.name === 'LedgerAccountEntity') {
        return mockLedgerAccountRepo;
      }
      return mockLedgerEntryRepo;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    setParameterCalls = {};

    let callCount = 0;
    mockLedgerEntryRepo.createQueryBuilder.mockImplementation(() => {
      callCount++;
      return createQueryBuilderMock(callCount % 2 === 1 ? 'credit' : 'debit');
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatutoryReportService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<StatutoryReportService>(StatutoryReportService);
  });

  describe('getComplianceSummary', () => {
    it('should compute opening, additions, payments, and closing balances correctly using bulk aggregated queries', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await service.getComplianceSummary(startDate, endDate);

      expect(result).toHaveLength(3);

      // Account 1: TDS Liability
      expect(result[0]).toEqual({
        accountCode: 'LIAB-TDS',
        accountName: 'TDS Liability',
        openingBalance: '800.0000',
        additions: '500.0000',
        payments: '400.0000',
        closingBalance: '900.0000',
      });

      // Account 2: PF Liability
      expect(result[1]).toEqual({
        accountCode: 'LIAB-PF',
        accountName: 'PF Liability',
        openingBalance: '1500.0000',
        additions: '800.0000',
        payments: '1000.0000',
        closingBalance: '1300.0000',
      });

      // Account 3: ESI Liability (no entries)
      expect(result[2]).toEqual({
        accountCode: 'LIAB-ESI',
        accountName: 'ESI Liability',
        openingBalance: '0.0000',
        additions: '0.0000',
        payments: '0.0000',
        closingBalance: '0.0000',
      });

      // Verify QueryBuilder was invoked twice for credit and debit aggregates
      expect(mockLedgerEntryRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(setParameterCalls.startDate).toEqual(startDate);
    });

    it('should return empty array if no liability accounts are found', async () => {
      mockLedgerAccountRepo.find.mockResolvedValueOnce([]);

      const result = await service.getComplianceSummary(new Date(), new Date());

      expect(result).toEqual([]);
      expect(mockLedgerEntryRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
