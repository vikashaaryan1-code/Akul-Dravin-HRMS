import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ReportingService } from './reporting.service';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';

const mockTenantId = '00000000-0000-0000-0000-000000000001';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('00000000-0000-0000-0000-000000000001'),
    getRequiredTenantId: jest.fn().mockReturnValue('00000000-0000-0000-0000-000000000001'),
  },
}));

describe('ReportingService', () => {
  let service: ReportingService;
  let dataSource: jest.Mocked<DataSource>;
  let mockAccountRepo: any;
  let mockEntryRepo: any;

  beforeEach(async () => {
    mockAccountRepo = {
      find: jest.fn(),
    };

    mockEntryRepo = {
      createQueryBuilder: jest.fn(),
    };

    dataSource = {
      getRepository: jest.fn((entity: any) => {
        if (entity === LedgerAccountEntity) return mockAccountRepo;
        if (entity === LedgerEntryEntity) return mockEntryRepo;
        throw new Error(`Unexpected entity: ${entity.name}`);
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTrialBalance', () => {
    it('should calculate trial balance correctly with balanced ledger accounts', async () => {
      const mockAccounts = [
        {
          id: 'acc-cash',
          code: '1000',
          name: 'Cash',
          type: LedgerAccountType.ASSET,
          tenantId: mockTenantId,
          isActive: true,
        },
        {
          id: 'acc-equity',
          code: '3000',
          name: 'Owner Equity',
          type: LedgerAccountType.EQUITY,
          tenantId: mockTenantId,
          isActive: true,
        },
      ];

      mockAccountRepo.find.mockResolvedValue(mockAccounts);

      // Grouped debits: Cash received 500.0000
      const debitQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { accountId: 'acc-cash', total: '500.0000' },
        ]),
      };

      // Grouped credits: Equity credited 500.0000
      const creditQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { accountId: 'acc-equity', total: '500.0000' },
        ]),
      };

      mockEntryRepo.createQueryBuilder
        .mockReturnValueOnce(debitQb)
        .mockReturnValueOnce(creditQb);

      const result = await service.getTrialBalance();

      expect(result.isBalanced).toBe(true);
      expect(result.totalDebits).toBe('500.0000');
      expect(result.totalCredits).toBe('500.0000');
      expect(result.items).toHaveLength(2);

      // Asset: Normal balance is Debit - Credit -> 500 - 0 = 500
      const cashItem = result.items.find((i) => i.accountCode === '1000');
      expect(cashItem).toBeDefined();
      expect(cashItem?.debitTotal).toBe('500.0000');
      expect(cashItem?.creditTotal).toBe('0.0000');
      expect(cashItem?.closingBalance).toBe('500.0000');

      // Equity: Normal balance is Credit - Debit -> 500 - 0 = 500
      const equityItem = result.items.find((i) => i.accountCode === '3000');
      expect(equityItem).toBeDefined();
      expect(equityItem?.debitTotal).toBe('0.0000');
      expect(equityItem?.creditTotal).toBe('500.0000');
      expect(equityItem?.closingBalance).toBe('500.0000');

      // Only 2 aggregation query builder instances created (constant O(1) database queries)
      expect(mockEntryRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('should detect unbalanced trial balance and report false', async () => {
      const mockAccounts = [
        {
          id: 'acc-expense',
          code: '5000',
          name: 'Office Expense',
          type: LedgerAccountType.EXPENSE,
          tenantId: mockTenantId,
          isActive: true,
        },
      ];

      mockAccountRepo.find.mockResolvedValue(mockAccounts);

      const debitQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { accountId: 'acc-expense', total: '150.0000' },
        ]),
      };

      const creditQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockEntryRepo.createQueryBuilder
        .mockReturnValueOnce(debitQb)
        .mockReturnValueOnce(creditQb);

      const result = await service.getTrialBalance();

      expect(result.isBalanced).toBe(false);
      expect(result.totalDebits).toBe('150.0000');
      expect(result.totalCredits).toBe('0.0000');
    });

    it('should handle accounts with zero transactions gracefully', async () => {
      const mockAccounts = [
        {
          id: 'acc-inactive',
          code: '1001',
          name: 'Inactive Reserve',
          type: LedgerAccountType.ASSET,
          tenantId: mockTenantId,
          isActive: true,
        },
      ];

      mockAccountRepo.find.mockResolvedValue(mockAccounts);

      const debitQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      const creditQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockEntryRepo.createQueryBuilder
        .mockReturnValueOnce(debitQb)
        .mockReturnValueOnce(creditQb);

      const result = await service.getTrialBalance();

      expect(result.isBalanced).toBe(true);
      expect(result.totalDebits).toBe('0.0000');
      expect(result.totalCredits).toBe('0.0000');
      expect(result.items[0].debitTotal).toBe('0.0000');
      expect(result.items[0].creditTotal).toBe('0.0000');
      expect(result.items[0].closingBalance).toBe('0.0000');
    });
  });

  describe('getLiabilityReport', () => {
    it('should correctly calculate obligations for liability accounts using credit - debit', async () => {
      const mockLiabilities = [
        {
          id: 'acc-tds',
          code: 'LIAB-TDS',
          name: 'TDS Payable',
          type: LedgerAccountType.LIABILITY,
          tenantId: mockTenantId,
          isActive: true,
        },
        {
          id: 'acc-pf',
          code: 'LIAB-PF',
          name: 'PF Payable',
          type: LedgerAccountType.LIABILITY,
          tenantId: mockTenantId,
          isActive: true,
        },
      ];

      mockAccountRepo.find.mockResolvedValue(mockLiabilities);

      // TDS: credit 1000, debit 200 -> obligation = 800
      // PF: credit 500, debit 500 -> obligation = 0
      const debitQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { accountId: 'acc-tds', total: '200.0000' },
          { accountId: 'acc-pf', total: '500.0000' },
        ]),
      };

      const creditQb: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { accountId: 'acc-tds', total: '1000.0000' },
          { accountId: 'acc-pf', total: '500.0000' },
        ]),
      };

      mockEntryRepo.createQueryBuilder
        .mockReturnValueOnce(debitQb)
        .mockReturnValueOnce(creditQb);

      const report = await service.getLiabilityReport();

      expect(report).toHaveLength(2);
      const tdsReport = report.find((r: any) => r.accountCode === 'LIAB-TDS');
      expect(tdsReport).toBeDefined();
      expect(tdsReport.totalObligation).toBe('800.0000');

      const pfReport = report.find((r: any) => r.accountCode === 'LIAB-PF');
      expect(pfReport).toBeDefined();
      expect(pfReport.totalObligation).toBe('0.0000');

      // Constant 2 aggregation query builder instances used
      expect(mockEntryRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });
});
