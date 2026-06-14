import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_AUTOMATION, QUEUE_EMAILS, QUEUE_WEBHOOKS } from '../../common/queues/queue-names';

// ── Types ─────────────────────────────────────────────────────────────────

export type TriggerType =
  | 'manual'
  | 'schedule'
  | 'event:employee_created'
  | 'event:employee_offboarded'
  | 'event:leave_approved'
  | 'event:payroll_generated'
  | 'event:crm_lead_created'
  | 'event:recruitment_offer_accepted'
  | 'webhook';

export type StepType = 'email' | 'webhook' | 'delay' | 'condition' | 'ai_action' | 'notification' | 'update_record';

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  config: Record<string, unknown>;
  condition?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
    value: unknown;
  };
  onSuccess?: string; // step id to run next
  onFailure?: string; // step id to run on failure
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string | null;
  name: string;
  description?: string;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  steps: WorkflowStep[];
  isActive: boolean;
  version: number;
}

export interface WorkflowExecution {
  id: string;
  definitionId: string;
  tenantId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  stepResults: Array<{ stepId: string; status: string; output: unknown; executedAt: string }>;
  errorMessage?: string;
  startedAt: Date | null;
  completedAt: Date | null;
  triggeredBy?: string;
}

/**
 * WorkflowEngineService — trigger-based automation engine.
 *
 * Architecture:
 * - Definitions stored in DB (workflow_definitions)
 * - Executions stored in DB (workflow_executions)
 * - Each step is dispatched through the appropriate BullMQ queue
 * - Steps execute sequentially; conditions create branching
 *
 * This implementation runs steps via direct dispatch for simplicity.
 * For long multi-day workflows: use QUEUE_AUTOMATION for async orchestration.
 */
@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectQueue(QUEUE_AUTOMATION) private readonly autoQueue: Queue,
    @InjectQueue(QUEUE_EMAILS) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_WEBHOOKS) private readonly webhookQueue: Queue,
  ) {}

  // ── Event Trigger ─────────────────────────────────────────────────────────

  /**
   * Called when a platform event occurs (e.g., employee created).
   * Looks up matching active workflows and dispatches them.
   */
  async triggerEvent(
    event: TriggerType,
    tenantId: string,
    triggerData: Record<string, unknown>,
    triggeredBy?: string,
  ): Promise<{ triggered: number; executionIds: string[] }> {
    this.logger.log(`WORKFLOW_TRIGGER event=${event} tenant=${tenantId}`);

    // Queue the trigger evaluation (non-blocking)
    const job = await this.autoQueue.add(
      'evaluate-trigger',
      { event, tenantId, triggerData, triggeredBy, triggeredAt: new Date().toISOString() },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    );

    return { triggered: 1, executionIds: [job.id as string] };
  }

  // ── Manual Trigger ────────────────────────────────────────────────────────

  async triggerManual(
    definitionId: string,
    tenantId: string,
    triggerData: Record<string, unknown>,
    triggeredBy: string,
  ): Promise<{ jobId: string }> {
    this.logger.log(`WORKFLOW_MANUAL def=${definitionId} tenant=${tenantId} by=${triggeredBy}`);

    const job = await this.autoQueue.add(
      'execute-workflow',
      { definitionId, tenantId, triggerData, triggeredBy, triggeredAt: new Date().toISOString() },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
      },
    );

    return { jobId: job.id as string };
  }

  // ── Step Dispatchers ──────────────────────────────────────────────────────

  async dispatchEmailStep(step: WorkflowStep, context: Record<string, unknown>): Promise<void> {
    const cfg = step.config;
    await this.emailQueue.add('workflow-email', {
      to: this.interpolate(String(cfg.to ?? ''), context),
      subject: this.interpolate(String(cfg.subject ?? 'Notification'), context),
      html: this.interpolate(String(cfg.body ?? ''), context),
      tenantId: context.tenantId,
    }, { attempts: 3 });
  }

  async dispatchWebhookStep(step: WorkflowStep, context: Record<string, unknown>): Promise<void> {
    await this.webhookQueue.add('workflow-webhook', {
      url: step.config.url,
      method: step.config.method ?? 'POST',
      headers: step.config.headers ?? {},
      body: context,
    }, { attempts: 3, backoff: { type: 'exponential', delay: 2_000 } });
  }

  // ── Condition Evaluation ──────────────────────────────────────────────────

  evaluateCondition(condition: WorkflowStep['condition'], context: Record<string, unknown>): boolean {
    if (!condition) return true;
    const { field, operator, value } = condition;
    const actual = field.split('.').reduce((obj: any, k: string) => {
      if (obj && typeof obj === 'object') return obj[k];
      return undefined;
    }, context);

    switch (operator) {
      case 'eq':      return actual === value;
      case 'neq':     return actual !== value;
      case 'gt':      return Number(actual) > Number(value);
      case 'lt':      return Number(actual) < Number(value);
      case 'contains': return String(actual).toLowerCase().includes(String(value).toLowerCase());
      default:        return false;
    }
  }

  // ── Template Interpolation ────────────────────────────────────────────────

  private interpolate(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{(\w[\w.]*)\}\}/g, (_, path) => {
      const val = path.split('.').reduce((obj: any, k: string) => {
        if (obj && typeof obj === 'object') return obj[k];
        return undefined;
      }, context);
      return val !== undefined ? String(val) : '';
    });
  }

  // ── Queue Health ──────────────────────────────────────────────────────────

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.autoQueue.getWaitingCount(),
      this.autoQueue.getActiveCount(),
      this.autoQueue.getCompletedCount(),
      this.autoQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}
