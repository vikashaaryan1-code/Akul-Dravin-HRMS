import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, ILike } from 'typeorm';
import { TenantContext } from '../../common/context/tenant-context';
import { CrmLeadEntity } from '../../database/entities/crm-lead.entity';
import { CrmCustomerEntity } from '../../database/entities/crm-customer.entity';
import { CrmInteractionEntity } from '../../database/entities/crm-interaction.entity';
import {
  CreateLeadDto,
  UpdateLeadDto,
  LeadQueryDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateInteractionDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  private get leadRepo() {
    return TenantContext.getRepository(CrmLeadEntity);
  }
  private get customerRepo() {
    return TenantContext.getRepository(CrmCustomerEntity);
  }
  private get interactionRepo() {
    return TenantContext.getRepository(CrmInteractionEntity);
  }

  // ── Leads ───────────────────────────────────────────────────────────────────

  async getLeads(query?: LeadQueryDto): Promise<CrmLeadEntity[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const where: FindOptionsWhere<CrmLeadEntity>[] = [];

    if (query?.search) {
      // Full-text search across name, org, email
      const term = query.search;
      const baseWhere = (field: FindOptionsWhere<CrmLeadEntity>) => ({
        ...field,
        tenantId,
        ...(query.stage ? { stage: query.stage as CrmLeadEntity['stage'] } : {}),
      });
      where.push(baseWhere({ leadName: ILike(`%${term}%`) }));
      where.push(baseWhere({ organization: ILike(`%${term}%`) }));
      where.push(baseWhere({ email: ILike(`%${term}%`) }));
    } else {
      const base: FindOptionsWhere<CrmLeadEntity> = { tenantId };
      if (query?.stage) base.stage = query.stage as CrmLeadEntity['stage'];
      where.push(base);
    }

    return this.leadRepo.find({
      where,
      order: { lastTouch: 'DESC', createdAt: 'DESC' },
      take: Math.min(query?.limit ?? 50, 200),
      skip: ((query?.page ?? 1) - 1) * Math.min(query?.limit ?? 50, 200),
    });
  }

  async getLeadById(id: string): Promise<CrmLeadEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const lead = await this.leadRepo.findOne({
      where: { id, tenantId },
      relations: ['interactions'],
    });
    if (!lead) throw new NotFoundException(`CRM lead ${id} not found`);
    return lead;
  }

  async createLead(payload: CreateLeadDto): Promise<CrmLeadEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const lead = this.leadRepo.create({
      tenantId,
      leadName:      payload.leadName?.trim() || 'New Lead',
      organization:  payload.organization?.trim() ?? null,
      email:         payload.email?.trim() ?? null,
      phone:         payload.phone?.trim() ?? null,
      stage:         (payload.stage as CrmLeadEntity['stage']) ?? 'New',
      ownerName:     payload.ownerName?.trim() ?? null,
      score:         Number.isFinite(payload.score) ? Number(payload.score) : 70,
      source:        (payload.source as CrmLeadEntity['source']) ?? null,
      notes:         payload.notes?.trim() ?? null,
      expectedValue: payload.expectedValue ?? null,
      lastTouch:     new Date(),
    });
    return this.leadRepo.save(lead);
  }

  async updateLead(id: string, payload: Partial<UpdateLeadDto>): Promise<CrmLeadEntity> {
    const lead = await this.getLeadById(id);
    const updates: Partial<CrmLeadEntity> = { lastTouch: new Date() };
    if (payload.leadName     !== undefined) updates.leadName     = payload.leadName;
    if (payload.organization !== undefined) updates.organization = payload.organization ?? null;
    if (payload.email        !== undefined) updates.email        = payload.email ?? null;
    if (payload.phone        !== undefined) updates.phone        = payload.phone ?? null;
    if (payload.stage        !== undefined) updates.stage        = payload.stage as CrmLeadEntity['stage'];
    if (payload.ownerName    !== undefined) updates.ownerName    = payload.ownerName ?? null;
    if (payload.score        !== undefined) updates.score        = Number(payload.score);
    if (payload.notes        !== undefined) updates.notes        = payload.notes ?? null;
    if (payload.expectedValue !== undefined) updates.expectedValue = payload.expectedValue ?? null;
    return this.leadRepo.save(this.leadRepo.merge(lead, updates));
  }

  async updateLeadStage(id: string, stage: string): Promise<CrmLeadEntity> {
    return this.updateLead(id, { stage: stage as CrmLeadEntity['stage'] });
  }

  async deleteLead(id: string): Promise<void> {
    const lead = await this.getLeadById(id);
    await this.leadRepo.remove(lead);
  }

  // ── Customers ────────────────────────────────────────────────────────────────

  async getCustomers(): Promise<CrmCustomerEntity[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    return this.customerRepo.find({
      where: { tenantId },
      order: { annualValue: 'DESC', createdAt: 'DESC' },
    });
  }

  async getCustomerById(id: string): Promise<CrmCustomerEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const customer = await this.customerRepo.findOne({
      where: { id, tenantId },
      relations: ['interactions'],
    });
    if (!customer) throw new NotFoundException(`CRM customer ${id} not found`);
    return customer;
  }

  async createCustomer(payload: CreateCustomerDto): Promise<CrmCustomerEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const customer = this.customerRepo.create({
      tenantId,
      accountName:  payload.accountName?.trim() || 'New Customer',
      industry:     payload.industry?.trim() ?? null,
      ownerName:    payload.ownerName?.trim() ?? null,
      healthStatus: (payload.healthStatus as CrmCustomerEntity['healthStatus']) ?? 'Healthy',
      annualValue:  Number(payload.annualValue ?? 0),
      email:        payload.email?.trim() ?? null,
      phone:        payload.phone?.trim() ?? null,
      contractEnd:  payload.contractEnd ?? null,
    });
    return this.customerRepo.save(customer);
  }

  async updateCustomer(id: string, payload: Partial<UpdateCustomerDto>): Promise<CrmCustomerEntity> {
    const customer = await this.getCustomerById(id);
    return this.customerRepo.save(this.customerRepo.merge(customer, payload as Partial<CrmCustomerEntity>));
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await this.getCustomerById(id);
    await this.customerRepo.remove(customer);
  }

  // ── Interactions ─────────────────────────────────────────────────────────────

  async getInteractions(leadId?: string, customerId?: string): Promise<CrmInteractionEntity[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    const where: FindOptionsWhere<CrmInteractionEntity> = { tenantId };
    if (leadId)    where.leadId     = leadId;
    if (customerId) where.customerId = customerId;
    return this.interactionRepo.find({
      where,
      order: { happenedAt: 'DESC' },
      take: 200,
    });
  }

  async createInteraction(payload: CreateInteractionDto): Promise<CrmInteractionEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const interaction = this.interactionRepo.create({
      tenantId,
      leadId:          payload.leadId ?? null,
      customerId:      payload.customerId ?? null,
      customerName:    payload.customerName?.trim() ?? null,
      channel:         (payload.channel as CrmInteractionEntity['channel']) ?? 'Email',
      interactionType: (payload.interactionType as CrmInteractionEntity['interactionType']) ?? 'General',
      happenedAt:      payload.happenedAt ? new Date(payload.happenedAt) : new Date(),
      summary:         payload.summary?.trim() ?? null,
      createdBy:       payload.createdBy ?? null,
    });
    return this.interactionRepo.save(interaction);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────────

  async getPipelineSummary() {
    const tenantId   = TenantContext.getRequiredTenantId();
    const leads       = await this.leadRepo.find({ where: { tenantId }, take: 2000 });
    const stageCounts: Record<string, number> = {};
    let   totalPipelineValue = 0;

    for (const lead of leads) {
      stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1;
      totalPipelineValue += Number(lead.expectedValue ?? 0);
    }

    const customerCount     = await this.customerRepo.count({ where: { tenantId } });
    const totalAnnualValue  = await this.customerRepo
      .createQueryBuilder('c')
      .select('SUM(c.annual_value)', 'total')
      .where('c.tenant_id = :tenantId', { tenantId })
      .getRawOne<{ total: string }>();

    return {
      leadCount:          leads.length,
      customerCount,
      totalPipelineValue,
      totalAnnualValue:   Number(totalAnnualValue?.total ?? 0),
      stageCounts:        Object.entries(stageCounts).map(([stage, count]) => ({ stage, count })),
    };
  }
}
