import { Test, TestingModule } from '@nestjs/testing';
import { ForensicAdvisoryService } from './forensic-advisory.service';
import { TenantContext } from '../../common/context/tenant-context';
import { PayrollBatchStatus } from '../../database/entities/payroll-batch.entity';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository: jest.fn(),
  },
}));

describe('ForensicAdvisoryService', () => {
  let service: ForensicAdvisoryService;
  let mockQueryBuilder: any;
  let mockExternalTxRepo: any;
  let mockPayrollBatchRepo: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getRawOne: jest.fn().mockResolvedValue({ withinSla: '5', breachedSla: '2' }),
    };

    mockExternalTxRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      count: jest.fn().mockResolvedValue(0),
    };

    mockPayrollBatchRepo = {
      findOne: jest.fn(),
    };

    (TenantContext.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity?.name === 'PayrollBatchEntity') {
        return mockPayrollBatchRepo;
      }
      return mockExternalTxRepo;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [ForensicAdvisoryService],
    }).compile();

    service = module.get<ForensicAdvisoryService>(ForensicAdvisoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReconciliationSlaDetails()', () => {
    it('should aggregate and return correct withinSla and breachedSla counts', async () => {
      const snapshotAt = new Date('2025-01-01T12:00:00Z');
      const slaCutoff = new Date('2025-01-01T11:30:00Z');
      const result = await service.getReconciliationSlaDetails(snapshotAt);

      expect(mockExternalTxRepo.createQueryBuilder).toHaveBeenCalledWith('tx');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'tx.reconciliationStatus = :status',
        {
          status: 'UNMATCHED',
          slaCutoff,
          snapshotAt,
        },
      );
      expect(result).toEqual({
        withinSla: 5,
        breachedSla: 2,
        slaMinutes: 30,
      });
    });

    it('should handle null result from database safely', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValueOnce(null);
      const snapshotAt = new Date('2025-01-01T12:00:00Z');
      const result = await service.getReconciliationSlaDetails(snapshotAt);

      expect(result).toEqual({
        withinSla: 0,
        breachedSla: 0,
        slaMinutes: 30,
      });
    });
  });

  describe('detectHardAnomalies()', () => {
    it('should return STALE_RECONCILIATION anomaly when stale transactions exist', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(3);
      const snapshotAt = new Date('2025-01-01T12:00:00Z');

      const anomalies = await service.detectHardAnomalies(snapshotAt);

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0]).toEqual({
        type: 'STALE_RECONCILIATION',
        severity: 'HIGH',
        message: '3 transactions have remained unmatched beyond the 48-hour forensic window.',
        confidence: 1.0,
      });
    });

    it('should return empty array when no stale transactions exist', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);
      const snapshotAt = new Date('2025-01-01T12:00:00Z');

      const anomalies = await service.detectHardAnomalies(snapshotAt);

      expect(anomalies).toHaveLength(0);
    });
  });

  describe('detectWarnings()', () => {
    it('should return RECONCILIATION_SLA_WARNING warning when pending SLA transactions exist', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(4);
      const snapshotAt = new Date('2025-01-01T12:00:00Z');

      const warnings = await service.detectWarnings(snapshotAt);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toEqual({
        type: 'RECONCILIATION_SLA_WARNING',
        severity: 'LOW',
        message: '4 transactions are pending reconciliation within the active SLA window.',
        confidence: 0.95,
      });
    });

    it('should return empty array when no pending SLA transactions exist', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);
      const snapshotAt = new Date('2025-01-01T12:00:00Z');

      const warnings = await service.detectWarnings(snapshotAt);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('detectPayrollVariance()', () => {
    it('should return empty array if current batch does not exist', async () => {
      mockPayrollBatchRepo.findOne.mockResolvedValueOnce(null);

      const res = await service.detectPayrollVariance('batch-123', new Date());

      expect(res).toEqual([]);
    });

    it('should return empty array if previous completed batch does not exist', async () => {
      mockPayrollBatchRepo.findOne
        .mockResolvedValueOnce({ id: 'batch-123', tenantId: 'test-tenant-id', totalNet: '10000', periodStart: new Date('2025-01-01') })
        .mockResolvedValueOnce(null);

      const res = await service.detectPayrollVariance('batch-123', new Date());

      expect(res).toEqual([]);
    });

    it('should flag payroll net variance if total net differs by > 20%', async () => {
      const currentBatch = {
        id: 'batch-curr',
        tenantId: 'test-tenant-id',
        totalNet: '150000',
        periodStart: new Date('2025-02-01'),
      };
      const previousBatch = {
        id: 'batch-prev',
        tenantId: 'test-tenant-id',
        totalNet: '100000',
        periodStart: new Date('2025-01-01'),
        status: PayrollBatchStatus.COMPLETED,
      };

      mockPayrollBatchRepo.findOne
        .mockResolvedValueOnce(currentBatch)
        .mockResolvedValueOnce(previousBatch);

      const res = await service.detectPayrollVariance('batch-curr', new Date());

      expect(res).toHaveLength(1);
      expect(res[0].type).toBe('PAYROLL_NET_VARIANCE');
      expect(res[0].severity).toBe('MEDIUM');
    });

    it('should not flag payroll net variance if total net differs by <= 20%', async () => {
      const currentBatch = {
        id: 'batch-curr',
        tenantId: 'test-tenant-id',
        totalNet: '105000',
        periodStart: new Date('2025-02-01'),
      };
      const previousBatch = {
        id: 'batch-prev',
        tenantId: 'test-tenant-id',
        totalNet: '100000',
        periodStart: new Date('2025-01-01'),
        status: PayrollBatchStatus.COMPLETED,
      };

      mockPayrollBatchRepo.findOne
        .mockResolvedValueOnce(currentBatch)
        .mockResolvedValueOnce(previousBatch);

      const res = await service.detectPayrollVariance('batch-curr', new Date());

      expect(res).toHaveLength(0);
    });
  });
});
