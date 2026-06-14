import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_NOTIFICATIONS } from '../../queues/queue-names';
import { QueueJobEnvelope, NotificationPayload, NOTIFICATION_JOB } from '../../queues/queue-job.types';
import { DeadLetterService } from '../../queues/dead-letter.service';

/**
 * NOTIFICATION QUEUE PROCESSOR
 *
 * Channels: email | slack | webhook | in_app | sms
 * Idempotency TTL: 24h — prevents duplicate sends on retry storms
 * Concurrency: 10 — I/O-bound, parallelizes safely
 */
@Injectable()
@Processor(QUEUE_NOTIFICATIONS, { concurrency: 10 })
export class NotificationQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationQueueProcessor.name);
  private readonly IDEMPOTENCY_TTL = 86400;

  constructor(private readonly dlqService: DeadLetterService) { super(); }

  async process(job: Job<QueueJobEnvelope<NotificationPayload>>): Promise<void> {
    const { tenantId, correlationId, idempotencyKey } = job.data;
    const attempt = job.attemptsMade + 1;
    const logCtx  = `[NOTIFY|${tenantId}|${job.name}|cid=${correlationId}|#${attempt}]`;

    if (await this.dlqService.checkIdempotency(idempotencyKey, this.IDEMPOTENCY_TTL)) {
      this.logger.warn(`${logCtx} SKIPPED — duplicate delivery`);
      return;
    }

    try {
      const start = Date.now();
      if (job.name === NOTIFICATION_JOB.SEND) {
        const { channel, recipientId, template, webhookUrl } = job.data.payload;
        this.logger.log(`${logCtx} SEND channel=${channel} recipient=${recipientId} template=${template} webhook=${webhookUrl ?? '-'}`);
        // In production: EmailService / SlackService / WebhookDeliveryService
      }
      this.logger.log(`${logCtx} SUCCESS — ${Date.now() - start}ms`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (attempt >= (job.opts.attempts ?? 3)) {
        await this.dlqService.record({
          queueName: QUEUE_NOTIFICATIONS, jobName: job.name, tenantId, idempotencyKey,
          payload: job.data as QueueJobEnvelope<unknown>,
          errorMessage: errMsg, attempts: attempt,
        });
      }
      throw err;
    }
  }
}
