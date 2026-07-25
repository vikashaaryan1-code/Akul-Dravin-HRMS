import { Test, TestingModule } from '@nestjs/testing';
import { CareerGrowthController } from './career-growth.controller';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';

describe('CareerGrowthController', () => {
  let controller: CareerGrowthController;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
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
    it('should retrieve workforce evolution pipeline with limit', async () => {
      const mockEvents = [
        { id: '1', type: 'promotion', status: 'executed' },
        { id: '2', type: 'increment', status: 'gated' },
      ];
      mockRepo.find.mockResolvedValue(mockEvents);

      const result = await controller.getPipeline(10);

      expect(result).toEqual(mockEvents);
      expect(mockRepo.find).toHaveBeenCalledWith({
        relations: ['employee'],
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });

    it('should use default limit if not specified', async () => {
      mockRepo.find.mockResolvedValue([]);
      await controller.getPipeline();
      expect(mockRepo.find).toHaveBeenCalledWith({
        relations: ['employee'],
        order: { createdAt: 'DESC' },
        take: 30,
      });
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats with autonomy rate', async () => {
      const mockRaw = { total: '10', executed: '6', gated: '3' };

      const mockQueryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRaw),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await controller.getStats();

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('cg');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('cg.tenant_id = :_governedTenantId', {
        _governedTenantId: 'test-tenant-id',
      });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('COUNT(*)', 'total');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN cg.status = 'executed' THEN 1 ELSE 0 END)",
        'executed',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        "SUM(CASE WHEN cg.status = 'gated' THEN 1 ELSE 0 END)",
        'gated',
      );
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();

      expect(result).toEqual({
        totalEvents: 10,
        executedPromotions: 6,
        gatedDecisions: 3,
        autonomyRate: '60.0%',
      });
    });

    it('should handle zero events total with 0% autonomy rate', async () => {
      const mockRaw = { total: '0', executed: '0', gated: '0' };

      const mockQueryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRaw),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await controller.getStats();

      expect(result).toEqual({
        totalEvents: 0,
        executedPromotions: 0,
        gatedDecisions: 0,
        autonomyRate: '0%',
      });
    });

    it('should handle missing / null query results gracefully', async () => {
      const mockQueryBuilder: any = {
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

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
