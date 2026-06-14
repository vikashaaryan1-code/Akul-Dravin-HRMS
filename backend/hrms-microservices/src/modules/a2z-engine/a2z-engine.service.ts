import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { evaluate } from 'mathjs';
import { A2zWorkflowEntity, A2zRolloutRequestEntity } from '../../database/entities/a2z-engine.entities';
import { QUEUE_AUTOMATION } from '../../common/queues/queue-names';

@Injectable()
export class A2zEngineService {
  private readonly logger = new Logger(A2zEngineService.name);

  constructor(
    @InjectRepository(A2zWorkflowEntity)
    private readonly workflowRepo: Repository<A2zWorkflowEntity>,
    @InjectRepository(A2zRolloutRequestEntity)
    private readonly requestRepo: Repository<A2zRolloutRequestEntity>,
    @InjectQueue(QUEUE_AUTOMATION)
    private readonly rolloutQueue: Queue,
  ) {}

  private readonly fallbackWorkflows = [
    {
      id: 'enterprise-rollout',
      title: 'Enterprise Atlas Rollout',
      description: 'The standard multi-module command center setup.',
      steps: [
        {
          id: 'bundle',
          label: 'Service Bundle',
          type: 'select',
          options: ['Complete Atlas', 'People Mesh', 'Finance Stack', 'Growth Grid'],
        },
        {
          id: 'capacity',
          label: 'Workforce Capacity',
          type: 'select',
          options: ['0-50', '51-200', '201-1000', '1000+'],
        },
        {
          id: 'regions',
          label: 'Primary Regions',
          type: 'multiselect',
          options: ['India', 'UAE', 'USA', 'UK', 'Singapore'],
        },
      ],
    },
  ];

  async getWorkflows() {
    const dbWorkflows = await this.workflowRepo.find({ where: { isActive: true } });
    return dbWorkflows.length > 0 ? dbWorkflows : this.fallbackWorkflows;
  }

  generatePreview(config: any) {
    const moduleCountFormula = 'capacity_val * 0.1 + base_modules';
    const capacityVal = config.capacity === '1000+' ? 100 : config.capacity === '201-1000' ? 50 : 20;
    const baseModules = config.bundle === 'Complete Atlas' ? 10 : 3;

    let modules = 0;
    try {
      if (!/^[0-9+\-*/().a-zA-Z\s_]+$/.test(moduleCountFormula)) {
        throw new Error('Invalid formula structure');
      }
      modules = Math.ceil(
        evaluate(moduleCountFormula, { capacity_val: capacityVal, base_modules: baseModules }),
      );
    } catch {
      modules = 5;
    }

    const timeline = config.bundle === 'Complete Atlas' ? '60 Days' : '15 Days';

    return {
      estimatedModules: modules,
      targetTimeline: timeline,
      readinessScore: 94,
      phases: [
        { phase: 'Discovery', status: 'ready', eta: 'T+24h' },
        { phase: 'Blueprint', status: 'queued', eta: 'T+48h' },
        { phase: 'Execution', status: 'queued', eta: 'T+72h' },
      ],
    };
  }

  async submitRollout(config: any, userId?: string, companyId?: string) {
    const correlationId = randomUUID();

    const request = this.requestRepo.create({
      workflowId: config.workflowId ?? 'enterprise-rollout',
      config,
      userId,
      companyId,
      status: {
        step: 'submitted',
        progress: 0,
        lastUpdated: new Date(),
      },
    });

    const saved = await this.requestRepo.save(request);
    this.logger.log(
      `Rollout request persisted: id=${saved.id} tenant=${companyId ?? 'unknown'} correlationId=${correlationId}`,
    );

    await this.rolloutQueue.add(
      'process-rollout',
      // tenantId + correlationId flow through to the processor for log correlation
      { requestId: saved.id, tenantId: companyId, correlationId },
      {
        jobId: `rollout:${saved.id}`,   // Deterministic ID — prevents duplicate jobs
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,          // Keep last 100 completed jobs for audit
        removeOnFail: 50,               // Keep last 50 failed jobs for DLQ inspection
      },
    );
    this.logger.log(
      `Rollout job enqueued: requestId=${saved.id} tenant=${companyId ?? 'unknown'} correlationId=${correlationId}`,
    );

    return { requestId: saved.id, correlationId, status: 'submitted' };
  }

  async getRolloutStatus(requestId: string) {
    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request) {
      return null;
    }
    return { requestId: request.id, status: request.status };
  }
}
