import { Test, TestingModule } from '@nestjs/testing';
import { WorkTrackingService } from './work-tracking.service';
import { WorkActivityEntity } from '../../database/entities/work-activity.entity';
import { WorkdaySummaryEntity } from '../../database/entities/workday-summary.entity';

// Mock TenantContext
jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('tenant-123'),
    getRequiredTenantId: jest.fn().mockReturnValue('tenant-123'),
    getRepository: jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';

describe('WorkTrackingService', () => {
  let service: WorkTrackingService;
  let mockActivityRepo: any;
  let mockWorkdayRepo: any;

  beforeEach(async () => {
    mockActivityRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockWorkdayRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    (TenantContext.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === WorkActivityEntity) return mockActivityRepo;
      if (entity === WorkdaySummaryEntity) return mockWorkdayRepo;
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkTrackingService],
    }).compile();

    service = module.get<WorkTrackingService>(WorkTrackingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductivitySummary', () => {
    it('should aggregate productivity metrics via QueryBuilder', async () => {
      const mockQb = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalActivities: '10',
          totalProductiveHours: '75.5',
          totalTasksCompleted: '42',
          avgProductivityHours: '7.55',
        }),
      };

      mockActivityRepo.createQueryBuilder.mockReturnValue(mockQb);

      const summary = await service.getProductivitySummary();

      expect(mockActivityRepo.createQueryBuilder).toHaveBeenCalledWith('activity');
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'activity.tenant_id = :_governedTenantId',
        { _governedTenantId: 'tenant-123' },
      );
      expect(summary).toEqual({
        totalActivities: 10,
        totalProductiveHours: 75.5,
        totalTasksCompleted: 42,
        avgProductivityHours: 7.6,
      });
    });

    it('should return zeros when dataset is empty', async () => {
      const mockQb = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalActivities: '0',
          totalProductiveHours: '0',
          totalTasksCompleted: '0',
          avgProductivityHours: '0',
        }),
      };

      mockActivityRepo.createQueryBuilder.mockReturnValue(mockQb);

      const summary = await service.getProductivitySummary();

      expect(summary).toEqual({
        totalActivities: 0,
        totalProductiveHours: 0,
        totalTasksCompleted: 0,
        avgProductivityHours: 0,
      });
    });
  });
});
