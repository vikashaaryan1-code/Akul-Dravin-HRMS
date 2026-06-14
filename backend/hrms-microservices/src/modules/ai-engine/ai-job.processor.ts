import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_AI_JOBS } from '../../common/queues/queue-names';
import { AiEngineService } from '../../modules/ai-engine/ai-engine.service';

export type AiJobType = 'chat' | 'insight' | 'report' | 'summarize' | 'classify';

export interface AiJobData {
  type: AiJobType;
  tenantId: string;
  userId?: string;
  payload: Record<string, unknown>;
  callbackNotificationId?: string;
  webhookUrl?: string;
}

/**
 * AiJobProcessor — async AI jobs that take > 2s.
 * Concurrency: 2 (AI tokens are expensive — limit parallelism).
 * Results are persisted back and/or pushed via WebSocket.
 */
@Processor(QUEUE_AI_JOBS, { concurrency: 2 })
export class AiJobProcessor extends WorkerHost {
  private readonly logger = new Logger(AiJobProcessor.name);

  constructor(private readonly aiService: AiEngineService) {
    super();
  }

  async process(job: Job<AiJobData>): Promise<Record<string, unknown>> {
    const { type, tenantId, userId, payload } = job.data;
    this.logger.log(`AI_JOB start job=${job.id} type=${type} tenant=${tenantId}`);

    let result: Record<string, unknown>;

    switch (type) {
      case 'insight':
        result = await this.aiService.generateInsight({
          tenantId,
          type: (payload.insightType as any) ?? 'general',
          context: payload.context as any,
        });
        break;

      case 'report':
        result = await this.aiService.generateReport(tenantId, payload.reportType as string ?? 'general');
        break;

      case 'chat':
        result = await this.aiService.chat({
          tenantId,
          userId: userId ?? 'system',
          messages: payload.messages as any,
          context: payload.context as any,
        });
        break;

      default:
        result = { skipped: true, reason: `Unknown AI job type: ${type}` };
    }

    this.logger.log(`AI_JOB done job=${job.id} type=${type}`);

    // Fire-and-forget webhook callback if provided
    if (job.data.webhookUrl) {
      fetch(job.data.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, type, tenantId, result }),
        signal: AbortSignal.timeout(5_000),
      }).catch(err => this.logger.warn(`AI_JOB webhook failed: ${String(err)}`));
    }

    return result;
  }
}
