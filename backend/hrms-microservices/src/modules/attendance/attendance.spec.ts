import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';
import { AttendanceService } from './attendance.service';

describe('AttendanceService - getSummary()', () => {
  let service: AttendanceService;
  let mockRepo: any;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
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

  it('should return default rates when total count is 0', async () => {
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
    expect(mockQueryBuilder.select).toHaveBeenCalled();
  });

  it('should calculate rates correctly and return healthy status when presentRate > 85', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
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

  it('should calculate rates correctly and return warning status when presentRate is between 70 and 85', async () => {
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

  it('should calculate rates correctly and return critical status when presentRate <= 70', async () => {
    mockQueryBuilder.getRawOne.mockResolvedValue({
      total: '5',
      present: '3',
      absent: '1',
      leave: '1',
    });

    const result = await service.getSummary();

    expect(result).toEqual({
      presentRate: 60,
      absentRate: 20,
      leaveRate: 20,
      status: 'critical',
    });
  });
});
