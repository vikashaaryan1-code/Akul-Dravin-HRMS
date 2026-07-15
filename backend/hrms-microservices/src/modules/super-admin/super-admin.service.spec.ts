import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuperAdminService } from './super-admin.service';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { AuditService } from '../../common/audit/audit.service';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let tenantRepo: any;

  const mockTenantRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: mockTenantRepo,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
    tenantRepo = module.get(getRepositoryToken(TenantEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalStats', () => {
    it('should return aggregated stats correctly using optimized query', async () => {
      const mockRawOne = {
        total: '10',
        active: '5',
        trial: '3',
        suspended: '2',
      };

      const mockRawMany = [
        { plan: 'starter', count: '7' },
        { plan: 'growth', count: '3' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockRawOne),
        getRawMany: jest.fn().mockResolvedValue(mockRawMany),
      };

      tenantRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getGlobalStats();

      expect(result).toEqual({
        total: 10,
        active: 5,
        trial: 3,
        suspended: 2,
        planBreakdown: mockRawMany,
      });

      expect(tenantRepo.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(mockQueryBuilder.getRawOne).toHaveBeenCalled();
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();
    });
  });
});
