import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { WorkforceAnalyticsService } from './workforce-analytics.service';

describe('WorkforceAnalyticsService', () => {
  let service: WorkforceAnalyticsService;
  let dataSourceMock: { query: jest.Mock };

  beforeEach(async () => {
    dataSourceMock = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkforceAnalyticsService,
        {
          provide: getDataSourceToken(),
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<WorkforceAnalyticsService>(WorkforceAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHeadcountSnapshot', () => {
    it('should return parsed headcount metrics from a single query execution', async () => {
      const mockQueryResult = [
        {
          total: '10',
          active: '8',
          on_leave: '1',
          inactive: '1',
          by_dept: JSON.stringify([
            { departmentId: 'dept-1', count: '5' },
            { departmentId: 'dept-2', count: '3' },
          ]),
          by_type: JSON.stringify([
            { type: 'FULL_TIME', count: '8' },
            { type: 'CONTRACT', count: '2' },
          ]),
          by_desig: JSON.stringify([
            { designation: 'Senior Engineer', count: '4' },
            { designation: 'Manager', count: '4' },
          ]),
        },
      ];

      dataSourceMock.query.mockResolvedValueOnce(mockQueryResult);

      const snapshot = await service.getHeadcountSnapshot('tenant-123');

      expect(dataSourceMock.query).toHaveBeenCalledTimes(1);
      expect(dataSourceMock.query).toHaveBeenCalledWith(
        expect.stringContaining('WITH base AS'),
        ['tenant-123'],
      );

      expect(snapshot).toEqual({
        total: 10,
        active: 8,
        onLeave: 1,
        inactive: 1,
        byDepartment: [
          { departmentId: 'dept-1', count: 5 },
          { departmentId: 'dept-2', count: 3 },
        ],
        byEmploymentType: [
          { type: 'FULL_TIME', count: 8 },
          { type: 'CONTRACT', count: 2 },
        ],
        byDesignation: [
          { designation: 'Senior Engineer', count: 4 },
          { designation: 'Manager', count: 4 },
        ],
      });
    });

    it('should handle empty result sets gracefully', async () => {
      dataSourceMock.query.mockResolvedValueOnce([]);

      const snapshot = await service.getHeadcountSnapshot('tenant-empty');

      expect(snapshot).toEqual({
        total: 0,
        active: 0,
        onLeave: 0,
        inactive: 0,
        byDepartment: [],
        byEmploymentType: [],
        byDesignation: [],
      });
    });
  });
});
