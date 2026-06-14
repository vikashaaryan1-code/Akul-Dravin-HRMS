import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import * as os from 'node:os';
import { A2zRolloutRequestEntity } from '../../database/entities/a2z-engine.entities';
import { fireAlertWebhookWithRetry, DlqAlertPayload } from '../../common/alerts/alert-webhook';
import { QUEUE_AUTOMATION } from '../../common/queues/queue-names';
import { metrics } from '../../common/metrics/metrics.registry';

/**
 * Worker options — both concurrency and rate limiter are applied at the
 * Worker level (BullMQ v5+ / @nestjs/bullmq v11).
 * Tunable via env vars; safe defaults for a single-node deployment.
 * Hard cap on concurrency prevents accidental overload from bad config.
 *
 * Rate limiter: max BULLMQ_RATE_MAX jobs per BULLMQ_RATE_DURATION_MS ms.
 * Workers sleep when the limit is reached instead of fetching new jobs.
 */
const WORKER_CONCURRENCY = Math.min(Number(process.env.BULLMQ_CONCURRENCY) || 2, 10);
const WORKER_LIMITER = {
  max: Number(process.env.BULLMQ_RATE_MAX) || 10,
  duration: Number(process.env.BULLMQ_RATE_DURATION_MS) || 5000,
};

@Processor(QUEUE_AUTOMATION, { concurrency: WORKER_CONCURRENCY, limiter: WORKER_LIMITER })
export class A2zRolloutProcessor extends WorkerHost {
  private readonly logger = new Logger(A2zRolloutProcessor.name);
  /** Stable identity tag for multi-worker log correlation */
  private readonly workerId = `${os.hostname()}-${process.pid}`;

  constructor(
    @InjectRepository(A2zRolloutRequestEntity)
    private readonly requestRepo: Repository<A2zRolloutRequestEntity>,
  ) {
    super();
  }

  async process(job: Job<{ requestId: string; tenantId?: string; correlationId?: string }>): Promise<void> {
    const { requestId, tenantId = 'unknown', correlationId = job.id } = job.data;
    const startNs = process.hrtime.bigint();
    // Structured context tag included on every log line for log-aggregator correlation
    const ctx = `tenant=${tenantId} correlationId=${correlationId}`;

    metrics.jobsTotal.inc({ queue: QUEUE_AUTOMATION, status: 'started' });
    this.logger.log(
      `[JOB:${job.id}] START requestId=${requestId} attempt=${job.attemptsMade + 1}/${job.opts.attempts ?? 1} worker=${this.workerId} ${ctx}`,
    );

    try {
      const request = await this.requestRepo.findOne({ where: { id: requestId } });
      if (!request) {
        this.logger.warn(`[JOB:${job.id}] Rollout request ${requestId} not found – skipping.`);
        metrics.jobsTotal.inc({ queue: QUEUE_AUTOMATION, status: 'completed' });
        return;
      }

      // ── Idempotency guard ─────────────────────────────────────────────────────
      // If a previous attempt already completed this job (e.g. worker restart),
      // skip re-processing to prevent duplicate stage transitions.
      if (request.status?.step === 'execution' && request.status?.progress === 100) {
        this.logger.warn(
          `[JOB:${job.id}] Request ${requestId} already completed – skipping duplicate run.`,
        );
        metrics.jobsTotal.inc({ queue: QUEUE_AUTOMATION, status: 'completed' });
        return;
      }

      const stages = ['discovery', 'blueprint', 'execution'] as const;
      const startStep = stages.indexOf(request.status?.step as typeof stages[number]);
      // Resume from the last incomplete stage (idempotent re-run after partial failure)
      const resumeFrom = startStep > 0 ? startStep : 0;

      for (let i = resumeFrom; i < stages.length; i++) {
        const stage = stages[i];
        const stageStart = Date.now();
        try {
          // Simulate per-stage async work (replace with real module-provisioning calls)
          await this.sleep(500);
          request.status = {
            step: stage,
            progress: Math.round(((i + 1) / stages.length) * 100),
            lastUpdated: new Date(),
          };
          await this.requestRepo.save(request);
          this.logger.log(
            `[JOB:${job.id}] STAGE_COMPLETE stage=${stage} progress=${request.status.progress}% ` +
              `durationMs=${Date.now() - stageStart} requestId=${requestId} ${ctx}`,
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `[JOB:${job.id}] STAGE_FAILED stage=${stage} requestId=${requestId} ` +
              `durationMs=${Date.now() - stageStart} error="${msg}" ${ctx}`,
          );
          throw err; // Let BullMQ retry the job with backoff
        }
      }

      metrics.jobsTotal.inc({ queue: QUEUE_AUTOMATION, status: 'completed' });
      this.logger.log(
        `[JOB:${job.id}] COMPLETE requestId=${requestId} worker=${this.workerId} ${ctx}`,
      );
    } catch (err) {
      metrics.jobsTotal.inc({ queue: QUEUE_AUTOMATION, status: 'failed' });
      throw err;
    } finally {
      const durationS = Number(process.hrtime.bigint() - startNs) / 1e9;
      metrics.jobDurationSeconds.observe({ queue: QUEUE_AUTOMATION }, durationS);
    }
  }

  /** Called when all retry attempts are exhausted → Dead-Letter Queue pattern */
  @OnWorkerEvent('failed')
  onFailed(job: Job<{ requestId: string }>, error: Error): void {
    // Retried = failed but _not_ the final attempt
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) {
      metrics.jobsTotal.inc({ queue: QUEUE_AUTOMATION, status: 'retried' });
    }

    const payload: DlqAlertPayload = {
      type: 'DLQ_EVENT',
      jobId: job.id,
      queue: 'a2z-rollout',
      requestId: job.data.requestId,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
      remediation: 'Check job queue dashboard or replay via POST /a2z-engine/replay/:jobId',
    };

    // Structured DLQ log — observable in any log aggregator (Loki / ELK / CloudWatch).
    this.logger.error(JSON.stringify({ event: 'DLQ_TERMINAL_FAILURE', worker: this.workerId, ...payload }));

    // Fire-and-forget webhook with 3-attempt exponential backoff (0s → 2s → 4s).
    // Uses ALERT_WEBHOOK_URL env var — no-op if unset. Never throws into the worker loop.
    fireAlertWebhookWithRetry(payload, 3, (msg) => this.logger.warn(msg)).catch(() => {
      // Swallow: already logged inside fireAlertWebhookWithRetry
    });
  }

  /** Called when a job completes successfully */
  @OnWorkerEvent('completed')
  onCompleted(job: Job<{ requestId: string }>): void {
    this.logger.log(
      `[JOB:${job.id}] WORKER_COMPLETED requestId=${job.data.requestId} worker=${this.workerId}`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
