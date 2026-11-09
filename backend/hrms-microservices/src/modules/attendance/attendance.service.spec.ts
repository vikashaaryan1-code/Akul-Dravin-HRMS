import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { TenantContext } from '../../common/context/tenant-context';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('tenant-test-123'),
    getRequiredTenantId: jest.fn().mockReturnValue('tenant-test-123'),
    getRepository: jest.fn(),
  },
}));

describe('AttendanceService', () => {
  let service: AttendanceService;
  let qbMock: any;
  let repoMock: any;

  beforeEach(async () => {
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

    (TenantContext.getRepository as jest.Mock).mockReturnValue(repoMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary()', () => {
    it('should return healthy status with 0 rates when no attendance records exist', async () => {
      qbMock.getRawOne.mockResolvedValue({
        total: '0',
        present: '0',
        absent: '0',
        leave: '0',
      });

      const result = await service.getSummary();

      expect(repoMock.createQueryBuilder).toHaveBeenCalledWith('att');
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'att.tenant_id = :_governedTenantId',
        { _governedTenantId: 'tenant-test-123' },
      );
      expect(result).toEqual({
        presentRate: 0,
        absentRate: 0,
        leaveRate: 0,
        status: 'healthy',
      });
    });

    it('should return nullish fallback cleanly when raw query returns null', async () => {
      qbMock.getRawOne.mockResolvedValue(null);

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 0,
        absentRate: 0,
        leaveRate: 0,
        status: 'healthy',
      });
    });

    it('should calculate healthy status when present rate is greater than 85%', async () => {
      // 90 present, 5 absent, 5 leave out of 100
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

    it('should calculate warning status when present rate is between 71% and 85%', async () => {
      // 80 present, 10 absent, 10 leave out of 100
      qbMock.getRawOne.mockResolvedValue({
        total: '100',
        present: '80',
        absent: '10',
        leave: '10',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 80,
        absentRate: 10,
        leaveRate: 10,
        status: 'warning',
      });
    });

    it('should calculate critical status when present rate is 70% or below', async () => {
      // 60 present, 30 absent, 10 leave out of 100
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
