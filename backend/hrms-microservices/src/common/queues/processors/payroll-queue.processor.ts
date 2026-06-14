import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_PAYROLL } from '../../queues/queue-names';
import {
  QueueJobEnvelope,
  PayrollBatchPayload,
  CommissionPeriodPayload,
  PAYROLL_JOB,
} from '../../queues/queue-job.types';
import { DeadLetterService } from '../../queues/dead-letter.service';
import { RedlockService } from '../../locks/redlock.service';

/**
 * PAYROLL QUEUE PROCESSOR
 *
 * PRD §8 — Payroll & Commission Engine
 *
 * The most safety-critical processor. Payroll errors have direct financial impact.
 *
 * Safety mechanisms:
 *  1. Idempotency TTL: 24 hours — prevents duplicate payroll runs for same batch.
 *  2. Distributed lock: one batch runs at a time per tenant (LocksService).
 *  3. DLQ: any final failure records to `queue_dead_letters` + triggers admin alert.
 *  4. Concurrency: 1 — sequential payroll processing per worker instance.
 *
 * Concurrency: 1 — payroll is financially sensitive; sequential is correct.
 */
@Injectable()
@Processor(QUEUE_PAYROLL, { concurrency: 1 })
export class PayrollQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(PayrollQueueProcessor.name);
  private readonly IDEMPOTENCY_TTL = 86400; // 24 hours

  constructor(
    private readonly dlqService: DeadLetterService,
    private readonly locksService: RedlockService,
  ) {
    super();
  }

  async process(job: Job<QueueJobEnvelope<unknown>>): Promise<void> {
    const { tenantId, correlationId, idempotencyKey } = job.data;
    const attempt = job.attemptsMade + 1;
    const logCtx  = `[PAYROLL|${tenantId}|${job.name}|cid=${correlationId}|#${attempt}]`;

    this.logger.log(`${logCtx} Processing — key=${idempotencyKey}`);

    // Idempotency — 24h TTL prevents duplicate payroll
    if (await this.dlqService.checkIdempotency(idempotencyKey, this.IDEMPOTENCY_TTL)) {
      this.logger.warn(`${logCtx} SKIPPED — already processed within 24h window`);
      return;
    }

    try {
      const start = Date.now();
      switch (job.name) {
        case PAYROLL_JOB.PAYROLL_BATCH:
          await this.handlePayrollBatch(job.data as QueueJobEnvelope<PayrollBatchPayload>, logCtx);
          break;
        case PAYROLL_JOB.COMMISSION_PERIOD:
          await this.handleCommissionPeriod(job.data as QueueJobEnvelope<CommissionPeriodPayload>, logCtx);
          break;
        default:
          this.logger.warn(`${logCtx} Unknown job: ${job.name}`);
      }
      this.logger.log(`${logCtx} SUCCESS — ${Date.now() - start}ms`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`${logCtx} FAILED — ${errMsg}`);
      if (attempt >= (job.opts.attempts ?? 3)) {
        await this.dlqService.record({
          queueName: QUEUE_PAYROLL, jobName: job.name, tenantId, idempotencyKey,
          payload: job.data as QueueJobEnvelope<unknown>,
          errorMessage: errMsg, stackTrace: err instanceof Error ? err.stack : undefined,
          attempts: attempt,
        });
      }
      throw err;
    }
  }

  private async handlePayrollBatch(
    envelope: QueueJobEnvelope<PayrollBatchPayload>,
    logCtx: string,
  ): Promise<void> {
    const { tenantId, payload: { batchId, period, dryRun } } = envelope;
    const lockKey = `payroll:batch:${tenantId}:${period}`;

    // Distributed lock — one payroll run per tenant+period at a time
    let lock: any;
    try {
      lock = await this.locksService.acquireLock(lockKey, 10 * 60 * 1000); // 10min TTL in ms
    } catch (err) {
      this.logger.warn(`${logCtx} Could not acquire lock for ${lockKey} — concurrent payroll run in progress`);
      throw new Error(`Payroll batch ${batchId} is already running for period ${period}`);
    }

    try {
      this.logger.log(`${logCtx} Payroll batch started: batchId=${batchId} period=${period} dryRun=${dryRun ?? false}`);
      // In production: delegates to PayrollService.processBatch(batchId, tenantId)
      // Placeholder: simulate batch processing
      await new Promise(resolve => setTimeout(resolve, 100));
      this.logger.log(`${logCtx} Payroll batch complete: batchId=${batchId}`);
    } finally {
      await lock.release();
    }
  }

  private async handleCommissionPeriod(
    envelope: QueueJobEnvelope<CommissionPeriodPayload>,
    logCtx: string,
  ): Promise<void> {
    const { tenantId, payload: { period, recruiterIds } } = envelope;
    const scope = recruiterIds?.length ? `${recruiterIds.length} recruiters` : 'all recruiters';
    this.logger.log(`${logCtx} Commission calculation: period=${period} scope=${scope} tenant=${tenantId}`);
    // In production: delegates to CommissionCalculationService.computePeriod(tenantId, period, recruiterIds)
  }
}
