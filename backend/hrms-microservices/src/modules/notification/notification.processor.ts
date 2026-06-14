import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as os from 'node:os';
import { QUEUE_NOTIFICATIONS } from '../../common/queues/queue-names';
import { EmailSenderService } from '../../common/email/email-sender.service';

export interface NotificationJobData {
  /** DB entity ID of the notification record */
  notificationId: string;
  /** Dispatch channel: 'email' | 'sms' | 'push' | 'in-app' */
  channel: string;
  /** Arbitrary payload passed to the dispatch provider */
  payload: Record<string, unknown>;
  tenantId: string;
}

// Email payload shape
interface EmailPayload {
  to?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
}

// SMS payload shape
interface SmsPayload {
  /** E.164 phone number, e.g. +919876543210 */
  to?: string;
  body?: string;
}

// In-app payload shape
interface InAppPayload {
  userId?: string;
  title?: string;
  body?: string;
  href?: string;
}

/**
 * NotificationProcessor — BullMQ worker for async notification dispatch.
 * 
 * Supported channels (MVP):
 *   - 'email' → AWS SES (via EmailSenderService)
 *   - other   → logged and skipped (future: push / SMS)
 *
 * Concurrency: 10 workers, max 50 jobs/5s to stay within SES sending limits.
 */
const NOTIF_CONCURRENCY = Math.min(Number(process.env.NOTIF_CONCURRENCY) || 10, 20);
const NOTIF_LIMITER = {
  max:      Number(process.env.NOTIF_RATE_MAX)         || 50,
  duration: Number(process.env.NOTIF_RATE_DURATION_MS) || 5_000,
};

@Processor(QUEUE_NOTIFICATIONS, { concurrency: NOTIF_CONCURRENCY, limiter: NOTIF_LIMITER })
export class NotificationProcessor extends WorkerHost {
  private readonly logger   = new Logger(NotificationProcessor.name);
  private readonly workerId = `${os.hostname()}-${process.pid}`;

  constructor(private readonly emailSender: EmailSenderService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, channel, payload, tenantId } = job.data;

    this.logger.log(
      `[JOB:${job.id}] NOTIF_START notificationId=${notificationId} ` +
      `channel=${channel} tenant=${tenantId} worker=${this.workerId}`,
    );

    if (channel === 'email') {
      await this.dispatchEmail(job.id as string, notificationId, payload as EmailPayload);
    } else if (channel === 'sms') {
      await this.dispatchSms(job.id as string, notificationId, payload as SmsPayload);
    } else if (channel === 'in-app') {
      await this.dispatchInApp(job.id as string, notificationId, payload as InAppPayload);
    } else if (channel === 'push') {
      this.logger.warn(
        `[JOB:${job.id}] NOTIF_PUSH_PENDING notificationId=${notificationId} ` +
        `— push channel requires FCM/APNs integration (Phase V2)`,
      );
    } else {
      this.logger.warn(
        `[JOB:${job.id}] NOTIF_CHANNEL_UNKNOWN channel=${channel} ` +
        `notificationId=${notificationId} — skipped`,
      );
    }

    this.logger.log(
      `[JOB:${job.id}] NOTIF_COMPLETE notificationId=${notificationId} channel=${channel}`,
    );
  }

  private async dispatchEmail(
    jobId: string,
    notificationId: string,
    payload: EmailPayload,
  ): Promise<void> {
    const to = payload.to;
    if (!to) {
      this.logger.warn(
        `[JOB:${jobId}] NOTIF_EMAIL_SKIP notificationId=${notificationId} reason="payload.to missing"`,
      );
      return;
    }

    const result = await this.emailSender.send({
      to,
      subject:  payload.subject  ?? '(no subject)',
      htmlBody: payload.htmlBody ?? payload.textBody ?? '',
      textBody: payload.textBody,
    });

    if (result.skipped) {
      this.logger.warn(
        `[JOB:${jobId}] NOTIF_EMAIL_SKIPPED notificationId=${notificationId} ` +
        `reason="AWS SES not configured (local dev)"`,
      );
    } else {
      this.logger.log(
        `[JOB:${jobId}] NOTIF_EMAIL_SENT notificationId=${notificationId} ` +
        `to=${to} messageId=${result.messageId}`,
      );
    }
  }

  // ── SMS channel (skeleton — requires Twilio env vars) ─────────────────────
  private async dispatchSms(
    jobId: string,
    notificationId: string,
    payload: SmsPayload,
  ): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn(
        `[JOB:${jobId}] NOTIF_SMS_SKIP notificationId=${notificationId} ` +
        `reason="Twilio not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)"`,
      );
      return;
    }

    const to = payload.to;
    if (!to) {
      this.logger.warn(
        `[JOB:${jobId}] NOTIF_SMS_SKIP notificationId=${notificationId} reason="payload.to missing"`,
      );
      return;
    }

    try {
      // Twilio REST API — no SDK required
      const url  = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To:   to,
        From: fromNumber,
        Body: payload.body ?? '(no message)',
      });

      const response = await fetch(url, {
        method:  'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(
          `[JOB:${jobId}] NOTIF_SMS_FAILED notificationId=${notificationId} ` +
          `status=${response.status} body=${text.slice(0, 200)}`,
        );
      } else {
        this.logger.log(
          `[JOB:${jobId}] NOTIF_SMS_SENT notificationId=${notificationId} to=${to}`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[JOB:${jobId}] NOTIF_SMS_ERROR notificationId=${notificationId} error="${msg}"`,
      );
    }
  }

  // ── In-app channel (logged — real-time via WebSocket gateway) ─────────────
  private dispatchInApp(
    jobId: string,
    notificationId: string,
    payload: InAppPayload,
  ): void {
    /**
     * In-app notifications are delivered via the ControlCenterGateway WebSocket.
     * The notification record is already persisted in the DB before this job runs.
     * Clients poll GET /notifications or receive real-time push via WS subscription.
     * No additional HTTP call is needed here — just log for audit.
     */
    this.logger.log(
      `[JOB:${jobId}] NOTIF_IN_APP notificationId=${notificationId} ` +
      `userId=${payload.userId ?? 'broadcast'} title="${payload.title ?? ''}"`
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<NotificationJobData>, error: Error): void {
    this.logger.warn(
      `[JOB:${job.id}] NOTIF_FAILED notificationId=${job.data.notificationId} ` +
      `channel=${job.data.channel} error="${error.message}" worker=${this.workerId}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<NotificationJobData>): void {
    this.logger.debug(
      `[JOB:${job.id}] NOTIF_WORKER_COMPLETED notificationId=${job.data.notificationId} worker=${this.workerId}`,
    );
  }
}
