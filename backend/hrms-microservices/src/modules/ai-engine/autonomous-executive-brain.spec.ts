import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AutonomousExecutiveBrainService } from './autonomous-executive-brain.service';
import { AiEngineService } from './ai-engine.service';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { TenantContext } from '../../common/context/tenant-context';

describe('AutonomousExecutiveBrainService', () => {
  let service: AutonomousExecutiveBrainService;
  let aiEngineService: Partial<AiEngineService>;
  let mockInsightRepo: any;

  const tenantId = 'tenant-123';

  beforeEach(async () => {
    aiEngineService = {
      generateReport: jest.fn().mockResolvedValue({
        content: 'Executive Strategy or Budget Allocation Content',
      }),
    };

    mockInsightRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'insight-1', ...dto })),
      save: jest.fn().mockImplementation(async (entity) => ({ id: 'insight-1', ...entity })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutonomousExecutiveBrainService,
        { provide: AiEngineService, useValue: aiEngineService },
        { provide: getRepositoryToken(AiInsightEntity), useValue: mockInsightRepo },
      ],
    }).compile();

    service = module.get<AutonomousExecutiveBrainService>(AutonomousExecutiveBrainService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateExecutiveStrategy', () => {
    it('should aggregate employee and payroll metrics and return executive strategy', async () => {
      const mockEmpQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          headcount: '10',
          activeEmployees: '8',
          totalMonthlyCtc: '50000',
          departments: '3',
        }),
      };

      const mockPayrollQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalNet: '45000.0000',
        }),
      };

      jest.spyOn(TenantContext, 'getRepository').mockImplementation((entity: any) => {
        if (entity === EmployeeEntity) {
          return { createQueryBuilder: () => mockEmpQb } as any;
        }
        if (entity === PayrollBatchEntity) {
          return { createQueryBuilder: () => mockPayrollQb } as any;
        }
        return {} as any;
      });

      const result = await service.generateExecutiveStrategy(tenantId);

      expect(result).toBeDefined();
      expect(result.tenantId).toEqual(tenantId);
      expect(result.contextUsed).toEqual({
        headcount: 10,
        activeEmployees: 8,
        totalMonthlyCtc: 50000,
        lastPayrollTotal: 45000,
        departments: 3,
      });
      expect(result.strategyContent).toEqual('Executive Strategy or Budget Allocation Content');
      expect(mockInsightRepo.save).toHaveBeenCalled();
    });
  });

  describe('detectOperationalRisks', () => {
    it('should calculate attrition risk and return operational risk findings', async () => {
      const mockEmpQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          attritionRisk: '6',
        }),
      };

      jest.spyOn(TenantContext, 'getRepository').mockImplementation((entity: any) => {
        if (entity === EmployeeEntity) {
          return { createQueryBuilder: () => mockEmpQb } as any;
        }
        return {} as any;
      });

      const result = await service.detectOperationalRisks(tenantId);

      expect(result).toBeDefined();
      expect(result.status).toEqual('WARNING');
      expect(result.risks[0]).toEqual({
        type: 'ATTRITION_RISK',
        severity: 'HIGH',
        count: 6,
      });
      expect(mockInsightRepo.save).toHaveBeenCalled();
    });
  });

  describe('recommendBudgetAllocation', () => {
    it('should calculate departmental headcount distribution and recommend budget allocation', async () => {
      const mockEmpQb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { deptId: 'dept-1', cnt: '5' },
          { deptId: 'dept-2', cnt: '3' },
        ]),
      };

      jest.spyOn(TenantContext, 'getRepository').mockImplementation((entity: any) => {
        if (entity === EmployeeEntity) {
          return { createQueryBuilder: () => mockEmpQb } as any;
        }
        return {} as any;
      });

      const result = await service.recommendBudgetAllocation(tenantId, 100000);

      expect(result).toBeDefined();
      expect(result.allocationPlan).toEqual('Executive Strategy or Budget Allocation Content');
      expect(result.insightId).toEqual('insight-1');
      expect(mockInsightRepo.save).toHaveBeenCalled();
    });
  });
});
