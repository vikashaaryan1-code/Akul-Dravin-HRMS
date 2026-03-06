import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { SalesCommissionEntity } from '../../database/entities/sales-commission.entity';
import { SalesCustomerAccountEntity } from '../../database/entities/sales-customer-account.entity';
import { SalesCustomerContactEntity } from '../../database/entities/sales-customer-contact.entity';
import { SalesDealEntity } from '../../database/entities/sales-deal.entity';
import { SalesLeadEntity } from '../../database/entities/sales-lead.entity';
import { SalesTargetEntity } from '../../database/entities/sales-target.entity';
import { PayrollService } from '../payroll/payroll.service';
import { CalculateSalesCommissionDto } from './dto/calculate-sales-commission.dto';
import { CreateCustomerAccountDto } from './dto/create-customer-account.dto';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateSalesDealDto } from './dto/create-sales-deal.dto';
import { CreateSalesTargetDto } from './dto/create-sales-target.dto';
import { ImportLeadsDto } from './dto/import-leads.dto';
import { UpdateCustomerAccountDto } from './dto/update-customer-account.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { UpdateSalesDealDto } from './dto/update-sales-deal.dto';
import { UpdateSalesTargetDto } from './dto/update-sales-target.dto';

const PIPELINE_STAGES = [
  'new-lead',
  'contacted',
  'qualified',
  'proposal-sent',
  'negotiation',
  'closed-won',
  'closed-lost',
] as const;

type PipelineStageCode = typeof PIPELINE_STAGES[number];

@Injectable()
export class SalesAutomationService {
  private readonly logger = new Logger(SalesAutomationService.name);

  constructor(
    @InjectRepository(SalesLeadEntity)
    private readonly leadRepository: Repository<SalesLeadEntity>,
    @InjectRepository(SalesCustomerAccountEntity)
    private readonly customerAccountRepository: Repository<SalesCustomerAccountEntity>,
    @InjectRepository(SalesCustomerContactEntity)
    private readonly customerContactRepository: Repository<SalesCustomerContactEntity>,
    @InjectRepository(SalesDealEntity)
    private readonly dealRepository: Repository<SalesDealEntity>,
    @InjectRepository(SalesTargetEntity)
    private readonly targetRepository: Repository<SalesTargetEntity>,
    @InjectRepository(SalesCommissionEntity)
    private readonly commissionRepository: Repository<SalesCommissionEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(RecruitmentJobEntity)
    private readonly recruitmentJobRepository: Repository<RecruitmentJobEntity>,
    @InjectRepository(RecruitmentApplicationEntity)
    private readonly recruitmentApplicationRepository: Repository<RecruitmentApplicationEntity>,
    @InjectRepository(AnalyticsEventEntity)
    private readonly analyticsEventRepository: Repository<AnalyticsEventEntity>,
    private readonly payrollService: PayrollService,
  ) {}

  findAllLeads(): Promise<SalesLeadEntity[]> {
    return this.leadRepository.find({ order: { createdAt: 'DESC' } });
  }

  findLead(id: string): Promise<SalesLeadEntity | null> {
    return this.leadRepository.findOne({ where: { id } });
  }

  async captureLead(dto: CreateLeadDto): Promise<SalesLeadEntity> {
    return this.createLead(dto, 'lead-captured');
  }

  async importLeads(dto: ImportLeadsDto) {
    const imported: SalesLeadEntity[] = [];
    for (const lead of dto.leads) {
      const created = await this.createLead(lead, 'lead-imported');
      imported.push(created);
    }

    return {
      importedCount: imported.length,
      leads: imported,
    };
  }

  async updateLead(id: string, dto: UpdateLeadDto): Promise<SalesLeadEntity> {
    const existing = await this.findLead(id);
    if (!existing) {
      throw new NotFoundException(`Lead not found for id=${id}`);
    }

    if (dto.assignedTo) {
      await this.ensureEmployeeExists(dto.assignedTo);
    }

    const status = dto.status
      ?? (dto.pipelineStage === 'closed-won'
        ? 'converted'
        : dto.pipelineStage === 'closed-lost'
          ? 'lost'
          : existing.status);

    const merged = this.leadRepository.merge(existing, {
      assignedTo: dto.assignedTo ?? existing.assignedTo,
      score: dto.score !== undefined ? dto.score.toFixed(2) : existing.score,
      pipelineStage: dto.pipelineStage ?? existing.pipelineStage,
      status,
      nurturingStatus: dto.nurturingStatus ?? existing.nurturingStatus,
      notes: dto.notes ?? existing.notes,
      leadPayload: {
        ...existing.leadPayload,
        updatedAt: new Date().toISOString(),
      },
    });

    const saved = await this.leadRepository.save(merged);
    await this.emitAnalyticsEvent('sales.lead.updated', {
      leadId: saved.id,
      pipelineStage: saved.pipelineStage,
      status: saved.status,
      score: saved.score,
    }, saved.tenantId, saved.assignedTo ?? null);

    this.logger.log(`Updated lead id=${saved.id} stage=${saved.pipelineStage}`);
    return saved;
  }

  async updatePipelineStage(dto: UpdatePipelineStageDto) {
    const lead = await this.findLead(dto.leadId);
    if (!lead) {
      throw new NotFoundException(`Lead not found for id=${dto.leadId}`);
    }

    const updatedLead = await this.updateLead(dto.leadId, {
      pipelineStage: dto.stage,
    });

    if (dto.dealId) {
      const deal = await this.findDeal(dto.dealId);
      if (deal) {
        await this.updateDeal(dto.dealId, {
          stage: dto.stage,
          status: dto.stage === 'closed-won' ? 'closed-won' : dto.stage === 'closed-lost' ? 'closed-lost' : 'open',
        });
      }
    }

    return updatedLead;
  }

  async getPipelineBoard() {
    const leads = await this.findAllLeads();

    return PIPELINE_STAGES.map((stage) => ({
      stage,
      count: leads.filter((lead) => lead.pipelineStage === stage).length,
      leads: leads.filter((lead) => lead.pipelineStage === stage).slice(0, 40),
    }));
  }

  findAllCustomerAccounts(): Promise<SalesCustomerAccountEntity[]> {
    return this.customerAccountRepository.find({ order: { createdAt: 'DESC' } });
  }

  findCustomerAccount(id: string): Promise<SalesCustomerAccountEntity | null> {
    return this.customerAccountRepository.findOne({ where: { id } });
  }

  async createCustomerAccount(dto: CreateCustomerAccountDto): Promise<SalesCustomerAccountEntity> {
    if (dto.ownerEmployeeId) {
      await this.ensureEmployeeExists(dto.ownerEmployeeId);
    }

    const entity = this.customerAccountRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      accountName: dto.accountName,
      industry: dto.industry ?? null,
      website: dto.website ?? null,
      address: dto.address ?? null,
      ownerEmployeeId: dto.ownerEmployeeId ?? null,
      accountStatus: 'active',
      annualRecurringValue: '0.00',
      accountPayload: {
        interactionCount: 0,
      },
    });

    const saved = await this.customerAccountRepository.save(entity);
    await this.emitAnalyticsEvent('sales.customer.created', {
      customerAccountId: saved.id,
      accountName: saved.accountName,
    }, saved.tenantId, saved.ownerEmployeeId);

    return saved;
  }

  async updateCustomerAccount(id: string, dto: UpdateCustomerAccountDto): Promise<SalesCustomerAccountEntity> {
    const existing = await this.findCustomerAccount(id);
    if (!existing) {
      throw new NotFoundException(`Customer account not found for id=${id}`);
    }

    if (dto.ownerEmployeeId) {
      await this.ensureEmployeeExists(dto.ownerEmployeeId);
    }

    const merged = this.customerAccountRepository.merge(existing, {
      accountName: dto.accountName ?? existing.accountName,
      industry: dto.industry ?? existing.industry,
      website: dto.website ?? existing.website,
      address: dto.address ?? existing.address,
      ownerEmployeeId: dto.ownerEmployeeId ?? existing.ownerEmployeeId,
      accountStatus: dto.accountStatus ?? existing.accountStatus,
    });

    return this.customerAccountRepository.save(merged);
  }

  findAllCustomerContacts(): Promise<SalesCustomerContactEntity[]> {
    return this.customerContactRepository.find({ order: { createdAt: 'DESC' } });
  }

  findCustomerContact(id: string): Promise<SalesCustomerContactEntity | null> {
    return this.customerContactRepository.findOne({ where: { id } });
  }

  async createCustomerContact(dto: CreateCustomerContactDto): Promise<SalesCustomerContactEntity> {
    const account = await this.findCustomerAccount(dto.customerAccountId);
    if (!account) {
      throw new NotFoundException(`Customer account not found for id=${dto.customerAccountId}`);
    }

    const entity = this.customerContactRepository.create({
      tenantId: dto.tenantId ?? account.tenantId,
      customerAccountId: dto.customerAccountId,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      email: dto.email,
      phone: dto.phone ?? null,
      designation: dto.designation ?? null,
      isPrimary: false,
      lastInteractionAt: null,
      interactionHistory: [],
      notes: dto.notes ?? null,
    });

    const saved = await this.customerContactRepository.save(entity);
    await this.emitAnalyticsEvent('sales.contact.created', {
      contactId: saved.id,
      customerAccountId: saved.customerAccountId,
      email: saved.email,
    }, saved.tenantId, null);

    return saved;
  }

  async updateCustomerContact(id: string, dto: UpdateCustomerContactDto): Promise<SalesCustomerContactEntity> {
    const existing = await this.findCustomerContact(id);
    if (!existing) {
      throw new NotFoundException(`Customer contact not found for id=${id}`);
    }

    const interactionHistory = [...existing.interactionHistory];
    if (dto.notes && dto.notes !== existing.notes) {
      interactionHistory.push({
        at: new Date().toISOString(),
        type: 'note-update',
        details: dto.notes,
      });
    }

    const merged = this.customerContactRepository.merge(existing, {
      firstName: dto.firstName ?? existing.firstName,
      lastName: dto.lastName ?? existing.lastName,
      phone: dto.phone ?? existing.phone,
      designation: dto.designation ?? existing.designation,
      isPrimary: dto.isPrimary ?? existing.isPrimary,
      notes: dto.notes ?? existing.notes,
      lastInteractionAt: new Date(),
      interactionHistory,
    });

    return this.customerContactRepository.save(merged);
  }

  findAllDeals(): Promise<SalesDealEntity[]> {
    return this.dealRepository.find({ order: { createdAt: 'DESC' } });
  }

  findDeal(id: string): Promise<SalesDealEntity | null> {
    return this.dealRepository.findOne({ where: { id } });
  }

  async createDeal(dto: CreateSalesDealDto): Promise<SalesDealEntity> {
    if (dto.salesRepresentativeId) {
      await this.ensureEmployeeExists(dto.salesRepresentativeId);
    }

    if (dto.customerAccountId) {
      const account = await this.findCustomerAccount(dto.customerAccountId);
      if (!account) {
        throw new NotFoundException(`Customer account not found for id=${dto.customerAccountId}`);
      }
    }

    const stage = dto.stage ?? 'new-lead';
    if (!PIPELINE_STAGES.includes(stage as PipelineStageCode)) {
      throw new BadRequestException('Invalid sales pipeline stage');
    }

    const entity = this.dealRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      leadId: dto.leadId ?? null,
      customerAccountId: dto.customerAccountId ?? null,
      dealName: dto.dealName,
      dealValue: dto.dealValue.toFixed(2),
      stage,
      expectedCloseDate: dto.expectedCloseDate ?? null,
      salesRepresentativeId: dto.salesRepresentativeId ?? null,
      probability: (dto.probability ?? 0).toFixed(2),
      status: stage === 'closed-won' ? 'closed-won' : stage === 'closed-lost' ? 'closed-lost' : 'open',
      closedAt: stage.startsWith('closed') ? new Date() : null,
      dealPayload: {
        source: 'sales-automation',
      },
    });

    const saved = await this.dealRepository.save(entity);
    await this.emitAnalyticsEvent('sales.deal.created', {
      dealId: saved.id,
      value: saved.dealValue,
      stage: saved.stage,
      probability: saved.probability,
    }, saved.tenantId, saved.salesRepresentativeId);

    return saved;
  }

  async updateDeal(id: string, dto: UpdateSalesDealDto): Promise<SalesDealEntity> {
    const existing = await this.findDeal(id);
    if (!existing) {
      throw new NotFoundException(`Deal not found for id=${id}`);
    }

    if (dto.salesRepresentativeId) {
      await this.ensureEmployeeExists(dto.salesRepresentativeId);
    }

    const merged = this.dealRepository.merge(existing, {
      dealName: dto.dealName ?? existing.dealName,
      dealValue: dto.dealValue !== undefined ? dto.dealValue.toFixed(2) : existing.dealValue,
      stage: dto.stage ?? existing.stage,
      expectedCloseDate: dto.expectedCloseDate ?? existing.expectedCloseDate,
      salesRepresentativeId: dto.salesRepresentativeId ?? existing.salesRepresentativeId,
      probability: dto.probability !== undefined ? dto.probability.toFixed(2) : existing.probability,
      status: dto.status ?? existing.status,
      closedAt: dto.status && dto.status.startsWith('closed') ? new Date() : existing.closedAt,
    });

    const saved = await this.dealRepository.save(merged);
    await this.emitAnalyticsEvent('sales.deal.updated', {
      dealId: saved.id,
      status: saved.status,
      stage: saved.stage,
      probability: saved.probability,
    }, saved.tenantId, saved.salesRepresentativeId);

    return saved;
  }

  findAllTargets(): Promise<SalesTargetEntity[]> {
    return this.targetRepository.find({ order: { createdAt: 'DESC' } });
  }

  findTarget(id: string): Promise<SalesTargetEntity | null> {
    return this.targetRepository.findOne({ where: { id } });
  }

  async createTarget(dto: CreateSalesTargetDto): Promise<SalesTargetEntity> {
    if (dto.employeeId) {
      await this.ensureEmployeeExists(dto.employeeId);
    }

    const entity = this.targetRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      employeeId: dto.employeeId ?? null,
      targetPeriod: dto.targetPeriod,
      periodKey: dto.periodKey,
      targetValue: dto.targetValue.toFixed(2),
      achievedValue: (dto.achievedValue ?? 0).toFixed(2),
      isTeamTarget: dto.isTeamTarget ?? false,
      status: 'active',
      targetPayload: {
        source: 'sales-module',
      },
    });

    return this.targetRepository.save(entity);
  }

  async updateTarget(id: string, dto: UpdateSalesTargetDto): Promise<SalesTargetEntity> {
    const existing = await this.findTarget(id);
    if (!existing) {
      throw new NotFoundException(`Target not found for id=${id}`);
    }

    if (dto.employeeId) {
      await this.ensureEmployeeExists(dto.employeeId);
    }

    const merged = this.targetRepository.merge(existing, {
      employeeId: dto.employeeId ?? existing.employeeId,
      targetValue: dto.targetValue !== undefined ? dto.targetValue.toFixed(2) : existing.targetValue,
      achievedValue: dto.achievedValue !== undefined ? dto.achievedValue.toFixed(2) : existing.achievedValue,
      status: dto.status ?? existing.status,
    });

    return this.targetRepository.save(merged);
  }

  findAllCommissions(): Promise<SalesCommissionEntity[]> {
    return this.commissionRepository.find({ order: { createdAt: 'DESC' } });
  }

  async calculateCommission(dto: CalculateSalesCommissionDto): Promise<SalesCommissionEntity> {
    await this.ensureEmployeeExists(dto.employeeId);

    if (dto.dealId) {
      const deal = await this.findDeal(dto.dealId);
      if (!deal) {
        throw new NotFoundException(`Deal not found for id=${dto.dealId}`);
      }
    }

    if (dto.salesTargetId) {
      const target = await this.findTarget(dto.salesTargetId);
      if (!target) {
        throw new NotFoundException(`Sales target not found for id=${dto.salesTargetId}`);
      }
    }

    const baseCommission = this.computeBaseCommission(dto.baseAmount, dto.commissionRate, dto.commissionModel ?? 'percentage');

    const bonusSla = this.payrollService.calculateSixTierBonusSla({
      baseVariableBonus: baseCommission,
      achievementPercent: dto.achievementPercent,
      qualityScore: dto.qualityScore,
      attendanceScore: dto.attendanceScore,
      breachCount: dto.breachCount,
      currency: 'INR',
    });

    const finalCommission = baseCommission + bonusSla.finalBonus;

    const entity = this.commissionRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      employeeId: dto.employeeId,
      salesTargetId: dto.salesTargetId ?? null,
      dealId: dto.dealId ?? null,
      commissionModel: dto.commissionModel ?? 'percentage',
      commissionRate: dto.commissionRate.toFixed(4),
      baseAmount: dto.baseAmount.toFixed(2),
      calculatedCommission: finalCommission.toFixed(2),
      bonusTier: bonusSla.tier,
      payoutStatus: 'planned',
      payrollReferenceId: null,
      payoutDueDate: bonusSla.payoutEta.slice(0, 10),
      commissionPayload: {
        achievementPercent: dto.achievementPercent,
        baseCommission,
        bonusSla,
      },
    });

    const saved = await this.commissionRepository.save(entity);

    await this.emitAnalyticsEvent('sales.commission.calculated', {
      commissionId: saved.id,
      employeeId: saved.employeeId,
      finalCommission: saved.calculatedCommission,
      bonusTier: saved.bonusTier,
    }, saved.tenantId, saved.employeeId);

    this.logger.log(`Calculated commission id=${saved.id} employeeId=${saved.employeeId}`);
    return saved;
  }

  async syncCommissionToPayroll(id: string) {
    const commission = await this.commissionRepository.findOne({ where: { id } });
    if (!commission) {
      throw new NotFoundException(`Commission not found for id=${id}`);
    }

    const payoutPayload = {
      employeeId: commission.employeeId,
      targetBonus: Number(commission.calculatedCommission),
      source: 'sales-automation',
      payoutDueDate: commission.payoutDueDate,
      tier: commission.bonusTier,
    };

    const merged = this.commissionRepository.merge(commission, {
      payoutStatus: 'approved',
      commissionPayload: {
        ...commission.commissionPayload,
        payrollSync: {
          syncedAt: new Date().toISOString(),
          payload: payoutPayload,
        },
      },
    });

    const saved = await this.commissionRepository.save(merged);

    await this.emitAnalyticsEvent('sales.commission.synced-payroll', {
      commissionId: saved.id,
      payoutStatus: saved.payoutStatus,
      payload: payoutPayload,
    }, saved.tenantId, saved.employeeId);

    return {
      commissionId: saved.id,
      payoutStatus: saved.payoutStatus,
      payrollPayload: payoutPayload,
    };
  }

  async getSalesAnalyticsSummary() {
    const [leads, deals, targets, commissions, recruitmentJobs, recruitmentApplications] = await Promise.all([
      this.leadRepository.find(),
      this.dealRepository.find(),
      this.targetRepository.find(),
      this.commissionRepository.find(),
      this.recruitmentJobRepository.find(),
      this.recruitmentApplicationRepository.find(),
    ]);

    const closedWonDeals = deals.filter((deal) => deal.status === 'closed-won');
    const closedLostDeals = deals.filter((deal) => deal.status === 'closed-lost');

    const totalDealValue = deals.reduce((sum, deal) => sum + Number(deal.dealValue), 0);
    const wonDealValue = closedWonDeals.reduce((sum, deal) => sum + Number(deal.dealValue), 0);

    const totalTarget = targets.reduce((sum, target) => sum + Number(target.targetValue), 0);
    const totalAchieved = targets.reduce((sum, target) => sum + Number(target.achievedValue), 0);

    const totalCommission = commissions.reduce((sum, commission) => sum + Number(commission.calculatedCommission), 0);

    return {
      leadCount: leads.length,
      customerCount: await this.customerAccountRepository.count(),
      dealCount: deals.length,
      totalDealValue: this.round(totalDealValue),
      wonDealValue: this.round(wonDealValue),
      closedWonCount: closedWonDeals.length,
      closedLostCount: closedLostDeals.length,
      targetAchievementPercent: totalTarget > 0 ? this.round((totalAchieved / totalTarget) * 100, 3) : 0,
      totalCommission: this.round(totalCommission),
      recruitmentContext: {
        jobCount: recruitmentJobs.length,
        applicationCount: recruitmentApplications.length,
      },
      pipelineCounts: PIPELINE_STAGES.map((stage) => ({
        stage,
        count: leads.filter((lead) => lead.pipelineStage === stage).length,
      })),
    };
  }

  async getSalesTeamPerformance() {
    const deals = await this.dealRepository.find();
    const targets = await this.targetRepository.find();

    const byEmployee = new Map<string, {
      employeeId: string;
      dealValue: number;
      closedWon: number;
      totalDeals: number;
      targetValue: number;
      achievedValue: number;
    }>();

    for (const deal of deals) {
      const employeeId = deal.salesRepresentativeId;
      if (!employeeId) {
        continue;
      }

      const row = byEmployee.get(employeeId) ?? {
        employeeId,
        dealValue: 0,
        closedWon: 0,
        totalDeals: 0,
        targetValue: 0,
        achievedValue: 0,
      };

      row.totalDeals += 1;
      row.dealValue += Number(deal.dealValue);
      if (deal.status === 'closed-won') {
        row.closedWon += 1;
      }

      byEmployee.set(employeeId, row);
    }

    for (const target of targets) {
      if (!target.employeeId) {
        continue;
      }

      const row = byEmployee.get(target.employeeId) ?? {
        employeeId: target.employeeId,
        dealValue: 0,
        closedWon: 0,
        totalDeals: 0,
        targetValue: 0,
        achievedValue: 0,
      };

      row.targetValue += Number(target.targetValue);
      row.achievedValue += Number(target.achievedValue);
      byEmployee.set(target.employeeId, row);
    }

    return Array.from(byEmployee.values())
      .map((item) => ({
        ...item,
        dealValue: this.round(item.dealValue),
        winRate: item.totalDeals > 0 ? this.round((item.closedWon / item.totalDeals) * 100, 2) : 0,
        targetAchievementPercent: item.targetValue > 0 ? this.round((item.achievedValue / item.targetValue) * 100, 2) : 0,
      }))
      .sort((a, b) => b.dealValue - a.dealValue);
  }

  private async createLead(dto: CreateLeadDto, eventType: string): Promise<SalesLeadEntity> {
    if (dto.assignedTo) {
      await this.ensureEmployeeExists(dto.assignedTo);
    }

    const stage = dto.pipelineStage ?? 'new-lead';
    if (!PIPELINE_STAGES.includes(stage as PipelineStageCode)) {
      throw new BadRequestException('Invalid pipeline stage');
    }

    const score = dto.score ?? this.calculateLeadScore(dto);

    const entity = this.leadRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      source: dto.source,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      email: dto.email,
      phone: dto.phone ?? null,
      organization: dto.organization ?? null,
      assignedTo: dto.assignedTo ?? null,
      score: score.toFixed(2),
      status: 'open',
      pipelineStage: stage,
      nurturingStatus: 'active',
      notes: dto.notes ?? null,
      leadPayload: {
        capturedAt: new Date().toISOString(),
      },
    });

    const saved = await this.leadRepository.save(entity);
    await this.emitAnalyticsEvent(eventType, {
      leadId: saved.id,
      source: saved.source,
      score: saved.score,
      pipelineStage: saved.pipelineStage,
    }, saved.tenantId, saved.assignedTo);

    this.logger.log(`Created sales lead id=${saved.id} source=${saved.source}`);
    return saved;
  }

  private async ensureEmployeeExists(employeeId: string) {
    const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundException(`Employee not found for id=${employeeId}`);
    }
  }

  private calculateLeadScore(dto: CreateLeadDto): number {
    let score = 25;

    if (dto.phone) {
      score += 20;
    }

    if (dto.organization) {
      score += 15;
    }

    if (dto.source.toLowerCase().includes('website') || dto.source.toLowerCase().includes('campaign')) {
      score += 20;
    }

    if (dto.assignedTo) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private computeBaseCommission(baseAmount: number, commissionRate: number, model: string): number {
    if (model === 'fixed') {
      return commissionRate;
    }

    if (model === 'tiered') {
      if (baseAmount >= 1000000) {
        return baseAmount * ((commissionRate + 2) / 100);
      }

      if (baseAmount >= 500000) {
        return baseAmount * ((commissionRate + 1) / 100);
      }

      return baseAmount * (commissionRate / 100);
    }

    return baseAmount * (commissionRate / 100);
  }

  private async emitAnalyticsEvent(
    eventType: string,
    payload: Record<string, unknown>,
    tenantId: string | null,
    actorId: string | null,
  ) {
    const event = this.analyticsEventRepository.create({
      tenantId,
      module: 'sales-automation',
      eventType,
      actorId,
      eventPayload: payload,
    });

    await this.analyticsEventRepository.save(event);
  }

  private round(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
