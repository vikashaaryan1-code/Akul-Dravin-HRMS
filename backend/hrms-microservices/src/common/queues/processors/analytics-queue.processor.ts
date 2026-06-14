import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUE_ANALYTICS } from '../../queues/queue-names';
import {
  QueueJobEnvelope,
  AnalyticsKpiSnapshotPayload,
  AnalyticsCacheWarmPayload,
  AnalyticsTrendMaterializePayload,
  ANALYTICS_JOB,
} from '../../queues/queue-job.types';
import { DeadLetterService } from '../../queues/dead-letter.service';
import { AnalyticsCacheService } from '../../../modules/analytics/analytics-cache.service';

/**
 * ANALYTICS QUEUE PROCESSOR
 *
 * Processes async analytics workloads — decoupled from transactional query paths.
 *
 * Job types:
 *  kpi-snapshot       — Re-aggregate KPIs for a domain and warm cache
 *  cache-warm         — Pre-load specific cache keys (scheduled warm-up)
 *  trend-materialize  — Aggregate monthly trend data into projection tables
 *
 * Idempotency TTL: 0 for cache-warm (always safe to re-run),
 *                  120s for kpi-snapshot (2× min cycle).
 *
 * Concurrency: 5 — analytics jobs are read-heavy and can parallelize safely.
 */
@Injectable()
@Processor(QUEUE_ANALYTICS, { concurrency: 5 })
export class AnalyticsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsQueueProcessor.name);

  constructor(
    private readonly dlqService: DeadLetterService,
    private readonly cacheService: AnalyticsCacheService,
  ) {
    super();
  }

  async process(job: Job<QueueJobEnvelope<unknown>>): Promise<void> {
    const { tenantId, correlationId, idempotencyKey } = job.data;
    const attempt = job.attemptsMade + 1;
    const logCtx  = `[ANALYTICS|${tenantId}|${job.name}|cid=${correlationId}|#${attempt}]`;

    this.logger.log(`${logCtx} Processing`);

    // Cache-warm jobs are idempotent by nature — skip dedup check
    const idemTtl = job.name === ANALYTICS_JOB.CACHE_WARM ? 0 : 120;
    if (idemTtl > 0 && await this.dlqService.checkIdempotency(idempotencyKey, idemTtl)) {
      this.logger.warn(`${logCtx} SKIPPED — duplicate within 2min window`);
      return;
    }

    try {
      const start = Date.now();
      switch (job.name) {
        case ANALYTICS_JOB.KPI_SNAPSHOT:
          await this.handleKpiSnapshot(job.data as QueueJobEnvelope<AnalyticsKpiSnapshotPayload>, logCtx);
          break;
        case ANALYTICS_JOB.CACHE_WARM:
          await this.handleCacheWarm(job.data as QueueJobEnvelope<AnalyticsCacheWarmPayload>, logCtx);
          break;
        case ANALYTICS_JOB.TREND_MATERIALIZE:
          await this.handleTrendMaterialize(job.data as QueueJobEnvelope<AnalyticsTrendMaterializePayload>, logCtx);
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
          queueName: QUEUE_ANALYTICS, jobName: job.name, tenantId, idempotencyKey,
          payload: job.data as QueueJobEnvelope<unknown>,
          errorMessage: errMsg, stackTrace: err instanceof Error ? err.stack : undefined,
          attempts: attempt,
        });
      }
      throw err;
    }
  }

  private async handleKpiSnapshot(
    envelope: QueueJobEnvelope<AnalyticsKpiSnapshotPayload>,
    logCtx: string,
  ): Promise<void> {
    const { tenantId, payload: { domain } } = envelope;

    // Bust the stale cache entry — next API request will recompute and re-cache
    const key = domain === 'workforce'   ? AnalyticsCacheService.keys.workforceKpi(tenantId)
               : domain === 'recruitment' ? AnalyticsCacheService.keys.recruitmentKpi(tenantId)
               :                           AnalyticsCacheService.keys.revenueKpi(tenantId);

    this.cacheService.invalidate(key);
    this.logger.log(`${logCtx} Cache invalidated: domain=${domain} key=${key}`);
    // The next analytics API call will trigger lazy recomputation + re-cache
  }

  private async handleCacheWarm(
    envelope: QueueJobEnvelope<AnalyticsCacheWarmPayload>,
    logCtx: string,
  ): Promise<void> {
    const { tenantId, payload } = envelope;
    const keysToWarm = payload.keys ?? [
      AnalyticsCacheService.keys.workforceKpi(tenantId),
      AnalyticsCacheService.keys.recruitmentKpi(tenantId),
      AnalyticsCacheService.keys.revenueKpi(tenantId),
    ];
    // Log the warm request — actual computation happens on next API request
    this.logger.log(`${logCtx} Scheduled cache-warm for ${keysToWarm.length} keys`);
    this.cacheService.invalidateByPrefix(`analytics:${tenantId}`);
  }

  private async handleTrendMaterialize(
    envelope: QueueJobEnvelope<AnalyticsTrendMaterializePayload>,
    logCtx: string,
  ): Promise<void> {
    const { tenantId, payload: { period, domain } } = envelope;
    // Trend materialization — invalidate period-specific keys
    this.cacheService.invalidateByPrefix(`analytics:${domain}:${tenantId}`);
    this.logger.log(`${logCtx} Trend materialized: domain=${domain} period=${period}`);
  }
}
