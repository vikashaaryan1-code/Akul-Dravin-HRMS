import { NotFoundException } from '@nestjs/common';

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository: jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';
import { PerformanceManagementService } from './performance-management.service';

describe('PerformanceManagementService', () => {
  let service: PerformanceManagementService;
  let gatekeeper: any;
  let careerGrowthService: any;

  const mockEmployees = [
    {
      id: 'emp-1',
      firstName: 'Alice',
      lastName: 'Smith',
      designation: 'Software Engineer',
      departmentId: 'dept-1',
      tenantId: 'test-tenant-id',
    },
    {
      id: 'emp-2',
      firstName: 'Bob',
      lastName: 'Jones',
      designation: 'Product Manager',
      departmentId: 'dept-1',
      tenantId: 'test-tenant-id',
    },
  ];

  let mockEmployeeRepo: any;
  let mockAttendanceRepo: any;
  let mockTaskRepo: any;
  let mockPerformanceRepo: any;

  beforeEach(() => {
    mockEmployeeRepo = {
      find: jest.fn().mockResolvedValue([...mockEmployees]),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const createQbMock = (rawResult: any[]) => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rawResult),
    });

    mockAttendanceRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() =>
        createQbMock([
          { employeeId: 'emp-1', total: '10', present: '9' },
          { employeeId: 'emp-2', total: '10', present: '6' },
        ]),
      ),
      find: jest.fn().mockResolvedValue([]),
    };

    mockTaskRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() =>
        createQbMock([
          { assigneeId: 'emp-1', tasksDelivered: '12' },
          { assigneeId: 'emp-2', tasksDelivered: '5' },
        ]),
      ),
    };

    mockPerformanceRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() =>
        createQbMock([
          { employeeId: 'emp-1', subjectiveScore: '90' },
          { employeeId: 'emp-2', subjectiveScore: '70' },
        ]),
      ),
      create: jest.fn().mockImplementation((dto: any) => dto),
      save: jest.fn().mockImplementation((entity: any) =>
        Promise.resolve({ id: 'review-1', ...entity }),
      ),
    };

    (TenantContext.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity.name === 'EmployeeEntity') return mockEmployeeRepo;
      if (entity.name === 'AttendanceEntity') return mockAttendanceRepo;
      if (entity.name === 'TaskEntity') return mockTaskRepo;
      if (entity.name === 'PerformanceEntity') return mockPerformanceRepo;
      return mockEmployeeRepo;
    });

    gatekeeper = {
      validateDecision: jest.fn().mockResolvedValue({
        allowed: true,
        mode: 'ALLOW_AUTO',
      }),
    };

    careerGrowthService = {
      createEvent: jest.fn().mockResolvedValue({
        id: 'event-1',
        newDesignation: 'Senior Software Engineer',
      }),
      updateStatus: jest.fn().mockResolvedValue({}),
    };

    service = new PerformanceManagementService(gatekeeper, careerGrowthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getScores()', () => {
    it('should return empty array when no employees exist', async () => {
      mockEmployeeRepo.find.mockResolvedValue([]);
      const result = await service.getScores();
      expect(result).toEqual([]);
    });

    it('should compute scores and trigger promotion checks for high performers', async () => {
      const scores = await service.getScores('2026-04');

      expect(scores).toHaveLength(2);

      // emp-1:
      // attendanceRate: Math.round((9/10)*100) = 90
      // tasksDelivered: 12 -> taskScore: Math.min(100, (12/10)*100) = 100
      // objectiveScore: Math.round(90 * 0.5 + 100 * 0.5) = 95
      // subjectiveScore: 90
      // finalScore: Math.round(95 * 0.7 + 90 * 0.3) = Math.round(66.5 + 27) = 94
      // status: 'healthy' (>85)
      const emp1Score = scores.find((s) => s.id === 'emp-1');
      expect(emp1Score).toBeDefined();
      expect(emp1Score?.performanceScore).toBe(94);
      expect(emp1Score?.status).toBe('healthy');
      expect(emp1Score?.tasksDelivered).toBe(12);

      // Verify promotion check triggered for emp-1 (finalScore >= 85)
      expect(careerGrowthService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'emp-1',
          type: 'promotion',
          triggerScore: 94,
        }),
      );

      // emp-2:
      // attendanceRate: Math.round((6/10)*100) = 60
      // tasksDelivered: 5 -> taskScore: (5/10)*100 = 50
      // objectiveScore: Math.round(60 * 0.5 + 50 * 0.5) = 55
      // subjectiveScore: 70
      // finalScore: Math.round(55 * 0.7 + 70 * 0.3) = Math.round(38.5 + 21) = 60
      // status: 'critical' (<= 75)
      const emp2Score = scores.find((s) => s.id === 'emp-2');
      expect(emp2Score).toBeDefined();
      expect(emp2Score?.performanceScore).toBe(60);
      expect(emp2Score?.status).toBe('critical');
    });

    it('should default subjective score to 80 when no review exists', async () => {
      mockPerformanceRepo.createQueryBuilder.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      }));

      const scores = await service.getScores('2026-04');
      const emp1Score = scores.find((s) => s.id === 'emp-1');
      expect(emp1Score?.subjectiveScore).toBe(80);
    });
  });

  describe('getLeaderboard()', () => {
    it('should return top 10 performance scores', async () => {
      const result = await service.getLeaderboard(7);
      expect(result).toHaveLength(2);
      expect(result[0].performanceScore).toBeGreaterThanOrEqual(result[1].performanceScore);
    });
  });

  describe('getTopEmployees()', () => {
    it('should limit the returned employees to the specified limit', async () => {
      const result = await service.getTopEmployees(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('emp-1');
    });
  });

  describe('getTopEmployee()', () => {
    it('should return the top performing employee', async () => {
      const result = await service.getTopEmployee();
      expect(result).not.toBeNull();
      expect(result?.id).toBe('emp-1');
    });

    it('should return null if no employees exist', async () => {
      mockEmployeeRepo.find.mockResolvedValue([]);
      const result = await service.getTopEmployee();
      expect(result).toBeNull();
    });
  });

  describe('createReview()', () => {
    it('should compute finalScore and save the review', async () => {
      const dto = {
        employeeId: 'emp-1',
        reviewPeriod: '2026-04',
        objectiveScore: 90,
        subjectiveScore: 80,
      };

      const result = await service.createReview(dto as any);
      // finalScore = Math.round(90 * 0.7 + 80 * 0.3) = 63 + 24 = 87
      expect(result.finalScore).toBe(87);
      expect(result.tenantId).toBe('test-tenant-id');
      expect(mockPerformanceRepo.save).toHaveBeenCalled();
    });
  });
});
