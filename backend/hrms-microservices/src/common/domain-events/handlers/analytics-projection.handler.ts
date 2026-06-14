import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { AnalyticsCacheService } from '../../../modules/analytics/analytics-cache.service';
import { QUEUE_ANALYTICS } from '../../queues/queue-names';
import { AnalyticsKpiSnapshotJob, ANALYTICS_JOB } from '../../queues/queue-job.types';
import { ProjectionVersionService } from '../../audit/projection-version.service';

/**
 * ANALYTICS PROJECTION HANDLER — Track B
 *
 * Connects the DomainEventBus / NestJS EventEmitter to async analytics
 * cache invalidation and KPI re-aggregation.
 *
 * Architecture:
 *  Domain Event (synchronous, in-request)
 *    ↓  @OnEvent listener (decoupled from transaction)
 *  Cache invalidation (immediate — stale data evicted)
 *    ↓
 *  AnalyticsKpiSnapshotJob enqueued (async — BullMQ worker recomputes)
 *    ↓
 *  Next API request → cache miss → recompute → re-cache (lazy refresh)
 *
 * Severity: eventual — cache invalidation failure never aborts the
 *           originating domain operation.
 *
 * Events handled (NestJS EventEmitter format):
 *  employee.created          → workforce KPI invalidation
 *  employee.exited           → workforce KPI invalidation
 *  leave.approved            → workforce KPI invalidation
 *  candidate.stage_changed   → recruitment KPI invalidation
 *  subscription.renewed      → revenue KPI invalidation
 *  subscription.churned      → revenue KPI invalidation
 */
@Injectable()
export class AnalyticsProjectionHandler {
  private readonly logger = new Logger(AnalyticsProjectionHandler.name);

  constructor(
    private readonly cacheService: AnalyticsCacheService,
    private readonly projectionVersionService: ProjectionVersionService,
    @InjectQueue(QUEUE_ANALYTICS) private readonly analyticsQueue: Queue,
  ) {}

  // ── Workforce Events ──────────────────────────────────────────────────────

  @OnEvent('employee.created', { async: true })
  async onEmployeeCreated(payload: { tenantId: string; employeeId: string; correlationId?: string }): Promise<void> {
    await this.invalidateAndEnqueue(payload.tenantId, 'workforce', payload.correlationId, `employee.created:${payload.employeeId}`);
  }

  @OnEvent('employee.exited', { async: true })
  async onEmployeeExited(payload: { tenantId: string; employeeId: string; correlationId?: string }): Promise<void> {
    await this.invalidateAndEnqueue(payload.tenantId, 'workforce', payload.correlationId, `employee.exited:${payload.employeeId}`);
  }

  @OnEvent('leave.approved', { async: true })
  async onLeaveApproved(payload: { tenantId: string; employeeId: string; correlationId?: string }): Promise<void> {
    await this.invalidateAndEnqueue(payload.tenantId, 'workforce', payload.correlationId, `leave.approved:${payload.employeeId}`);
  }

  // ── Recruitment Events ────────────────────────────────────────────────────

  @OnEvent('candidate.stage_changed', { async: true })
  async onCandidateStageChanged(payload: { tenantId: string; candidateId: string; correlationId?: string }): Promise<void> {
    await this.invalidateAndEnqueue(payload.tenantId, 'recruitment', payload.correlationId, `candidate.stage:${payload.candidateId}`);
  }

  @OnEvent('application.submitted', { async: true })
  async onApplicationSubmitted(payload: { tenantId: string; applicationId: string; correlationId?: string }): Promise<void> {
    await this.invalidateAndEnqueue(payload.tenantId, 'recruitment', payload.correlationId, `application.submitted:${payload.applicationId}`);
  }

  // ── Revenue Events ────────────────────────────────────────────────────────

  @OnEvent('subscription.renewed', { async: true })
  async onSubscriptionRenewed(payload: { tenantId: string; subscriptionId: string; correlationId?: string }): Promise<void> {
    await this.invalidateAndEnqueue(payload.tenantId, 'revenue', payload.correlationId, `subscription.renewed:${payload.subscriptionId}`);
  }

  @OnEvent('subscription.churned', { async: true })
  async onSubscriptionChurned(payload: { tenantId: string; subscriptionId: string; correlationId?: string }): Promise<void> {
    await this.invalidateAndEnqueue(payload.tenantId, 'revenue', payload.correlationId, `subscription.churned:${payload.subscriptionId}`);
  }

  // ── Core invalidation + enqueue ───────────────────────────────────────────

  private async invalidateAndEnqueue(
    tenantId: string,
    domain: 'workforce' | 'recruitment' | 'revenue',
    correlationId: string | undefined,
    causationKey: string,
  ): Promise<void> {
    try {
      // 1. Immediate cache bust
      const cacheKey = domain === 'workforce'  ? AnalyticsCacheService.keys.workforceKpi(tenantId)
                     : domain === 'recruitment' ? AnalyticsCacheService.keys.recruitmentKpi(tenantId)
                     :                           AnalyticsCacheService.keys.revenueKpi(tenantId);
      this.cacheService.invalidate(cacheKey);

      // 2. Mark projection stale (version tracking + lag metrics)
      await this.projectionVersionService.markStale(tenantId, domain, causationKey, correlationId);

      this.logger.log(`[AnalyticsProjection] Cache busted + stale: domain=${domain} tenant=${tenantId} cause=${causationKey}`);

      // 3. Enqueue async KPI recomputation with 5s debounce coalescing
      const job: AnalyticsKpiSnapshotJob = {
        tenantId,
        correlationId: correlationId ?? uuidv4(),
        causationId: causationKey,
        idempotencyKey: `analytics:kpi:${domain}:${tenantId}:${causationKey}`,
        timestamp: new Date().toISOString(),
        payload: { domain },
      };
      await this.analyticsQueue.add(ANALYTICS_JOB.KPI_SNAPSHOT, job, {
        delay: 5000,
        jobId: `analytics-kpi-${domain}-${tenantId}`,
      });
    } catch (err) {
      this.logger.warn(`[AnalyticsProjection] Non-fatal projection error: ${String(err)}`);
    }
  }
}
