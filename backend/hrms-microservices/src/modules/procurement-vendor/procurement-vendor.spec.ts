import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementVendorService } from './procurement-vendor.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { TenantContext } from '../../common/context/tenant-context';

describe('ProcurementVendorService', () => {
  let service: ProcurementVendorService;
  let mockVendorQb: any;
  let mockPoQb: any;
  let mockVendorRepo: any;
  let mockPoRepo: any;

  beforeEach(async () => {
    mockVendorQb = {
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalVendors: '10',
        activeVendors: '8',
      }),
    };

    mockPoQb = {
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalOrders: '25',
        openPurchaseOrders: '5',
        monthlySpend: '15000.50',
      }),
    };

    mockVendorRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockVendorQb),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockPoRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockPoQb),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jest.spyOn(TenantContext, 'getRequiredTenantId').mockReturnValue('tenant-test-123');
    jest.spyOn(TenantContext, 'getRepository').mockImplementation((entity: any) => {
      if (entity.name === 'VendorEntity') {
        return mockVendorRepo;
      }
      return mockPoRepo;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementVendorService,
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProcurementVendorService>(ProcurementVendorService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return aggregated summary stats from database queries', async () => {
    const summary = await service.getSummary();

    expect(TenantContext.getRequiredTenantId).toHaveBeenCalled();
    expect(mockVendorRepo.createQueryBuilder).toHaveBeenCalledWith('vendor');
    expect(mockPoRepo.createQueryBuilder).toHaveBeenCalledWith('po');

    expect(summary).toEqual({
      activeVendors: 8,
      openPurchaseOrders: 5,
      monthlySpend: 15000.5,
      totalVendors: 10,
      totalOrders: 25,
    });
  });

  it('should handle zero or null aggregate values gracefully', async () => {
    mockVendorQb.getRawOne.mockResolvedValueOnce({
      totalVendors: '0',
      activeVendors: null,
    });

    mockPoQb.getRawOne.mockResolvedValueOnce({
      totalOrders: '0',
      openPurchaseOrders: null,
      monthlySpend: null,
    });

    const summary = await service.getSummary();

    expect(summary).toEqual({
      activeVendors: 0,
      openPurchaseOrders: 0,
      monthlySpend: 0,
      totalVendors: 0,
      totalOrders: 0,
    });
  });
});
