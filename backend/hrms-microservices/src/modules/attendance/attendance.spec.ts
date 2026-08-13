import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let repo: any;
  let qb: any;

  beforeEach(async () => {
    qb = {
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      merge: jest.fn(),
    };

    (TenantContext.getRepository as jest.Mock).mockReturnValue(repo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary()', () => {
    it('should return 0 rates and healthy status when no records exist', async () => {
      qb.getRawOne.mockResolvedValue({
        total: '0',
        present: '0',
        absent: '0',
        leave: '0',
      });

      const result = await service.getSummary();

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('attendance');
      expect(qb.andWhere).toHaveBeenCalledWith(
        'attendance.tenant_id = :_governedTenantId',
        { _governedTenantId: 'test-tenant-id' },
      );
      expect(result).toEqual({
        presentRate: 0,
        absentRate: 0,
        leaveRate: 0,
        status: 'healthy',
      });
    });

    it('should correctly calculate rates and return healthy status when present rate is > 85%', async () => {
      qb.getRawOne.mockResolvedValue({
        total: '10',
        present: '9',
        absent: '1',
        leave: '0',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 90,
        absentRate: 10,
        leaveRate: 0,
        status: 'healthy',
      });
    });

    it('should return warning status when present rate is between 71% and 85%', async () => {
      qb.getRawOne.mockResolvedValue({
        total: '10',
        present: '8',
        absent: '1',
        leave: '1',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 80,
        absentRate: 10,
        leaveRate: 10,
        status: 'warning',
      });
    });

    it('should return critical status when present rate is <= 70%', async () => {
      qb.getRawOne.mockResolvedValue({
        total: '10',
        present: '6',
        absent: '3',
        leave: '1',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 60,
        absentRate: 30,
        leaveRate: 10,
        status: 'critical',
      });
    });

    it('should handle string values returned by getRawOne and parse them correctly', async () => {
      qb.getRawOne.mockResolvedValue({
        total: '100',
        present: '85',
        absent: '10',
        leave: '5',
      });

      const result = await service.getSummary();

      expect(result).toEqual({
        presentRate: 85,
        absentRate: 10,
        leaveRate: 5,
        status: 'warning',
      });
    });
  });
});
