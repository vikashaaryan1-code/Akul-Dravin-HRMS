import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueueMetricsService } from '../queues/queue-metrics.service';

export type AnalyticsDomain = 'workforce' | 'recruitment' | 'revenue';

export interface ProjectionVersionRecord {
  id: string;
  tenantId: string;
  domain: AnalyticsDomain;
  projectionVersion: number;
  isStale: boolean;
  staleReason: string | null;
  lastInvalidatedAt: string | null;
  lastRebuiltAt: string | null;
  lagSeconds: number | null;
}

/**
 * PROJECTION VERSION SERVICE — Track H
 *
 * Manages the health and schema version of analytics projection read models.
 *
 * ── Core Operations ───────────────────────────────────────────────────────────
 *  markStale()     — Called by AnalyticsProjectionHandler when a domain event
 *                    invalidates the projection. Sets is_stale=true, records
 *                    the causation event, and emits a projection_stale_total counter.
 *
 *  markRebuilt()   — Called after successful KPI recomputation. Clears is_stale,
 *                    records lag (time since last_invalidated_at), sets last_rebuilt_at.
 *
 *  getLag()        — Returns seconds between last_invalidated_at and NOW (if stale)
 *                    or between last_invalidated_at and last_rebuilt_at (if rebuilt).
 *                    Used by /metrics projection_lag_seconds gauge.
 *
 *  getVersions()   — Admin query returning all projection states for a tenant.
 *                    Surfaced in PlatformOpsView projection health panel.
 *
 * ── UPSERT semantics ─────────────────────────────────────────────────────────
 *  All writes use ON CONFLICT DO UPDATE — no prior row setup required.
 *  First invalidation auto-creates the row.
 */
@Injectable()
export class ProjectionVersionService {
  private readonly logger = new Logger(ProjectionVersionService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly metricsService: QueueMetricsService,
  ) {}

  // ── Stale marking ─────────────────────────────────────────────────────────

  async markStale(
    tenantId: string,
    domain: AnalyticsDomain,
    causationEvent: string,
    correlationId?: string,
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      await this.ds.query(
        `INSERT INTO analytics_projection_versions
           (tenant_id, domain, is_stale, stale_reason, last_invalidated_at, projection_version)
         VALUES ($1, $2, TRUE, $3, $4, 1)
         ON CONFLICT (tenant_id, domain) DO UPDATE SET
           is_stale            = TRUE,
           stale_reason        = EXCLUDED.stale_reason,
           last_invalidated_at = EXCLUDED.last_invalidated_at,
           updated_at          = NOW()`,
        [tenantId, domain, causationEvent, now],
      );

      // Append event log entry
      await this.ds.query(
        `INSERT INTO projection_event_log
           (tenant_id, domain, event_type, causation_event, correlation_id, lag_seconds)
         VALUES ($1, $2, 'stale_marked', $3, $4,
           EXTRACT(EPOCH FROM (NOW() - COALESCE(
             (SELECT last_rebuilt_at FROM analytics_projection_versions
              WHERE tenant_id=$1 AND domain=$2), NOW()
           )))::INTEGER
         )`,
        [tenantId, domain, causationEvent, correlationId ?? null],
      );

      this.metricsService.recordProjectionStale(domain);
      this.logger.warn(`[ProjectionVersion] STALE: domain=${domain} tenant=${tenantId} cause=${causationEvent}`);
    } catch (err) {
      // Non-fatal — never abort the primary operation
      this.logger.error(`[ProjectionVersion] markStale failed: ${String(err)}`);
    }
  }

  // ── Rebuilt marking ───────────────────────────────────────────────────────

  async markRebuilt(
    tenantId: string,
    domain: AnalyticsDomain,
    correlationId?: string,
  ): Promise<void> {
    try {
      // Compute lag before clearing staleness
      const [row] = await this.ds.query<Array<{ lag_s: string }>>(
        `SELECT EXTRACT(EPOCH FROM (NOW() - COALESCE(last_invalidated_at, NOW())))::INTEGER AS lag_s
         FROM analytics_projection_versions
         WHERE tenant_id=$1 AND domain=$2`,
        [tenantId, domain],
      );
      const lagSeconds = parseInt(row?.lag_s ?? '0', 10);

      await this.ds.query(
        `INSERT INTO analytics_projection_versions
           (tenant_id, domain, is_stale, last_rebuilt_at, projection_version)
         VALUES ($1, $2, FALSE, NOW(), 1)
         ON CONFLICT (tenant_id, domain) DO UPDATE SET
           is_stale        = FALSE,
           stale_reason    = NULL,
           last_rebuilt_at = NOW(),
           updated_at      = NOW()`,
        [tenantId, domain],
      );

      await this.ds.query(
        `INSERT INTO projection_event_log
           (tenant_id, domain, event_type, causation_event, correlation_id, lag_seconds)
         VALUES ($1, $2, 'rebuild_completed', 'queue:analytics:kpi-snapshot', $3, $4)`,
        [tenantId, domain, correlationId ?? null, lagSeconds],
      );

      this.metricsService.setProjectionLag(domain, lagSeconds);
      this.logger.log(`[ProjectionVersion] REBUILT: domain=${domain} tenant=${tenantId} lag=${lagSeconds}s`);
    } catch (err) {
      this.logger.error(`[ProjectionVersion] markRebuilt failed: ${String(err)}`);
    }
  }

  // ── Lag Query ─────────────────────────────────────────────────────────────

  async getLag(tenantId: string, domain: AnalyticsDomain): Promise<number> {
    try {
      const [row] = await this.ds.query<Array<{ lag_s: string }>>(
        `SELECT EXTRACT(EPOCH FROM (
           CASE
             WHEN is_stale THEN NOW()
             ELSE COALESCE(last_rebuilt_at, NOW())
           END - COALESCE(last_invalidated_at, NOW())
         ))::INTEGER AS lag_s
         FROM analytics_projection_versions
         WHERE tenant_id=$1 AND domain=$2`,
        [tenantId, domain],
      );
      return parseInt(row?.lag_s ?? '0', 10);
    } catch {
      return 0;
    }
  }

  // ── Admin Query ───────────────────────────────────────────────────────────

  async getVersions(tenantId: string): Promise<ProjectionVersionRecord[]> {
    const rows = await this.ds.query<any[]>(
      `SELECT
         id, tenant_id AS "tenantId", domain, projection_version AS "projectionVersion",
         is_stale AS "isStale", stale_reason AS "staleReason",
         last_invalidated_at AS "lastInvalidatedAt",
         last_rebuilt_at AS "lastRebuiltAt",
         EXTRACT(EPOCH FROM (NOW() - COALESCE(last_invalidated_at, NOW())))::INTEGER AS "lagSeconds"
       FROM analytics_projection_versions
       WHERE tenant_id=$1
       ORDER BY domain`,
      [tenantId],
    );
    return rows;
  }

  async getEventLog(
    tenantId: string,
    domain?: AnalyticsDomain,
    limit = 50,
  ): Promise<any[]> {
    const args: unknown[] = [tenantId];
    const domainClause = domain ? `AND domain = $${args.push(domain)}` : '';
    return this.ds.query(
      `SELECT * FROM projection_event_log
       WHERE tenant_id=$1 ${domainClause}
       ORDER BY occurred_at DESC LIMIT $${args.push(limit)}`,
      args,
    );
  }
}
