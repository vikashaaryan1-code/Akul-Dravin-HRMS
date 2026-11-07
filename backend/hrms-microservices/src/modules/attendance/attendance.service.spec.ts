import { AttendanceService } from './attendance.service';
import { TenantContext } from '../../common/context/tenant-context';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let qbMock: any;
  let repoMock: any;

  beforeEach(() => {
    service = new AttendanceService();

    qbMock = {
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    repoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jest.spyOn(TenantContext, 'getRequiredTenantId').mockReturnValue('tenant-uuid-123');
    jest.spyOn(TenantContext, 'getRepository').mockReturnValue(repoMock as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSummary', () => {
    it('returns 0 rates and healthy status when total attendance is 0', async () => {
      qbMock.getRawOne.mockResolvedValue({
        total: '0',
        present: '0',
        absent: '0',
        leave: '0',
      });

      const result = await service.getSummary();

      expect(repoMock.createQueryBuilder).toHaveBeenCalledWith('attendance');
      expect(qbMock.select).toHaveBeenCalledWith('COUNT(*)', 'total');
      expect(result).toEqual({
        presentRate: 0,
        absentRate: 0,
        leaveRate: 0,
        status: 'healthy',
      });
    });

    it('returns healthy status when present rate > 85%', async () => {
      qbMock.getRawOne.mockResolvedValue({
        total: '100',
        present: '90',
        absent: '5',
        leave: '5',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 90,
        absentRate: 5,
        leaveRate: 5,
        status: 'healthy',
      });
    });

    it('returns warning status when present rate is between 71% and 85%', async () => {
      qbMock.getRawOne.mockResolvedValue({
        total: '100',
        present: '75',
        absent: '20',
        leave: '5',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 75,
        absentRate: 20,
        leaveRate: 5,
        status: 'warning',
      });
    });

    it('returns critical status when present rate is 70% or below', async () => {
      qbMock.getRawOne.mockResolvedValue({
        total: '100',
        present: '60',
        absent: '30',
        leave: '10',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 60,
        absentRate: 30,
        leaveRate: 10,
        status: 'critical',
      });
    });
  });
});
