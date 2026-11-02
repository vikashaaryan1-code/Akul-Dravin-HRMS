import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';

// ─── Mock TenantContext & QueryBuilder ──────────────────────────────────────────

const createMockQueryBuilder = (mockRawResult: any) => {
  const qb: any = {
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockImplementation(() => Promise.resolve(mockRawResult)),
  };
  return qb;
};

let currentMockRawResult: any = null;
let currentMockQb: any = null;

const repoMock = {
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  create: jest.fn().mockImplementation((dto: any) => ({ id: 'new-id', ...dto })),
  save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
  createQueryBuilder: jest.fn().mockImplementation(() => {
    currentMockQb = createMockQueryBuilder(currentMockRawResult);
    return currentMockQb;
  }),
};

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository: jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (TenantContext.getRepository as jest.Mock).mockReturnValue(repoMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('getSummary()', () => {
    it('should return 0 rates and "healthy" status when total attendance is 0', async () => {
      currentMockRawResult = {
        total: '0',
        present: '0',
        absent: '0',
        leave: '0',
      };

      const summary = await service.getSummary();

      expect(repoMock.createQueryBuilder).toHaveBeenCalledWith('attendance');
      expect(currentMockQb.select).toHaveBeenCalledWith('COUNT(*)', 'total');
      expect(currentMockQb.addSelect).toHaveBeenCalledWith(
        `SUM(CASE WHEN attendance.status = 'present' THEN 1 ELSE 0 END)`,
        'present',
      );
      expect(currentMockQb.addSelect).toHaveBeenCalledWith(
        `SUM(CASE WHEN attendance.status = 'absent' THEN 1 ELSE 0 END)`,
        'absent',
      );
      expect(currentMockQb.addSelect).toHaveBeenCalledWith(
        `SUM(CASE WHEN attendance.status = 'leave' THEN 1 ELSE 0 END)`,
        'leave',
      );
      expect(summary).toEqual({
        presentRate: 0,
        absentRate: 0,
        leaveRate: 0,
        status: 'healthy',
      });
    });

    it('should compute correct rates and status "healthy" when presentRate > 85%', async () => {
      currentMockRawResult = {
        total: '100',
        present: '90',
        absent: '5',
        leave: '5',
      };

      const summary = await service.getSummary();

      expect(summary).toEqual({
        presentRate: 90,
        absentRate: 5,
        leaveRate: 5,
        status: 'healthy',
      });
    });

    it('should compute status "warning" when presentRate is between 71% and 85%', async () => {
      currentMockRawResult = {
        total: '100',
        present: '80',
        absent: '15',
        leave: '5',
      };

      const summary = await service.getSummary();

      expect(summary).toEqual({
        presentRate: 80,
        absentRate: 15,
        leaveRate: 5,
        status: 'warning',
      });
    });

    it('should compute status "critical" when presentRate <= 70%', async () => {
      currentMockRawResult = {
        total: '100',
        present: '60',
        absent: '30',
        leave: '10',
      };

      const summary = await service.getSummary();

      expect(summary).toEqual({
        presentRate: 60,
        absentRate: 30,
        leaveRate: 10,
        status: 'critical',
      });
    });

    it('should handle missing or null fields gracefully', async () => {
      currentMockRawResult = null;

      const summary = await service.getSummary();

      expect(summary).toEqual({
        presentRate: 0,
        absentRate: 0,
        leaveRate: 0,
        status: 'healthy',
      });
    });
  });
});
