import { Test, TestingModule } from '@nestjs/testing';
import { LmsService } from './lms.service';
import { TenantContext } from '../../common/context/tenant-context';

describe('LmsService', () => {
  let service: LmsService;

  const mockEmpRepo = {
    count: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockPerfRepo = {
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    jest.spyOn(TenantContext, 'getRepository').mockImplementation((entity: any) => {
      if (entity.name === 'EmployeeEntity') return mockEmpRepo as any;
      if (entity.name === 'PerformanceEntity') return mockPerfRepo as any;
      return {} as any;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [LmsService],
    }).compile();

    service = module.get<LmsService>(LmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCourses', () => {
    it('should return courses derived from employee headcount', async () => {
      mockEmpRepo.count.mockResolvedValue(100);

      const courses = await service.getCourses();

      expect(courses).toHaveLength(6);
      expect(courses[0].enrolled).toBe(60);
      expect(courses[5].enrolled).toBe(100);
      expect(mockEmpRepo.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMyLearning', () => {
    it('should return recent learning records derived from performance repo', async () => {
      mockPerfRepo.find.mockResolvedValue([
        { finalScore: 95 },
        { finalScore: 80 },
      ]);

      const myLearning = await service.getMyLearning();

      expect(myLearning).toHaveLength(2);
      expect(myLearning[0].status).toBe('Completed');
      expect(myLearning[0].progress).toBe(95);
      expect(myLearning[1].status).toBe('In Progress');
      expect(myLearning[1].progress).toBe(80);
      expect(mockPerfRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });
  });

  describe('getCompletionTrend', () => {
    it('should calculate trend using database SQL aggregate AVG score when present', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ avgScore: '85.4' });

      const trend = await service.getCompletionTrend();

      expect(trend).toHaveLength(6);
      expect(trend[0]).toEqual({ name: 'Jan', value: 65 });
      expect(mockPerfRepo.createQueryBuilder).toHaveBeenCalledWith('perf');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('AVG(COALESCE(perf.finalScore, 70))', 'avgScore');
    });

    it('should fallback to default score of 70 when query returns null', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({ avgScore: null });

      const trend = await service.getCompletionTrend();

      expect(trend).toHaveLength(6);
      expect(trend[0]).toEqual({ name: 'Jan', value: 50 });
    });
  });

  describe('getSummary', () => {
    it('should aggregate courses and my learning into summary metrics', async () => {
      mockEmpRepo.count.mockResolvedValue(50);
      mockPerfRepo.find.mockResolvedValue([
        { finalScore: 92 },
        { finalScore: 70 },
      ]);

      const summary = await service.getSummary();

      expect(summary.totalCourses).toBe(6);
      expect(summary.myCoursesCount).toBe(2);
      expect(summary.completedCount).toBe(1);
    });
  });
});
