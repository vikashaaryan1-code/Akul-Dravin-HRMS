import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_AUTOMATION } from '../../common/queues/queue-names';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { DomainEventService } from '../../common/events/domain-event.service';

export interface WorkflowExecutionJob {
  workflowId: string;
  triggerEvent: string;
  payload: any;
  tenantId: string;
}

@Injectable()
export class WorkflowExecutorService {
  private readonly logger = new Logger(WorkflowExecutorService.name);

  constructor(
    @InjectQueue(QUEUE_AUTOMATION) private readonly workflowQueue: Queue,
    private readonly aiEngine: AiEngineService,
    private readonly eventBus: DomainEventService,
  ) {}

  /**
   * Orchestrates the execution of a multi-step workflow.
   * Jobs are enqueued into BullMQ for resilient, asynchronous execution.
   */
  async execute(job: WorkflowExecutionJob) {
    this.logger.log(`Enqueuing workflow execution workflowId=${job.workflowId} event=${job.triggerEvent}`);
    
    // In a real system, we would fetch the workflow definition here to validate.
    // For the Enterprise SaaS core, we enqueue the raw execution intent.
    const bullJob = await this.workflowQueue.add('execute-steps', job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });

    return { jobId: bullJob.id, status: 'QUEUED' };
  }

  /**
   * Handles individual step execution logic (stub).
   * Called by the BullMQ processor.
   */
  async processStep(step: any, context: any) {
    this.logger.debug(`Processing workflow step type=${step.type} name="${step.name}"`);
    
    switch (step.type) {
      case 'email':
        return this.sendEmail(step.config, context);
      case 'webhook':
        return this.callWebhook(step.config, context);
      case 'ai_action':
        return this.triggerAiAction(step.config, context);
      case 'ai_decision':
        return this.processAiDecisionNode(step.config, context);
      default:
        this.logger.warn(`Unknown step type: ${step.type}`);
        return { success: false, error: 'UNKNOWN_TYPE' };
    }
  }

  /**
   * AI Decision Node: Uses LLM reasoning to decide the next path in a workflow.
   * "Fully Automatic A2Z" decision orchestration.
   */
  private async processAiDecisionNode(config: any, context: any) {
    this.logger.log(`Executing AI Decision Node: "${config.prompt}"`);

    const result = await this.aiEngine.chat({
      tenantId: context.tenantId,
      userId: 'system-automation',
      messages: [
        { role: 'system', content: 'You are a workflow decision engine. Analyze the context and output ONLY valid JSON: { "decision": "path_a" | "path_b", "reasoning": "string" }' },
        { role: 'user', content: `Context: ${JSON.stringify(context.payload)}\n\nGoal: ${config.prompt}` }
      ],
      context: { module: 'automation', workflowId: context.workflowId }
    });

    try {
      const decision = JSON.parse(result.message.content);
      await this.eventBus.publish('WORKFLOW_STEP_COMPLETED', context.tenantId, {
        workflowId: context.workflowId,
        stepType: 'ai_decision',
        outcome: decision.decision
      });
      return { success: true, ...decision };
    } catch (err) {
      this.logger.error('Failed to parse AI decision output', err);
      return { success: false, error: 'PARSING_ERROR' };
    }
  }

  private async sendEmail(config: any, context: any) {
    // Integration with SES or Mailgun goes here
    return { success: true, provider: 'aws-ses' };
  }

  private async callWebhook(config: any, context: any) {
    // Standard axios/fetch call to external URL
    return { success: true, statusCode: 200 };
  }

  private async triggerAiAction(config: any, context: any) {
    // Integration with AiEngineService
    return { success: true, insightGenerated: true };
  }
}
