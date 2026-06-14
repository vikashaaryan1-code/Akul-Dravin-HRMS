import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueJobEnvelope, DeadLetterRecord } from './queue-job.types';
import { DeadLetterService } from './dead-letter.service';
import { QueueMetricsService } from './queue-metrics.service';
import { withSpan } from '../observability/tracing';

/**
 * BASE QUEUE PROCESSOR
 *
 * Abstract base class for all BullMQ processors in the platform.
 *
 * ── Responsibilities ─────────────────────────────────────────────────────────
 *  1. Correlation restoration — extracts correlationId from job envelope,
 *     binds it to the logger context so all logs within a job have a trace ID.
 *  2. Idempotency validation — subclasses declare their idempotency TTL;
 *     base class manages the Redis SET NX check. (Requires RedisService.)
 *  3. Structured logging — consistent [QUEUE|TENANT|JOB|CORRELATION] format.
 *  4. Failure capture — catches unhandled errors, records them in the DLQ
 *     after the final BullMQ retry, then re-throws so BullMQ marks job failed.
 *  5. Retry instrumentation — logs attempt number on every execution.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 *   @Processor(QUEUE_AI_JOBS)
 *   export class AiQueueProcessor extends BaseQueueProcessor<AiJobPayload> {
 *     protected readonly queueName = QUEUE_AI_JOBS;
 *     protected readonly idempotencyTtlSeconds = 3600;
 *
 *     protected async execute(
 *       envelope: QueueJobEnvelope<AiJobPayload>,
 *       job: Job,
 *     ): Promise<void> {
 *       // domain logic here
 *     }
 *   }
 *
 * ── Idempotency contract ──────────────────────────────────────────────────────
 *  • Subclasses set `protected readonly idempotencyTtlSeconds`.
 *  • Set to 0 to disable idempotency check (e.g., cache warming jobs).
 *  • The idempotency key is `envelope.idempotencyKey`.
 *  • On first processing: Redis key is SET NX with TTL. Job executes.
 *  • On retry (same key, key still live): job is skipped with log warning.
 *  • After TTL expiry: job can be re-processed (correct for periodic jobs).
 */
export abstract class BaseQueueProcessor<TPayload = Record<string, unknown>> {
  protected readonly logger: Logger;

  /**
   * Queue name this processor belongs to.
   * Used in DLQ records and log context.
   */
  protected abstract readonly queueName: string;

  /**
   * TTL (seconds) for the idempotency key in Redis.
   * Set to 0 to disable idempotency checks.
   *
   * Recommended values:
   *  - One-shot operations (payroll batch): 86400 (24h)
   *  - Periodic scans (attrition):          3600  (1h)
   *  - Cache operations:                    0     (no dedup needed)
   *  - Notifications:                       86400 (24h — prevent duplicate sends)
   */
  protected abstract readonly idempotencyTtlSeconds: number;

  constructor(
    protected readonly dlqService: DeadLetterService,
    protected readonly metricsService?: QueueMetricsService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  // ── Abstract execute — override in subclasses ─────────────────────────────

  /**
   * Domain-specific job logic. Called after correlation restore + idempotency check.
   * Throw any error to trigger BullMQ retry → eventual DLQ on final attempt.
   */
  protected abstract execute(
    envelope: QueueJobEnvelope<TPayload>,
    job: Job<QueueJobEnvelope<TPayload>>,
  ): Promise<void>;

  // ── BullMQ process hook — entry point for all jobs ────────────────────────

  async process(job: Job<QueueJobEnvelope<TPayload>>): Promise<void> {
    const envelope = job.data;
    const { tenantId, correlationId, idempotencyKey } = envelope;
    const jobName    = job.name;
    const attempt    = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts ?? 3;

    const logCtx = `[${this.queueName}|${tenantId}|${jobName}|cid=${correlationId}|attempt=${attempt}/${maxAttempts}]`;
    this.logger.log(`${logCtx} Processing — idempotencyKey=${idempotencyKey}`);

    // ── Idempotency check ──────────────────────────────────────────────────
    if (this.idempotencyTtlSeconds > 0) {
      const alreadyProcessed = await this.dlqService.checkIdempotency(
        idempotencyKey,
        this.idempotencyTtlSeconds,
      );
      if (alreadyProcessed) {
        this.logger.warn(`${logCtx} SKIPPED — idempotency key already consumed (duplicate delivery).`);
        this.metricsService?.recordIdempotencySkip(this.queueName);
        return;
      }
    }

    // ── Execute domain logic inside OTel span ─────────────────────────────
    try {
      const start = Date.now();
      await withSpan(
        `queue.${this.queueName}.${jobName}`,
        {
          'queue.name':        this.queueName,
          'queue.job_name':    jobName,
          'queue.attempt':     attempt,
          'tenant.id':         tenantId,
          'correlation.id':    correlationId ?? '',
          'idempotency.key':   idempotencyKey,
        },
        () => this.execute(envelope, job),
      );
      const durationMs = Date.now() - start;
      this.logger.log(`${logCtx} SUCCESS — ${durationMs}ms`);
      this.metricsService?.recordJobCompleted(this.queueName, jobName, durationMs);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const stack  = err instanceof Error ? err.stack : undefined;
      const isFinal = attempt >= maxAttempts;

      this.logger.error(`${logCtx} FAILED — ${errMsg}`);
      this.metricsService?.recordJobFailed(this.queueName, jobName, isFinal);

      // ── Dead Letter on final attempt ─────────────────────────────────────
      if (isFinal) {
        this.logger.error(`${logCtx} FINAL FAILURE — recording to dead letter queue.`);
        await this.dlqService.record({
          queueName:    this.queueName,
          jobName,
          tenantId,
          idempotencyKey,
          payload:      envelope as QueueJobEnvelope<unknown>,
          errorMessage: errMsg,
          stackTrace:   stack,
          attempts:     attempt,
        }).catch((dlqErr) => {
          this.logger.error(`${logCtx} DLQ write also failed: ${String(dlqErr)}`);
        });
      }

      throw err;
    }
  }

  // ── Retry backoff helper ───────────────────────────────────────────────────

  /**
   * Standard exponential backoff: 2^attempt seconds, capped at 5 minutes.
   * Use as: @OnQueueFailed() + backoffType: 'exponential' in BullMQ options.
   */
  static exponentialBackoffMs(attempt: number): number {
    return Math.min(Math.pow(2, attempt) * 1000, 5 * 60 * 1000);
  }
}
