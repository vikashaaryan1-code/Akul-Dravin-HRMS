import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationWorkflowEntity } from '../../database/entities/automation-workflow.entity';
import { CreateWorkflowAutomationDto } from './dto/create-workflow-automation.dto';
import { UpdateWorkflowAutomationDto } from './dto/update-workflow-automation.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';

@Injectable()
export class WorkflowAutomationService {
  private readonly logger = new Logger(WorkflowAutomationService.name);

  constructor(
    @InjectRepository(AutomationWorkflowEntity)
    private readonly workflowRepository: Repository<AutomationWorkflowEntity>,
  ) {}

  findAll(): Promise<AutomationWorkflowEntity[]> {
    return this.workflowRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<AutomationWorkflowEntity | null> {
    return this.workflowRepository.findOne({ where: { id } });
  }

  async create(dto: CreateWorkflowAutomationDto): Promise<AutomationWorkflowEntity> {
    const entity = this.workflowRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      workflowCode: dto.workflowCode,
      name: dto.name,
      module: dto.module,
      triggerType: dto.triggerType,
      status: dto.status ?? 'active',
      successRate: '98.00',
      runCount: 0,
      workflowConfig: dto.workflowConfig ?? {},
      lastRunAt: null,
    });

    const saved = await this.workflowRepository.save(entity);
    this.logger.log(`Created workflow code=${saved.workflowCode}`);
    return saved;
  }

  async update(id: string, dto: UpdateWorkflowAutomationDto): Promise<AutomationWorkflowEntity> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Workflow not found for id=${id}`);
    }

    const merged = this.workflowRepository.merge(existing, {
      name: dto.name ?? existing.name,
      status: dto.status ?? existing.status,
      successRate: dto.successRate !== undefined ? dto.successRate.toFixed(2) : existing.successRate,
      workflowConfig: dto.workflowConfig ?? existing.workflowConfig,
    });

    const updated = await this.workflowRepository.save(merged);
    this.logger.log(`Updated workflow id=${id} status=${updated.status}`);
    return updated;
  }

  async triggerWorkflow(id: string, dto: TriggerWorkflowDto) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Workflow not found for id=${id}`);
    }

    const updatedRunCount = existing.runCount + 1;
    const currentSuccessRate = Number(existing.successRate);
    const smoothedRate = Math.min(99.99, Math.max(85, currentSuccessRate + 0.05));

    const merged = this.workflowRepository.merge(existing, {
      runCount: updatedRunCount,
      successRate: smoothedRate.toFixed(2),
      lastRunAt: new Date(),
      status: existing.status,
    });

    await this.workflowRepository.save(merged);
    this.logger.log(`Triggered workflow id=${id} reason=${dto.triggerReason ?? 'manual-trigger'}`);

    return {
      workflowId: id,
      triggered: true,
      triggerReason: dto.triggerReason ?? 'manual-trigger',
      runCount: updatedRunCount,
      successRate: smoothedRate.toFixed(2),
      payload: dto.payload ?? {},
      triggeredAt: new Date().toISOString(),
    };
  }

  listSystemAlerts() {
    return [
      {
        code: 'AUT-101',
        severity: 'medium',
        message: 'Document workflow retry threshold reached for 3 templates.',
      },
      {
        code: 'AUT-201',
        severity: 'low',
        message: 'Payroll automation queue latency above baseline by 8%.',
      },
      {
        code: 'AUT-301',
        severity: 'high',
        message: 'Recruitment workflow missed SLA in one tenant environment.',
      },
    ];
  }
}
