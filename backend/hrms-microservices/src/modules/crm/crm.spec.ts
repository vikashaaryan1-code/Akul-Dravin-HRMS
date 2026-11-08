import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CrmService } from './crm.service';

const mockQueryBuilder = (rawMany: any[] = [], rawOne: any = null) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(rawMany),
  getRawOne: jest.fn().mockResolvedValue(rawOne),
});

const mockRepo = (data: any[] = []) => ({
  find: jest.fn().mockResolvedValue(data),
  findOne: jest.fn().mockImplementation(({ where }: any) => {
    const item = data.find((d) => d.id === where?.id);
    return Promise.resolve(item ?? null);
  }),
  count: jest.fn().mockResolvedValue(data.length),
  create: jest.fn().mockImplementation((dto: any) => ({ id: 'new-id', ...dto })),
  save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
  remove: jest.fn().mockResolvedValue(undefined),
  merge: jest.fn().mockImplementation((base: any, updates: any) => ({ ...base, ...updates })),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder()),
});

jest.mock('../../common/context/tenant-context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRequiredTenantId: jest.fn().mockReturnValue('test-tenant-id'),
    getRepository: jest.fn(),
  },
}));

import { TenantContext } from '../../common/context/tenant-context';

describe('CrmService', () => {
  let service: CrmService;
  let leadRepoMock: ReturnType<typeof mockRepo>;
  let customerRepoMock: ReturnType<typeof mockRepo>;
  let interactionRepoMock: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    leadRepoMock = mockRepo();
    customerRepoMock = mockRepo();
    interactionRepoMock = mockRepo();

    (TenantContext.getRepository as jest.Mock).mockImplementation((entity: any) => {
      const name = entity?.name;
      if (name === 'CrmCustomerEntity') return customerRepoMock;
      if (name === 'CrmInteractionEntity') return interactionRepoMock;
      return leadRepoMock;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmService],
    }).compile();

    service = module.get<CrmService>(CrmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPipelineSummary()', () => {
    it('should aggregate lead pipeline stages and customer values via database queries', async () => {
      const mockLeadAggregates = [
        { stage: 'Qualified', count: '10', totalValue: '150000' },
        { stage: 'Proposal Sent', count: '5', totalValue: '250000' },
        { stage: 'Closed Won', count: '3', totalValue: '120000' },
      ];

      const leadQb = mockQueryBuilder(mockLeadAggregates);
      leadRepoMock.createQueryBuilder = jest.fn().mockReturnValue(leadQb);

      customerRepoMock.count = jest.fn().mockResolvedValue(15);
      const customerQb = mockQueryBuilder([], { total: '500000' });
      customerRepoMock.createQueryBuilder = jest.fn().mockReturnValue(customerQb);

      const summary = await service.getPipelineSummary();

      expect(leadRepoMock.createQueryBuilder).toHaveBeenCalledWith('lead');
      expect(leadQb.select).toHaveBeenCalledWith('lead.stage', 'stage');
      expect(leadQb.addSelect).toHaveBeenCalledWith('COUNT(*)', 'count');
      expect(leadQb.addSelect).toHaveBeenCalledWith(
        'COALESCE(SUM(lead.expected_value), 0)',
        'totalValue',
      );
      expect(leadQb.where).toHaveBeenCalledWith('lead.tenant_id = :tenantId', {
        tenantId: 'test-tenant-id',
      });
      expect(leadQb.groupBy).toHaveBeenCalledWith('lead.stage');

      expect(customerRepoMock.count).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant-id' },
      });
      expect(customerRepoMock.createQueryBuilder).toHaveBeenCalledWith('c');

      expect(summary.leadCount).toBe(18);
      expect(summary.totalPipelineValue).toBe(520000);
      expect(summary.customerCount).toBe(15);
      expect(summary.totalAnnualValue).toBe(500000);
      expect(summary.stageCounts).toEqual([
        { stage: 'Qualified', count: 10 },
        { stage: 'Proposal Sent', count: 5 },
        { stage: 'Closed Won', count: 3 },
      ]);
    });

    it('should handle zero leads and zero customers gracefully', async () => {
      const leadQb = mockQueryBuilder([]);
      leadRepoMock.createQueryBuilder = jest.fn().mockReturnValue(leadQb);

      customerRepoMock.count = jest.fn().mockResolvedValue(0);
      const customerQb = mockQueryBuilder([], null);
      customerRepoMock.createQueryBuilder = jest.fn().mockReturnValue(customerQb);

      const summary = await service.getPipelineSummary();

      expect(summary.leadCount).toBe(0);
      expect(summary.totalPipelineValue).toBe(0);
      expect(summary.customerCount).toBe(0);
      expect(summary.totalAnnualValue).toBe(0);
      expect(summary.stageCounts).toEqual([]);
    });
  });

  describe('getLeads() & getLeadById()', () => {
    it('should retrieve leads with default pagination', async () => {
      const mockLeads = [{ id: 'lead-1', leadName: 'Lead 1' }];
      leadRepoMock.find = jest.fn().mockResolvedValue(mockLeads);

      const result = await service.getLeads();
      expect(result).toEqual(mockLeads);
      expect(leadRepoMock.find).toHaveBeenCalledWith({
        where: [{ tenantId: 'test-tenant-id' }],
        order: { lastTouch: 'DESC', createdAt: 'DESC' },
        take: 50,
        skip: 0,
      });
    });

    it('should retrieve lead by id or throw NotFoundException', async () => {
      const mockLead = { id: 'lead-123', leadName: 'Test' };
      leadRepoMock.findOne = jest.fn().mockResolvedValue(mockLead);

      const found = await service.getLeadById('lead-123');
      expect(found).toEqual(mockLead);

      leadRepoMock.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.getLeadById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLead() & updateLead() & deleteLead()', () => {
    it('should create a new lead with tenant context', async () => {
      const created = await service.createLead({
        leadName: 'Acme Corp',
        expectedValue: 10000,
      });

      expect(leadRepoMock.create).toHaveBeenCalled();
      expect(leadRepoMock.save).toHaveBeenCalled();
      expect(created.leadName).toBe('Acme Corp');
    });

    it('should update an existing lead', async () => {
      leadRepoMock.findOne = jest.fn().mockResolvedValue({ id: 'lead-1', leadName: 'Old' });

      const updated = await service.updateLead('lead-1', { leadName: 'New' });
      expect(leadRepoMock.save).toHaveBeenCalled();
      expect(updated.leadName).toBe('New');
    });

    it('should delete an existing lead', async () => {
      const existing = { id: 'lead-1', leadName: 'Lead 1' };
      leadRepoMock.findOne = jest.fn().mockResolvedValue(existing);

      await service.deleteLead('lead-1');
      expect(leadRepoMock.remove).toHaveBeenCalledWith(existing);
    });
  });

  describe('getCustomers() & getCustomerById()', () => {
    it('should return all customers for tenant', async () => {
      const mockCustomers = [{ id: 'cust-1', accountName: 'Corp' }];
      customerRepoMock.find = jest.fn().mockResolvedValue(mockCustomers);

      const result = await service.getCustomers();
      expect(result).toEqual(mockCustomers);
      expect(customerRepoMock.find).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant-id' },
        order: { annualValue: 'DESC', createdAt: 'DESC' },
      });
    });

    it('should throw NotFoundException if customer not found', async () => {
      customerRepoMock.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.getCustomerById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getInteractions() & createInteraction()', () => {
    it('should retrieve interactions and create interaction', async () => {
      const mockInteractions = [{ id: 'int-1', channel: 'Email' }];
      interactionRepoMock.find = jest.fn().mockResolvedValue(mockInteractions);

      const result = await service.getInteractions('lead-1');
      expect(result).toEqual(mockInteractions);

      const created = await service.createInteraction({
        leadId: 'lead-1',
        channel: 'Call',
        summary: 'Introductory call',
      });
      expect(interactionRepoMock.create).toHaveBeenCalled();
      expect(interactionRepoMock.save).toHaveBeenCalled();
      expect(created.summary).toBe('Introductory call');
    });
  });
});
