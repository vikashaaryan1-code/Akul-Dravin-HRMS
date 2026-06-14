import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface ActivityEventPayload {
  tenantId?: string | null;
  actorId?: string | null;
  actorName?: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityEvent {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  actorName: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/**
 * ActivityFeedService — unified activity timeline.
 *
 * Writes to activity_events table.
 * Never throws — all errors are logged and swallowed.
 * Called from any service without DI cycle concerns.
 */
@Injectable()
export class ActivityFeedService {
  private readonly logger = new Logger(ActivityFeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async record(payload: ActivityEventPayload): Promise<void> {
    try {
      await this.dataSource.query(`
        INSERT INTO activity_events
          (tenant_id, actor_id, actor_name, entity_type, entity_id, action, description, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        payload.tenantId ?? null,
        payload.actorId ?? null,
        payload.actorName ?? null,
        payload.entityType,
        payload.entityId ?? null,
        payload.action,
        payload.description ?? null,
        payload.metadata ?? {},
      ]);
    } catch (err) {
      this.logger.warn(`ActivityFeed.record failed silently: ${String(err)}`);
    }
  }

  async getEntityTimeline(
    entityType: string,
    entityId: string,
    tenantId?: string,
    limit = 50,
  ): Promise<ActivityEvent[]> {
    try {
      const rows = await this.dataSource.query(`
        SELECT id, tenant_id AS "tenantId", actor_id AS "actorId",
               actor_name AS "actorName", entity_type AS "entityType",
               entity_id AS "entityId", action, description, metadata,
               created_at AS "createdAt"
        FROM activity_events
        WHERE entity_type = $1 AND entity_id = $2
          ${tenantId ? 'AND tenant_id = $3' : ''}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `, tenantId ? [entityType, entityId, tenantId] : [entityType, entityId]);
      return rows;
    } catch (err) {
      this.logger.warn(`ActivityFeed.getEntityTimeline failed: ${String(err)}`);
      return [];
    }
  }

  async getTenantFeed(tenantId: string, limit = 100, offset = 0): Promise<{ events: ActivityEvent[]; total: number }> {
    try {
      const [rows, countRows] = await Promise.all([
        this.dataSource.query(`
          SELECT id, actor_id AS "actorId", actor_name AS "actorName",
                 entity_type AS "entityType", entity_id AS "entityId",
                 action, description, metadata, created_at AS "createdAt"
          FROM activity_events
          WHERE tenant_id = $1
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `, [tenantId, limit, offset]),
        this.dataSource.query(
          `SELECT COUNT(*) AS total FROM activity_events WHERE tenant_id = $1`, [tenantId],
        ),
      ]);
      return { events: rows, total: parseInt(countRows[0]?.total ?? '0', 10) };
    } catch {
      return { events: [], total: 0 };
    }
  }

  async getActorTimeline(actorId: string, tenantId: string, limit = 30): Promise<ActivityEvent[]> {
    try {
      return await this.dataSource.query(`
        SELECT id, entity_type AS "entityType", entity_id AS "entityId",
               action, description, metadata, created_at AS "createdAt"
        FROM activity_events
        WHERE actor_id = $1 AND tenant_id = $2
        ORDER BY created_at DESC
        LIMIT $3
      `, [actorId, tenantId, limit]);
    } catch {
      return [];
    }
  }
}
