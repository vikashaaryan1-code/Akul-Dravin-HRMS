import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceManagementService } from './performance-management.service';
import { ExecutionGatekeeperService } from '../policy-engine/gatekeeper/execution-gatekeeper.service';
import { CareerGrowthService } from '../career-growth/career-growth.service';
import { TenantContext } from '../../common/context/tenant-context';
import { ExecutionMode } from '../policy-engine/types/policy.types';
import { CareerEventStatus } from '../../database/entities/career-growth.entity';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId:         jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository:       jest.fn(),
  },
}));

describe('PerformanceManagementService', () => {
  let service: PerformanceManagementService;
  let gatekeeper: jest.Mocked<ExecutionGatekeeperService>;
  let careerGrowthService: jest.Mocked<CareerGrowthService>;

  const mockRawResults = [
    {
      id: 'emp-001',
      firstName: 'Meera',
      lastName: 'Joshi',
      designation: 'Senior Developer',
      departmentId: 'dept-eng',
      totalAttendance: '20',
      presentAttendance: '18', // 90% attendance -> stats score = 90
      tasksDelivered: '8',      // task score = 80
      // objectiveScore = Math.round(90 * 0.5 + 80 * 0.5) = 85
      // finalScore = Math.round(85 * 0.7 + 90 * 0.3) = Math.round(59.5 + 27) = 87 (>= 85, triggers promotion check)
      subjectiveScore: '90',
    },
    {
      id: 'emp-002',
      firstName: 'Ravi',
      lastName: 'Kumar',
      designation: 'Product Manager',
      departmentId: 'dept-pm',
      totalAttendance: '20',
      presentAttendance: '12', // 60% attendance -> stats score = 60
      tasksDelivered: '3',      // task score = 30
      // objectiveScore = Math.round(60 * 0.5 + 30 * 0.5) = 45
      // finalScore = Math.round(45 * 0.7 + 70 * 0.3) = 52.5 -> 53 (< 85, does not trigger promotion check)
      subjectiveScore: '70',
    }
  ];

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockImplementation((aliasOrCb) => {
      if (typeof aliasOrCb === 'function') {
        const mockSubQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
        };
        aliasOrCb(mockSubQuery);
      }
      return mockQueryBuilder;
    }),
    leftJoin: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(mockRawResults),
  };

  const mockEmployeeRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    create: jest.fn().mockImplementation((dto) => dto),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockPerformanceRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'review-123', ...entity })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    (TenantContext.getRepository as jest.Mock).mockImplementation((entityClass) => {
      if (entityClass.name === 'EmployeeEntity') {
        return mockEmployeeRepo;
      }
      if (entityClass.name === 'PerformanceEntity') {
        return mockPerformanceRepo;
      }
      return {};
    });

    const mockGatekeeper = {
      validateDecision: jest.fn().mockResolvedValue({
        allowed: true,
        mode: ExecutionMode.ALLOW_AUTO,
      }),
    };

    const mockCareerGrowth = {
      createEvent: jest.fn().mockResolvedValue({
        id: 'promo-123',
        employeeId: 'emp-001',
        newDesignation: 'Lead Developer',
      }),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceManagementService,
        { provide: ExecutionGatekeeperService, useValue: mockGatekeeper },
        { provide: CareerGrowthService, useValue: mockCareerGrowth },
      ],
    }).compile();

    service = module.get<PerformanceManagementService>(PerformanceManagementService);
    gatekeeper = module.get(ExecutionGatekeeperService);
    careerGrowthService = module.get(CareerGrowthService);
  });

  describe('getScores()', () => {
    it('should correctly calculate and sort employee scores in a single query', async () => {
      const results = await service.getScores('2026-04');

      expect(mockEmployeeRepo.createQueryBuilder).toHaveBeenCalledWith('emp');
      expect(mockQueryBuilder.getRawMany).toHaveBeenCalled();

      expect(results).toHaveLength(2);

      // Meera Joshi (sorted first because 87 > 53)
      expect(results[0].id).toBe('emp-001');
      expect(results[0].employeeName).toBe('Meera Joshi');
      expect(results[0].performanceScore).toBe(87);
      expect(results[0].objectiveScore).toBe(85);
      expect(results[0].subjectiveScore).toBe(90);
      expect(results[0].targetAchievement).toBe(90);
      expect(results[0].tasksDelivered).toBe(8);
      expect(results[0].status).toBe('healthy');

      // Ravi Kumar (sorted second)
      expect(results[1].id).toBe('emp-002');
      expect(results[1].employeeName).toBe('Ravi Kumar');
      expect(results[1].performanceScore).toBe(53);
      expect(results[1].status).toBe('critical');
    });

    it('should trigger PDE and promotion workflow when finalScore >= 85', async () => {
      await service.getScores('2026-04');

      // Should be triggered for Meera (emp-001) but not Ravi (emp-002)
      expect(careerGrowthService.createEvent).toHaveBeenCalledTimes(1);
      expect(careerGrowthService.createEvent).toHaveBeenCalledWith({
        employeeId: 'emp-001',
        type: 'promotion',
        oldDesignation: 'Senior Developer',
        triggerScore: 87,
        status: CareerEventStatus.PROPOSED,
        forensicTraceId: undefined,
      });

      expect(gatekeeper.validateDecision).toHaveBeenCalledTimes(1);
      expect(careerGrowthService.updateStatus).toHaveBeenCalledWith('promo-123', CareerEventStatus.APPROVED);
      expect(mockEmployeeRepo.update).toHaveBeenCalledWith('emp-001', {
        designation: 'Lead Developer',
      });
      expect(careerGrowthService.updateStatus).toHaveBeenCalledWith('promo-123', CareerEventStatus.EXECUTED);
    });
  });

  describe('createReview()', () => {
    it('should create and save a new performance review with correct weights', async () => {
      const dto = {
        employeeId: 'emp-001',
        reviewPeriod: '2026-04',
        objectiveScore: 90,
        subjectiveScore: 80,
        managerComments: 'Great work!',
      };

      const result = await service.createReview(dto);

      expect(mockPerformanceRepo.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 'test-tenant-id',
        finalScore: 87, // 90 * 0.7 + 80 * 0.3 = 63 + 24 = 87
        status: 'submitted',
      });
      expect(mockPerformanceRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('review-123');
    });
  });

  describe('Leaderboard and limit methods', () => {
    it('should return top employees correctly sorted', async () => {
      const leaderboard = await service.getLeaderboard(30);
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].id).toBe('emp-001');

      const topEmp = await service.getTopEmployee();
      expect(topEmp.id).toBe('emp-001');

      const topEmployees = await service.getTopEmployees(1);
      expect(topEmployees).toHaveLength(1);
      expect(topEmployees[0].id).toBe('emp-001');
    });
  });
});
