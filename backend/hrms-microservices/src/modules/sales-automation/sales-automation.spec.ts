import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SalesAutomationService } from './sales-automation.service';
import { SalesLeadEntity } from '../../database/entities/sales-lead.entity';
import { SalesCustomerAccountEntity } from '../../database/entities/sales-customer-account.entity';
import { SalesCustomerContactEntity } from '../../database/entities/sales-customer-contact.entity';
import { SalesDealEntity } from '../../database/entities/sales-deal.entity';
import { SalesTargetEntity } from '../../database/entities/sales-target.entity';
import { SalesCommissionEntity } from '../../database/entities/sales-commission.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';
import { PayrollService } from '../payroll/payroll.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { CommunicationHubService } from '../communication/communication-hub.service';
import { SaaSProvisioningService } from '../admin/saas-provisioning.service';

describe('SalesAutomationService', () => {
  let service: SalesAutomationService;

  const mockLeadQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      { stage: 'new-lead', stageCount: '5' },
      { stage: 'closed-won', stageCount: '2' },
    ]),
  };

  const mockDealQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({
      dealCount: '10',
      totalDealValue: '50000.00',
      wonDealValue: '20000.00',
      closedWonCount: '2',
      closedLostCount: '1',
    }),
  };

  const mockTargetQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({
      totalTarget: '100000.00',
      totalAchieved: '60000.00',
    }),
  };

  const mockCommQb = {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({
      totalCommission: '5000.00',
    }),
  };

  const mockLeadRepo = { createQueryBuilder: jest.fn().mockReturnValue(mockLeadQb) };
  const mockDealRepo = { createQueryBuilder: jest.fn().mockReturnValue(mockDealQb) };
  const mockTargetRepo = { createQueryBuilder: jest.fn().mockReturnValue(mockTargetQb) };
  const mockCommRepo = { createQueryBuilder: jest.fn().mockReturnValue(mockCommQb) };
  const mockCustomerAccountRepo = { count: jest.fn().mockResolvedValue(15) };
  const mockRecruitmentJobRepo = { count: jest.fn().mockResolvedValue(4) };
  const mockRecruitmentAppRepo = { count: jest.fn().mockResolvedValue(25) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesAutomationService,
        { provide: getRepositoryToken(SalesLeadEntity), useValue: mockLeadRepo },
        { provide: getRepositoryToken(SalesCustomerAccountEntity), useValue: mockCustomerAccountRepo },
        { provide: getRepositoryToken(SalesCustomerContactEntity), useValue: {} },
        { provide: getRepositoryToken(SalesDealEntity), useValue: mockDealRepo },
        { provide: getRepositoryToken(SalesTargetEntity), useValue: mockTargetRepo },
        { provide: getRepositoryToken(SalesCommissionEntity), useValue: mockCommRepo },
        { provide: getRepositoryToken(EmployeeEntity), useValue: {} },
        { provide: getRepositoryToken(RecruitmentJobEntity), useValue: mockRecruitmentJobRepo },
        { provide: getRepositoryToken(RecruitmentApplicationEntity), useValue: mockRecruitmentAppRepo },
        { provide: getRepositoryToken(AnalyticsEventEntity), useValue: {} },
        { provide: PayrollService, useValue: {} },
        { provide: AiEngineService, useValue: {} },
        { provide: CommunicationHubService, useValue: {} },
        { provide: SaaSProvisioningService, useValue: {} },
      ],
    }).compile();

    service = module.get<SalesAutomationService>(SalesAutomationService);
  });

  it('should return sales analytics summary using aggregation queries', async () => {
    const summary = await service.getSalesAnalyticsSummary();

    expect(summary).toEqual({
      leadCount: 7,
      customerCount: 15,
      dealCount: 10,
      totalDealValue: 50000,
      wonDealValue: 20000,
      closedWonCount: 2,
      closedLostCount: 1,
      targetAchievementPercent: 60,
      totalCommission: 5000,
      recruitmentContext: {
        jobCount: 4,
        applicationCount: 25,
      },
      pipelineCounts: [
        { stage: 'new-lead', count: 5 },
        { stage: 'contacted', count: 0 },
        { stage: 'qualified', count: 0 },
        { stage: 'proposal-sent', count: 0 },
        { stage: 'negotiation', count: 0 },
        { stage: 'closed-won', count: 2 },
        { stage: 'closed-lost', count: 0 },
      ],
    });

    expect(mockLeadRepo.createQueryBuilder).toHaveBeenCalledWith('lead');
    expect(mockDealRepo.createQueryBuilder).toHaveBeenCalledWith('deal');
    expect(mockTargetRepo.createQueryBuilder).toHaveBeenCalledWith('target');
    expect(mockCommRepo.createQueryBuilder).toHaveBeenCalledWith('comm');
    expect(mockCustomerAccountRepo.count).toHaveBeenCalled();
    expect(mockRecruitmentJobRepo.count).toHaveBeenCalled();
    expect(mockRecruitmentAppRepo.count).toHaveBeenCalled();
  });
});
