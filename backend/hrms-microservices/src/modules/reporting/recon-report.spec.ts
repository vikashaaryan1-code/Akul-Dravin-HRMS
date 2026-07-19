import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ReconReportService } from './recon-report.service';
import { LedgerEntryEntity } from '../../database/entities/ledger-entry.entity';
import { ExternalTransactionEntity, ReconciliationStatus } from '../../database/entities/external-transaction.entity';

// Mock TenantContext
jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
  },
}));

describe('ReconReportService', () => {
  let service: ReconReportService;
  let dataSourceMock: any;
  let ledgerRepoMock: any;
  let externalRepoMock: any;

  // QueryBuilder mocks for the upcoming optimization
  let selectMock: any;
  let addSelectMock: any;
  let whereMock: any;
  let andWhereMock: any;
  let setParametersMock: any;
  let getRawOneMock: any;

  beforeEach(async () => {
    // 1. Mock LedgerEntry repository
    ledgerRepoMock = {
      find: jest.fn(),
    };

    // 2. Mock QueryBuilder helper methods
    selectMock = jest.fn().mockReturnThis();
    addSelectMock = jest.fn().mockReturnThis();
    whereMock = jest.fn().mockReturnThis();
    andWhereMock = jest.fn().mockReturnThis();
    setParametersMock = jest.fn().mockReturnThis();
    getRawOneMock = jest.fn();

    const qbMock = {
      select: selectMock,
      addSelect: addSelectMock,
      where: whereMock,
      andWhere: andWhereMock,
      setParameters: setParametersMock,
      getRawOne: getRawOneMock,
    };

    // 3. Mock ExternalTransaction repository
    externalRepoMock = {
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    // 4. Mock DataSource
    dataSourceMock = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === LedgerEntryEntity) {
          return ledgerRepoMock;
        }
        if (entity === ExternalTransactionEntity) {
          return externalRepoMock;
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconReportService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<ReconReportService>(ReconReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReconReport()', () => {
    it('should filter entries by date range and reconcile matching external evidence', async () => {
      const startDate = new Date('2026-01-01T00:00:00Z');
      const endDate = new Date('2026-01-31T23:59:59Z');

      const mockLedgerEntries = [
        {
          createdAt: new Date('2025-12-31T23:00:00Z'), // Outside range (before)
          description: 'Too early',
          amount: '100.0000',
          transaction: { reference: 'REF-1' },
        },
        {
          createdAt: new Date('2026-01-15T12:00:00Z'), // Matches, reconciled
          description: 'Internal Entry A',
          amount: '500.0000',
          transaction: { reference: 'REF-A' },
        },
        {
          createdAt: new Date('2026-01-20T12:00:00Z'), // Matches, unmatched
          description: 'Internal Entry B',
          amount: '200.0000',
          transaction: { reference: 'REF-B' },
        },
        {
          createdAt: new Date('2026-02-01T01:00:00Z'), // Outside range (after)
          description: 'Too late',
          amount: '300.0000',
          transaction: { reference: 'REF-3' },
        },
      ];

      const mockExternalTxs = [
        {
          externalReferenceId: 'REF-A',
          amount: '500.0000',
        },
        {
          externalReferenceId: 'REF-OTHER',
          amount: '999.0000',
        },
      ];

      ledgerRepoMock.find.mockResolvedValue(mockLedgerEntries);
      externalRepoMock.find.mockResolvedValue(mockExternalTxs);

      const result = await service.getReconReport('bank-account-123', startDate, endDate);

      // Only 2 entries are within range
      expect(result).toHaveLength(2);

      // Entry A (Reconciled)
      expect(result[0]).toEqual({
        date: mockLedgerEntries[1].createdAt,
        description: 'Internal Entry A',
        internalAmount: '500.0000',
        externalAmount: '500.0000',
        difference: '0.0000',
        status: 'RECONCILED',
      });

      // Entry B (Unmatched)
      expect(result[1]).toEqual({
        date: mockLedgerEntries[2].createdAt,
        description: 'Internal Entry B',
        internalAmount: '200.0000',
        externalAmount: '0.0000',
        difference: '200.0000',
        status: 'UNMATCHED',
      });

      expect(ledgerRepoMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { tenantId: 'test-tenant-id', debitAccountId: 'bank-account-123' },
            { tenantId: 'test-tenant-id', creditAccountId: 'bank-account-123' },
          ],
        }),
      );
    });
  });

  describe('getAnomalySummary()', () => {
    it('should aggregate unmatched counts, mismatch counts, and retrieve the latest matched timestamp using the single-query builder optimization', async () => {
      // Mock the query builder's raw result
      getRawOneMock.mockResolvedValue({
        unmatchedCount: '5',
        mismatchCount: '3',
        lastMatchedDate: '2026-07-15T10:30:00.000Z',
      });

      const summary = await service.getAnomalySummary();

      expect(summary.pendingExternalCount).toBe(5);
      expect(summary.anomalies).toHaveLength(3);
      expect(summary.anomalies[0]).toEqual({ type: 'AMOUNT_MISMATCH', id: 'ANOMALY-0' });
      expect(summary.lastReconciledAt).toEqual(new Date('2026-07-15T10:30:00.000Z'));

      // Verify that query builder is used with correct selects and parameters
      expect(externalRepoMock.createQueryBuilder).toHaveBeenCalledWith('et');
      expect(selectMock).toHaveBeenCalledWith(
        "SUM(CASE WHEN et.reconciliationStatus = :unmatchedStatus THEN 1 ELSE 0 END)",
        'unmatchedCount'
      );
      expect(addSelectMock).toHaveBeenCalledWith(
        "SUM(CASE WHEN et.reconciliationStatus = :mismatchStatus THEN 1 ELSE 0 END)",
        'mismatchCount'
      );
      expect(addSelectMock).toHaveBeenCalledWith(
        "MAX(CASE WHEN et.reconciliationStatus = :matchedStatus THEN et.eventDate ELSE NULL END)",
        'lastMatchedDate'
      );
      expect(setParametersMock).toHaveBeenCalledWith({
        unmatchedStatus: 'UNMATCHED',
        mismatchStatus: 'MISMATCH',
        matchedStatus: 'MATCHED',
      });
    });

    it('should handle missing lastReconciledAt correctly when there are no matched events', async () => {
      getRawOneMock.mockResolvedValue({
        unmatchedCount: '0',
        mismatchCount: '0',
        lastMatchedDate: null,
      });

      const summary = await service.getAnomalySummary();

      expect(summary.pendingExternalCount).toBe(0);
      expect(summary.anomalies).toHaveLength(0);
      expect(summary.lastReconciledAt).toBeNull();
    });
  });
});
