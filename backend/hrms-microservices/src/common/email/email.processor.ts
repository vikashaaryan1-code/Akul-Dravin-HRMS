import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_EMAILS } from '../../common/queues/queue-names';
import { EmailSenderService } from '../email/email-sender.service';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, unknown>;
  tenantId?: string;
  notificationId?: string;
  dlq?: boolean;
  dlqReason?: string;
  dlqAt?: string;
}

/**
 * EmailProcessor — BullMQ worker for the 'emails' queue.
 * Concurrency: 5 parallel workers.
 * Retry: 3 attempts with exponential backoff.
 * DLQ: Failed jobs after max retries are flagged with dlq:true metadata.
 */
@Processor(QUEUE_EMAILS, { concurrency: 5 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailSender: EmailSenderService) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<{ success: boolean; sentAt: string }> {
    const { to, subject, html, text, template, variables } = job.data;
    const recipients = Array.isArray(to) ? to : [to];

    this.logger.log(`EMAIL_JOB start job=${job.id} to=${recipients.join(',')} subject="${subject}"`);

    try {
      const body = html ?? text ?? this.renderTemplate(template, variables);

      await this.emailSender.send({
        to: recipients,
        subject,
        htmlBody: body,
      });

      this.logger.log(`EMAIL_JOB done job=${job.id}`);
      return { success: true, sentAt: new Date().toISOString() };
    } catch (err) {
      this.logger.error(`EMAIL_JOB failed job=${job.id}: ${String(err)}`);

      // Mark as DLQ after final attempt
      if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
        this.logger.warn(`EMAIL_DLQ job=${job.id} moving to dead-letter`);
        await job.updateData({ ...job.data, dlq: true, dlqReason: String(err), dlqAt: new Date().toISOString() });
      }
      throw err; // re-throw so BullMQ tracks failure
    }
  }

  private renderTemplate(template?: string, vars?: Record<string, unknown>): string {
    if (!template) return '';
    let result = template;
    if (vars) {
      for (const [key, val] of Object.entries(vars)) {
        result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(val ?? ''));
      }
    }
    return result;
  }
}
