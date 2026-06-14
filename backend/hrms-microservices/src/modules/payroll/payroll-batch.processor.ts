import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as os from 'node:os';
import { QUEUE_PAYROLL } from '../../common/queues/queue-names';
import { PayrollService } from './payroll.service';
import { NotificationService } from '../notification/notification.service';
import { AuditLogService, AuditAction } from '../../common/audit/audit-log.service';
import { fireAlertWebhookWithRetry, DlqAlertPayload } from '../../common/alerts/alert-webhook';

export interface PayrollBatchJobData {
  year:     number;
  month:    number;
  tenantId: string;
  /** Idempotency key — same key rejects duplicate enqueues via Redlock */
  lockKey:  string;
}

/**
 * PayrollBatchProcessor — dedicated BullMQ worker for payroll batch generation.
 *
 * Concurrency profile:
 *   concurrency=2 — payroll is transactional + DB-heavy; keep low.
 *   limiter: max 5 jobs per 10s — protects Postgres from burst writes.
 *
 * Every job emits:
 *  - structured logs (workerId tag for multi-worker correlation)
 *  - audit event: PAYROLL_BATCH_COMPLETE on success
 *  - notification enqueue: email to HR admin on success
 *  - DLQ alert webhook on terminal failure
 */
const PAYROLL_CONCURRENCY = Math.min(Number(process.env.PAYROLL_CONCURRENCY) || 2, 4);
const PAYROLL_LIMITER     = {
  max:      Number(process.env.PAYROLL_RATE_MAX)         || 5,
  duration: Number(process.env.PAYROLL_RATE_DURATION_MS) || 10_000,
};

@Processor(QUEUE_PAYROLL, { concurrency: PAYROLL_CONCURRENCY, limiter: PAYROLL_LIMITER })
export class PayrollBatchProcessor extends WorkerHost {
  private readonly logger   = new Logger(PayrollBatchProcessor.name);
  private readonly workerId = `${os.hostname()}-${process.pid}`;

  constructor(
    private readonly payrollService:      PayrollService,
    private readonly notificationService: NotificationService,
    private readonly auditLog:            AuditLogService,
  ) {
    super();
  }

  async process(job: Job<PayrollBatchJobData>): Promise<void> {
    const { year, month, tenantId } = job.data;
    const jobStart = Date.now();

    this.logger.log(
      `[JOB:${job.id}] PAYROLL_START year=${year} month=${month} ` +
      `tenant=${tenantId} attempt=${job.attemptsMade + 1}/${job.opts.attempts ?? 1} worker=${this.workerId}`,
    );

    // Delegate to the transactional service method.
    // PayrollService.generateBatch() owns the pessimistic lock + DB transaction.
    const batch = await this.payrollService.generateBatch(year, month);

    const durationMs = Date.now() - jobStart;
    this.logger.log(
      `[JOB:${job.id}] PAYROLL_COMPLETE year=${year} month=${month} ` +
      `batchId=${batch.id} tenant=${tenantId} durationMs=${durationMs} worker=${this.workerId}`,
    );

    // ── Audit: batch completed ─────────────────────────────────────────────
    await this.auditLog.log(AuditAction.PAYROLL_BATCH_COMPLETE, {
      tenantId,
      resourceType: 'payroll_batch',
      resourceId:   batch.id,
      metadata: {
        year,
        month,
        jobId:       job.id,
        durationMs,
        totalGross:  batch.totalGross,
        totalNet:    batch.totalNet,
        itemCount:   batch.items?.length ?? 0,
      },
    });

    // ── Notification: email HR admin ────────────────────────────────────────
    await this.sendPayrollCompletionNotification(job.id as string, batch, year, month, tenantId);
  }

  // ─── HR Admin Email Notification ─────────────────────────────────────────

  private async sendPayrollCompletionNotification(
    jobId: string,
    batch: { id: string; totalGross?: string; totalNet?: string },
    year: number,
    month: number,
    tenantId: string,
  ): Promise<void> {
    const hrEmail = process.env.PAYROLL_NOTIFY_EMAIL;
    if (!hrEmail) {
      this.logger.warn(
        `[JOB:${jobId}] PAYROLL_NOTIF_SKIP reason="PAYROLL_NOTIFY_EMAIL not set"`,
      );
      return;
    }

    try {
      const subject  = `✅ Payroll Batch Generated — ${month}/${year}`;
      const htmlBody = `
        <h2 style="color:#1f2937">Payroll Batch Complete</h2>
        <p>The payroll batch for <strong>${month}/${year}</strong> has been generated successfully.</p>
        <table style="border-collapse:collapse;width:100%;max-width:400px">
          <tr><td style="padding:6px 12px;background:#f9fafb;font-weight:600">Batch ID</td>
              <td style="padding:6px 12px">${batch.id}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9fafb;font-weight:600">Total Gross</td>
              <td style="padding:6px 12px">₹ ${batch.totalGross ?? '—'}</td></tr>
          <tr><td style="padding:6px 12px;background:#f9fafb;font-weight:600">Total Net</td>
              <td style="padding:6px 12px">₹ ${batch.totalNet ?? '—'}</td></tr>
        </table>
        <p style="margin-top:16px">Log in to approve and lock the batch: 
          <a href="${process.env.APP_URL ?? 'https://hrms.akuldravin.com'}/payroll">Open Payroll Module</a></p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">— Akul Dravin HRMS · Automated notification</p>
      `;

      const notifRecord = await this.notificationService.create({
        tenantId,
        userId:  tenantId, // system-level notification, no specific employee userId
        channel: 'email',
        type:    'PAYROLL_BATCH_COMPLETE',
        title:   subject,
        message: `Payroll batch ${month}/${year} generated. Gross: ${batch.totalGross}, Net: ${batch.totalNet}`,
        status:  'queued',
      });

      await this.notificationService.enqueue(
        notifRecord.id,
        'email',
        { to: hrEmail, subject, htmlBody },
        tenantId,
      );

      this.logger.log(
        `[JOB:${jobId}] PAYROLL_NOTIF_ENQUEUED notifId=${notifRecord.id} to=${hrEmail}`,
      );
    } catch (err: unknown) {
      // Notification failure never breaks the job result
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[JOB:${jobId}] PAYROLL_NOTIF_ENQUEUE_FAILED err=${msg}`);
    }
  }

  // ─── BullMQ Worker Events ─────────────────────────────────────────────────

  @OnWorkerEvent('failed')
  onFailed(job: Job<PayrollBatchJobData>, error: Error): void {
    const { year, month, tenantId } = job.data;
    const payload: DlqAlertPayload = {
      type:         'DLQ_EVENT',
      jobId:        job.id,
      queue:        QUEUE_PAYROLL,
      requestId:    `payroll:${tenantId}:${year}-${String(month).padStart(2, '0')}`,
      attemptsMade: job.attemptsMade,
      maxAttempts:  job.opts.attempts,
      errorMessage: error.message,
      timestamp:    new Date().toISOString(),
      remediation:  `Replay via POST /payroll/batch/job/${job.id}/retry or check DB state`,
    };

    this.logger.error(
      JSON.stringify({ event: 'PAYROLL_DLQ_TERMINAL_FAILURE', worker: this.workerId, ...payload }),
    );

    // Async audit — do not await to avoid blocking the worker event handler
    this.auditLog.log(AuditAction.PAYROLL_BATCH_ENQUEUED, {
      tenantId,
      metadata: { event: 'PAYROLL_BATCH_FAILED', year, month, jobId: job.id, error: error.message },
    }).catch(() => { /* audit failure already logged by AuditLogService */ });

    fireAlertWebhookWithRetry(payload, 3, (msg) => this.logger.warn(msg)).catch(() => {
      // Already logged inside fireAlertWebhookWithRetry
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<PayrollBatchJobData>): void {
    const { year, month, tenantId } = job.data;
    this.logger.log(
      `[JOB:${job.id}] PAYROLL_WORKER_COMPLETED year=${year} month=${month} ` +
      `tenant=${tenantId} worker=${this.workerId}`,
    );
  }
}
