import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_AI_JOBS } from '../../queues/queue-names';
import { QueueJobEnvelope, AiAttritionScanPayload, AiCandidateScorePayload, AiWorkforceForecastPayload, AI_JOB } from '../../queues/queue-job.types';
import { DeadLetterService } from '../../queues/dead-letter.service';
import { AiWorkforcePlanningService } from '../../../modules/ai-engine/ai-workforce-planning.service';
import { AiMatchingService } from '../../../modules/ai-engine/ai-matching.service';

/**
 * AI QUEUE PROCESSOR
 *
 * Processes all jobs on the 'ai-jobs' BullMQ queue.
 *
 * Job types:
 *  attrition-scan       — Bulk attrition risk recomputation for a tenant
 *  candidate-score      — Score a candidate against a specific job
 *  workforce-forecast   — Generate 6-month workforce forecast
 *
 * Idempotency TTL: 1 hour (attrition scans are tenant-wide and periodic)
 */
@Injectable()
@Processor(QUEUE_AI_JOBS, {
  concurrency: 3,
})
export class AiQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AiQueueProcessor.name);
  private readonly idempotencyTtlSeconds = 3600;

  constructor(
    private readonly dlqService: DeadLetterService,
    private readonly workforcePlanningService: AiWorkforcePlanningService,
    private readonly matchingService: AiMatchingService,
  ) {
    super();
  }

  async process(job: Job<QueueJobEnvelope<unknown>>): Promise<void> {
    const { tenantId, correlationId, idempotencyKey } = job.data;
    const attempt = job.attemptsMade + 1;
    const logCtx = `[AI|${tenantId}|${job.name}|cid=${correlationId}|#${attempt}]`;

    this.logger.log(`${logCtx} Processing — key=${idempotencyKey}`);

    // Idempotency check
    if (await this.dlqService.checkIdempotency(idempotencyKey, this.idempotencyTtlSeconds)) {
      this.logger.warn(`${logCtx} SKIPPED — duplicate delivery`);
      return;
    }

    try {
      const start = Date.now();
      switch (job.name) {
        case AI_JOB.ATTRITION_SCAN:
          await this.handleAttritionScan(job.data as QueueJobEnvelope<AiAttritionScanPayload>, logCtx);
          break;
        case AI_JOB.CANDIDATE_SCORE:
          await this.handleCandidateScore(job.data as QueueJobEnvelope<AiCandidateScorePayload>, logCtx);
          break;
        case AI_JOB.WORKFORCE_FORECAST:
          await this.handleWorkforceForecast(job.data as QueueJobEnvelope<AiWorkforceForecastPayload>, logCtx);
          break;
        default:
          this.logger.warn(`${logCtx} Unknown job name: ${job.name}`);
      }
      this.logger.log(`${logCtx} SUCCESS — ${Date.now() - start}ms`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`${logCtx} FAILED — ${errMsg}`);
      if (attempt >= (job.opts.attempts ?? 3)) {
        await this.dlqService.record({
          queueName: QUEUE_AI_JOBS, jobName: job.name, tenantId, idempotencyKey,
          payload: job.data as QueueJobEnvelope<unknown>,
          errorMessage: errMsg, stackTrace: err instanceof Error ? err.stack : undefined,
          attempts: attempt,
        });
      }
      throw err;
    }
  }

  private async handleAttritionScan(
    envelope: QueueJobEnvelope<AiAttritionScanPayload>,
    logCtx: string,
  ): Promise<void> {
    const result = await this.workforcePlanningService.bulkAttritionScan(
      envelope.tenantId,
      'HIGH',
    );
    this.logger.log(`${logCtx} Attrition scan complete: ${result.length} employees assessed`);
  }

  private async handleCandidateScore(
    envelope: QueueJobEnvelope<AiCandidateScorePayload>,
    logCtx: string,
  ): Promise<void> {
    const { candidateId, jobId } = envelope.payload;
    const result = await this.matchingService.scoreCandidateForJob(
      candidateId, jobId,
    );
    this.logger.log(`${logCtx} Candidate scored: ${candidateId}→${jobId} = ${result.overallScore} (${result.recommendation})`);
  }

  private async handleWorkforceForecast(
    envelope: QueueJobEnvelope<AiWorkforceForecastPayload>,
    logCtx: string,
  ): Promise<void> {
    this.logger.log(`${logCtx} Workforce forecast horizonMonths=${envelope.payload.horizonMonths}`);
    // Forecast computation delegates to workforcePlanningService
    await this.workforcePlanningService.getWorkforceForecast(envelope.tenantId, envelope.payload.horizonMonths);
  }
}
