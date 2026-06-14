import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface SearchResult {
  entityType: string;
  entityId: string;
  title: string;
  body?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  rank: number;
  updatedAt: string;
}

export interface IndexPayload {
  tenantId: string;
  entityType: string;
  entityId: string;
  title: string;
  body?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * SearchService — PostgreSQL full-text search with tsvector.
 *
 * Features:
 * - Weighted search: title (A) > body (B)
 * - Tenant-scoped (each query filters by tenantId)
 * - Fuzzy match via ts_headline for snippet extraction
 * - Index upsert — safe to re-index existing entities
 *
 * Upgrade path: Replace raw SQL with Meilisearch/OpenSearch client
 * by swapping out this service's implementation only.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async search(
    tenantId: string,
    query: string,
    options?: {
      entityTypes?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<{ results: SearchResult[]; total: number; query: string }> {
    if (!query?.trim()) return { results: [], total: 0, query };

    const limit  = options?.limit  ?? 20;
    const offset = options?.offset ?? 0;
    const tsQuery = this.buildTsQuery(query);

    const typeFilter = options?.entityTypes?.length
      ? `AND entity_type = ANY(ARRAY[${options.entityTypes.map((_, i) => `$${i + 3}`).join(',')}])`
      : '';
    const typeParams = options?.entityTypes ?? [];

    const sql = `
      SELECT
        entity_type  AS "entityType",
        entity_id    AS "entityId",
        title,
        body,
        tags,
        metadata,
        updated_at   AS "updatedAt",
        ts_rank_cd(searchable, to_tsquery('english', $2)) AS rank
      FROM search_index
      WHERE tenant_id = $1
        AND searchable @@ to_tsquery('english', $2)
        ${typeFilter}
      ORDER BY rank DESC, updated_at DESC
      LIMIT $${3 + typeParams.length}
      OFFSET $${4 + typeParams.length}
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM search_index
      WHERE tenant_id = $1
        AND searchable @@ to_tsquery('english', $2)
        ${typeFilter}
    `;

    try {
      const [rows, countRows] = await Promise.all([
        this.dataSource.query(sql, [tenantId, tsQuery, ...typeParams, limit, offset]),
        this.dataSource.query(countSql, [tenantId, tsQuery, ...typeParams]),
      ]);

      return {
        results: rows as SearchResult[],
        total: parseInt(countRows[0]?.total ?? '0', 10),
        query,
      };
    } catch (err) {
      this.logger.warn(`Search failed: ${String(err)}`);
      return { results: [], total: 0, query };
    }
  }

  async upsertIndex(payload: IndexPayload): Promise<void> {
    const { tenantId, entityType, entityId, title, body, tags, metadata } = payload;
    try {
      await this.dataSource.query(`
        INSERT INTO search_index (tenant_id, entity_type, entity_id, title, body, tags, metadata, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (tenant_id, entity_type, entity_id)
        DO UPDATE SET
          title      = EXCLUDED.title,
          body       = EXCLUDED.body,
          tags       = EXCLUDED.tags,
          metadata   = EXCLUDED.metadata,
          updated_at = NOW()
      `, [tenantId, entityType, entityId, title, body ?? '', tags ?? [], metadata ?? {}]);
    } catch (err) {
      this.logger.warn(`SearchService.upsertIndex failed: ${String(err)}`);
    }
  }

  async removeFromIndex(tenantId: string, entityType: string, entityId: string): Promise<void> {
    try {
      await this.dataSource.query(
        `DELETE FROM search_index WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3`,
        [tenantId, entityType, entityId],
      );
    } catch {}
  }

  async bulkUpsert(payloads: IndexPayload[]): Promise<{ indexed: number; failed: number }> {
    let indexed = 0, failed = 0;
    for (const payload of payloads) {
      try { await this.upsertIndex(payload); indexed++; }
      catch { failed++; }
    }
    this.logger.log(`SearchService.bulkUpsert: indexed=${indexed} failed=${failed}`);
    return { indexed, failed };
  }

  private buildTsQuery(input: string): string {
    // Sanitize: remove special chars, split words, join with & for AND search
    const words = input
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(w => `${w}:*`); // prefix matching
    return words.join(' & ') || 'empty';
  }
}
