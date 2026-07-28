import { Test, TestingModule } from '@nestjs/testing';
import { CareerGrowthController } from './career-growth.controller';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

jest.mock('../../common/governance/tenant/tenant-query-policy', () => ({
  TenantQueryPolicy: {
    enforce: jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';

const mockPipeline = [
  { id: 'cg-001', status: 'executed', employee: { id: 'emp-001', name: 'John Doe' } },
  { id: 'cg-002', status: 'gated', employee: { id: 'emp-002', name: 'Jane Smith' } },
];

describe('CareerGrowthController', () => {
  let controller: CareerGrowthController;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue(mockPipeline),
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

  describe('getPipeline()', () => {
    it('should return career growth pipeline elements', async () => {
      const result = await controller.getPipeline(10);
      expect(result).toEqual(mockPipeline);
      expect(mockRepo.find).toHaveBeenCalledWith({
        relations: ['employee'],
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });

    it('should default to limit 30 when not specified', async () => {
      const result = await controller.getPipeline();
      expect(result).toEqual(mockPipeline);
      expect(mockRepo.find).toHaveBeenCalledWith({
        relations: ['employee'],
        order: { createdAt: 'DESC' },
        take: 30,
      });
    });
  });

  describe('getStats()', () => {
    it('should aggregate and calculate stats using single query', async () => {
      const mockRawOneResult = {
        total: '10',
        executed: '7',
        gated: '3',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRawOneResult),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await controller.getStats();

      expect(result).toEqual({
        totalEvents: 10,
        executedPromotions: 7,
        gatedDecisions: 3,
        autonomyRate: '70.0%',
      });

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('cg');
      expect(TenantQueryPolicy.enforce).toHaveBeenCalledWith(
        mockQueryBuilder,
        'test-tenant-id',
        'cg',
        'CareerGrowthController',
        'getStats',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('COUNT(*)', 'total');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith("SUM(CASE WHEN cg.status = 'executed' THEN 1 ELSE 0 END)", 'executed');
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith("SUM(CASE WHEN cg.status = 'gated' THEN 1 ELSE 0 END)", 'gated');
    });

    it('should return 0% autonomyRate when total is 0', async () => {
      const mockRawOneResult = {
        total: '0',
        executed: '0',
        gated: '0',
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRawOneResult),
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
