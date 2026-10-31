import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuperAdminService } from './super-admin.service';
import { TenantEntity } from '../../database/entities/tenant.entity';
import { AuditService } from '../../common/audit/audit.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let tenantRepo: any;
  let auditService: any;

  const mockQueryBuilder = {
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.groupBy.mockReturnThis();

    tenantRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: getRepositoryToken(TenantEntity),
          useValue: tenantRepo,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalStats()', () => {
    it('should aggregate tenant statistics and plan distribution in consolidated queries', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValueOnce({
        total: '10',
        active: '5',
        trial: '3',
        suspended: '2',
      });

      const mockPlanBreakdown = [
        { plan: 'starter', count: '4' },
        { plan: 'growth', count: '6' },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValueOnce(mockPlanBreakdown);

      const stats = await service.getGlobalStats();

      expect(tenantRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(stats).toEqual({
        total: 10,
        active: 5,
        trial: 3,
        suspended: 2,
        planBreakdown: mockPlanBreakdown,
      });
    });

    it('should safely handle empty or null raw aggregate response', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValueOnce(null);
      mockQueryBuilder.getRawMany.mockResolvedValueOnce(null);

      const stats = await service.getGlobalStats();

      expect(stats).toEqual({
        total: 0,
        active: 0,
        trial: 0,
        suspended: 0,
        planBreakdown: [],
      });
    });
  });

  describe('getTenant()', () => {
    it('should return tenant if found', async () => {
      const mockTenant = { id: 'tenant-1', companyName: 'Acme Corp' };
      tenantRepo.findOne.mockResolvedValueOnce(mockTenant);

      const result = await service.getTenant('tenant-1');
      expect(result).toEqual(mockTenant);
      expect(tenantRepo.findOne).toHaveBeenCalledWith({ where: { id: 'tenant-1' } });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      tenantRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.getTenant('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTenant()', () => {
    it('should throw ConflictException if owner email already registered', async () => {
      tenantRepo.findOne.mockResolvedValueOnce({ id: 'existing', ownerEmail: 'owner@acme.com' });

      await expect(
        service.createTenant({ companyName: 'Acme', ownerEmail: 'owner@acme.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and save a new tenant, logging audit event', async () => {
      tenantRepo.findOne.mockResolvedValueOnce(null);
      const newTenant = { id: 'tenant-123', companyName: 'Acme Corp' };
      tenantRepo.create.mockReturnValueOnce(newTenant);
      tenantRepo.save.mockResolvedValueOnce(newTenant);

      const result = await service.createTenant(
        { companyName: 'Acme Corp', ownerEmail: 'new@acme.com' },
        'actor-1',
      );

      expect(result).toEqual(newTenant);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TENANT_CREATE',
          entityId: 'tenant-123',
        }),
      );
    });
  });
});
