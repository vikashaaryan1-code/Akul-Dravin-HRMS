import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { TrialBalanceService } from './trial-balance.service';
import { LedgerAccountEntity, LedgerAccountType } from '../../database/entities/ledger-account.entity';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getRequiredTenantId: jest.fn().mockReturnValue('tenant-123'),
  },
}));

describe('TrialBalanceService', () => {
  let service: TrialBalanceService;
  let dataSourceMock: any;

  const mockAccounts: Partial<LedgerAccountEntity>[] = [
    { id: 'acc-1', code: 'CASH', name: 'Cash Account', type: LedgerAccountType.ASSET },
    { id: 'acc-2', code: 'REV', name: 'Revenue Account', type: LedgerAccountType.REVENUE },
    { id: 'acc-3', code: 'EXP', name: 'Expense Account', type: LedgerAccountType.EXPENSE },
  ];

  const mockAccountRepo = {
    find: jest.fn().mockResolvedValue(mockAccounts),
  };

  const createQueryBuilderMock = () => {
    let selectField = '';
    const qb: any = {
      select: jest.fn().mockImplementation((field: string) => {
        selectField = field;
        return qb;
      }),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockImplementation(() => {
        if (selectField.includes('debitAccountId')) {
          return Promise.resolve([
            { account_id: 'acc-1', total: '100.0000' },
            { account_id: 'acc-2', total: '100.0000' },
            { account_id: 'acc-3', total: '100.0000' },
          ]);
        }
        if (selectField.includes('creditAccountId')) {
          return Promise.resolve([
            { account_id: 'acc-1', total: '100.0000' },
            { account_id: 'acc-2', total: '100.0000' },
            { account_id: 'acc-3', total: '100.0000' },
          ]);
        }
        return Promise.resolve([]);
      }),
    };
    return qb;
  };

  beforeEach(async () => {
    const mockEntryRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() => createQueryBuilderMock()),
    };

    dataSourceMock = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === LedgerAccountEntity) return mockAccountRepo;
        if (entity === LedgerEntryEntity) return mockEntryRepo;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrialBalanceService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<TrialBalanceService>(TrialBalanceService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should generate trial balance report correctly using grouped queries', async () => {
    const report = await service.getReport();

    expect(report).toBeDefined();
    expect(report.items).toHaveLength(3);
    expect(report.isBalanced).toBe(true);
    expect(report.totalDebit).toBe('300.0000');
    expect(report.totalCredit).toBe('300.0000');
  });

  it('should handle asOfDate filter when provided', async () => {
    const asOfDate = new Date('2025-01-01');
    const report = await service.getReport(asOfDate);

    expect(report).toBeDefined();
    expect(report.items).toHaveLength(3);
  });

  it('should handle empty accounts gracefully', async () => {
    mockAccountRepo.find.mockResolvedValueOnce([]);
    const report = await service.getReport();

    expect(report.items).toHaveLength(0);
    expect(report.totalDebit).toBe('0.0000');
    expect(report.totalCredit).toBe('0.0000');
    expect(report.isBalanced).toBe(true);
  });
});
