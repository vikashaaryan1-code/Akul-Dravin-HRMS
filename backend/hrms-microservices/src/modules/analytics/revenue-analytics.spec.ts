import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RevenueAnalyticsService } from './revenue-analytics.service';

describe('RevenueAnalyticsService', () => {
  let service: RevenueAnalyticsService;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueAnalyticsService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<RevenueAnalyticsService>(RevenueAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRevenueSnapshot', () => {
    it('should aggregate revenue metrics into a single query and return calculated snapshot', async () => {
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        {
          total: '10',
          paid: '8',
          trial_count: '2',
          mrr: '120000.00',
          tenant_count: '5',
        },
      ]);

      const result = await service.getRevenueSnapshot();

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        mrr: 120000,
        arr: 1440000,
        arpu: 15000, // 120000 / 8
        totalActiveSubscriptions: 10,
        totalPaidTenants: 8,
        trialTenants: 2,
      });
    });

    it('should handle zero paid tenants gracefully without division by zero', async () => {
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        {
          total: '2',
          paid: '0',
          trial_count: '2',
          mrr: '0.00',
          tenant_count: '0',
        },
      ]);

      const result = await service.getRevenueSnapshot();

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        mrr: 0,
        arr: 0,
        arpu: 0,
        totalActiveSubscriptions: 2,
        totalPaidTenants: 0,
        trialTenants: 2,
      });
    });
  });

  describe('getPlanDistribution', () => {
    it('should return mapped plan distribution list', async () => {
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        { plan_name: 'Enterprise', count: '5', total_mrr: '100000.00' },
        { plan_name: 'Pro', count: '5', total_mrr: '50000.00' },
      ]);

      const result = await service.getPlanDistribution();

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { planName: 'Enterprise', count: 5, mrr: 100000, percentage: 50 },
        { planName: 'Pro', count: 5, mrr: 50000, percentage: 50 },
      ]);
    });
  });

  describe('getChurnMetrics', () => {
    it('should calculate churn metrics using a single consolidated query', async () => {
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        {
          churned_count: '2',
          lost_mrr: '20000.00',
          start_count: '100',
        },
      ]);

      const result = await service.getChurnMetrics(30);

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        periodDays: 30,
        churned: 2,
        startBase: 100,
        churnRate: 2, // (2 / 100) * 100
        revenueChurn: 20000,
        netRevenueRetentionRate: 98,
      });
    });
  });

  describe('getGrowthTrend', () => {
    it('should return growth trend with calculated net and cumulative MRR', async () => {
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        { month: '2025-01', new_mrr: '50000.00', churned_mrr: '5000.00' },
        { month: '2025-02', new_mrr: '60000.00', churned_mrr: '10000.00' },
      ]);

      const result = await service.getGrowthTrend(12);

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          month: '2025-01',
          newMrr: 50000,
          churnedMrr: 5000,
          netMrr: 45000,
          cumulativeMrr: 45000,
        },
        {
          month: '2025-02',
          newMrr: 60000,
          churnedMrr: 10000,
          netMrr: 50000,
          cumulativeMrr: 95000,
        },
      ]);
    });
  });

  describe('getKpiSummary', () => {
    it('should combine all analytics metrics into summary', async () => {
      // 1. Snapshot query
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        { total: '10', paid: '8', trial_count: '2', mrr: '100000', tenant_count: '5' },
      ]);
      // 2. Plan distribution query
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        { plan_name: 'Pro', count: '8', total_mrr: '100000' },
      ]);
      // 3. Churn metrics query
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        { churned_count: '1', lost_mrr: '5000', start_count: '50' },
      ]);
      // 4. Growth trend query
      (dataSource.query as jest.Mock).mockResolvedValueOnce([
        { month: '2025-01', new_mrr: '20000', churned_mrr: '5000' },
      ]);

      const result = await service.getKpiSummary();

      expect(dataSource.query).toHaveBeenCalledTimes(4);
      expect(result.snapshot.mrr).toBe(100000);
      expect(result.planDistribution).toHaveLength(1);
      expect(result.churn.churned).toBe(1);
      expect(result.growthTrend).toHaveLength(1);
    });
  });
});
