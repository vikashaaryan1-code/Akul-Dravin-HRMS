import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { TenantContext } from '../../common/context/tenant-context';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

describe('AttendanceService - getSummary', () => {
  let service: AttendanceService;
  let mockQueryBuilder: any;
  let mockRepo: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    (TenantContext.getRepository as jest.Mock).mockReturnValue(mockRepo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return default rates and healthy status when total is 0', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
      total: '0',
      present: '0',
      absent: '0',
      leave: '0',
    });

    const result = await service.getSummary();

    expect(result).toEqual({
      presentRate: 0,
      absentRate: 0,
      leaveRate: 0,
      status: 'healthy',
    });
    expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('attendance');
    expect(mockQueryBuilder.select).toHaveBeenCalledWith('COUNT(attendance.id)', 'total');
  });

  it('should return healthy status when present rate is greater than 85%', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
      total: '10',
      present: '9', // 90%
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

  it('should return warning status when present rate is between 70% and 85%', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
      total: '10',
      present: '8', // 80%
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

  it('should return critical status when present rate is less than or equal to 70%', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
      total: '10',
      present: '6', // 60%
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

  it('should handle null/missing values in raw result gracefully', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue(null);

    const result = await service.getSummary();

    expect(result).toEqual({
      presentRate: 0,
      absentRate: 0,
      leaveRate: 0,
      status: 'healthy',
    });
  });
});
