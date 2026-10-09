import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { TenantContext } from '../../common/context/tenant-context';
import { AttendanceEntity } from '../../database/entities/attendance.entity';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('tenant-123'),
    getRequiredTenantId: jest.fn().mockReturnValue('tenant-123'),
    getRepository: jest.fn(),
  },
}));

describe('AttendanceService', () => {
  let service: AttendanceService;
  let mockAttendanceRepo: any;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    mockAttendanceRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    (TenantContext.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === AttendanceEntity) return mockAttendanceRepo;
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return healthy status when presentRate > 85%', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '100',
        present: '90',
        absent: '5',
        leave: '5',
      });

      const summary = await service.getSummary();

      expect(summary).toEqual({
        presentRate: 90,
        absentRate: 5,
        leaveRate: 5,
        status: 'healthy',
      });
      expect(mockAttendanceRepo.createQueryBuilder).toHaveBeenCalledWith('att');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('COUNT(*)', 'total');
    });

    it('should return warning status when presentRate is between 71% and 85%', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '100',
        present: '80',
        absent: '15',
        leave: '5',
      });

      const summary = await service.getSummary();

      expect(summary).toEqual({
        presentRate: 80,
        absentRate: 15,
        leaveRate: 5,
        status: 'warning',
      });
    });

    it('should return critical status when presentRate <= 70%', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '100',
        present: '60',
        absent: '30',
        leave: '10',
      });

      const summary = await service.getSummary();

      expect(summary).toEqual({
        presentRate: 60,
        absentRate: 30,
        leaveRate: 10,
        status: 'critical',
      });
    });

    it('should handle zero total records gracefully', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '0',
        present: '0',
        absent: '0',
        leave: '0',
      });

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
