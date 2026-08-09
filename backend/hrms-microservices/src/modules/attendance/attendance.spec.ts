import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository: jest.fn(),
  },
}));

jest.mock('../../common/governance/tenant', () => ({
  TenantQueryPolicy: {
    enforce: jest.fn().mockImplementation((qb) => qb),
    assertPresent: jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant';
import { AttendanceService } from './attendance.service';

describe('AttendanceService - getSummary()', () => {
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

  it('should return empty summary when total count is 0', async () => {
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

    expect(TenantContext.getRequiredTenantId).toHaveBeenCalled();
    expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('attendance');
    expect(TenantQueryPolicy.enforce).toHaveBeenCalledWith(
      mockQueryBuilder,
      'test-tenant-id',
      'attendance',
      'AttendanceService',
      'getSummary'
    );
  });

  it('should calculate Rates correctly and return status healthy when presentRate > 85', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
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

  it('should calculate Rates correctly and return status warning when presentRate is between 71 and 85', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
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

  it('should calculate Rates correctly and return status critical when presentRate <= 70', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
      total: '10',
      present: '5',
      absent: '3',
      leave: '2',
    });

    const result = await service.getSummary();

    expect(result).toEqual({
      presentRate: 50,
      absentRate: 30,
      leaveRate: 20,
      status: 'critical',
    });
  });
});
