import { Test, TestingModule } from '@nestjs/testing';
import { CareerGrowthController } from './career-growth.controller';
import { TenantContext } from '../../common/context/tenant-context';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository: jest.fn(),
  },
}));

describe('CareerGrowthController', () => {
  let controller: CareerGrowthController;
  let mockRepo: any;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    mockRepo = {
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    (TenantContext.getRepository as jest.Mock).mockReturnValue(mockRepo);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CareerGrowthController],
    }).compile();

    controller = module.get<CareerGrowthController>(CareerGrowthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPipeline', () => {
    it('should query career growth pipeline with correct parameters', async () => {
      const mockResult = [{ id: '1', type: 'promotion' }];
      mockRepo.find.mockResolvedValue(mockResult);

      const result = await controller.getPipeline(10);

      expect(mockRepo.find).toHaveBeenCalledWith({
        relations: ['employee'],
        order: { createdAt: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getStats', () => {
    it('should compute career growth stats correctly using QueryBuilder conditional aggregation', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '10',
        executed: '4',
        gated: '2',
      });

      const result = await controller.getStats();

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('cg');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('COUNT(*)', 'total');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN cg.status = 'executed' THEN 1 ELSE 0 END)",
        'executed'
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN cg.status = 'gated' THEN 1 ELSE 0 END)",
        'gated'
      );

      expect(result).toEqual({
        totalEvents: 10,
        executedPromotions: 4,
        gatedDecisions: 2,
        autonomyRate: '40.0%',
      });
    });

    it('should handle zero total events correctly', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '0',
        executed: '0',
        gated: '0',
      });

      const result = await controller.getStats();

      expect(result).toEqual({
        totalEvents: 0,
        executedPromotions: 0,
        gatedDecisions: 0,
        autonomyRate: '0%',
      });
    });

    it('should handle missing/null result correctly', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await controller.getStats();

      expect(result).toEqual({
        totalEvents: 0,
        executedPromotions: 0,
        gatedDecisions: 0,
        autonomyRate: '0%',
      });
    });
  });
});
