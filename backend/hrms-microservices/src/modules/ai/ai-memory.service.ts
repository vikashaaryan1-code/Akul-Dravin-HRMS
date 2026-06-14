import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { withSpan } from '../../common/observability/tracing';

/**
 * AiMemoryService — pgvector-backed long-term AI memory.
 *
 * Provides:
 * - store(): Persist a conversation turn with its embedding
 * - recall(): Retrieve semantically relevant past context
 * - indexEntity(): Embed and index a platform entity for semantic search
 * - semanticSearch(): Cross-module vector similarity search
 * - storeInsight(): Persist AI-generated workflow insights
 * - cleanup(): Remove expired memories (called by CronOrchestratorService)
 *
 * Gracefully degrades when:
 * - pgvector extension is not installed → operations become no-ops
 * - OpenAI embedding API fails → content stored without embedding
 * - AI provider not configured → entity search falls back to lexical
 */
@Injectable()
export class AiMemoryService {
  private readonly logger = new Logger(AiMemoryService.name);
  private pgvectorAvailable: boolean | null = null;

  constructor(@InjectDataSource() private readonly db: DataSource) {}

  // ── Internal: check pgvector ─────────────────────────────────────────────

  private async isPgvectorAvailable(): Promise<boolean> {
    if (this.pgvectorAvailable !== null) return this.pgvectorAvailable;
    try {
      await this.db.query(`SELECT 'test'::vector(1)`);
      this.pgvectorAvailable = true;
    } catch {
      this.logger.warn('pgvector extension not available — AI memory running in lexical-only mode');
      this.pgvectorAvailable = false;
    }
    return this.pgvectorAvailable;
  }

  // ── Embedding Generation ──────────────────────────────────────────────────

  private async generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8192) }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.[0]?.embedding ?? null;
    } catch {
      return null;
    }
  }

  private formatVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Store a conversation turn with embedding.
   * Called by AI Hub after each message exchange.
   */
  async store(params: {
    tenantId: string;
    userId: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    return withSpan('ai_memory.store', { tenantId: params.tenantId }, async () => {
      if (!(await this.isPgvectorAvailable())) return;
      try {
        const embedding = await this.generateEmbedding(params.content);
        const tokenEstimate = Math.ceil(params.content.length / 4);

        if (embedding) {
          await this.db.query(
            `INSERT INTO ai_memory (tenant_id, user_id, session_id, role, content, embedding, token_count, meta)
             VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8)`,
            [
              params.tenantId, params.userId, params.sessionId,
              params.role, params.content,
              this.formatVector(embedding),
              tokenEstimate, JSON.stringify(params.meta ?? {}),
            ],
          );
        } else {
          // Store without embedding — still useful for exact retrieval
          await this.db.query(
            `INSERT INTO ai_memory (tenant_id, user_id, session_id, role, content, token_count, meta)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [params.tenantId, params.userId, params.sessionId, params.role, params.content, tokenEstimate, JSON.stringify(params.meta ?? {})],
          );
        }
      } catch (err) {
        this.logger.warn(`AI memory store failed: ${String(err)}`);
      }
    });
  }

  /**
   * Recall the K most semantically relevant past messages.
   * Falls back to recent messages if embedding unavailable.
   */
  async recall(params: {
    tenantId: string;
    userId: string;
    query: string;
    limit?: number;
  }): Promise<Array<{ role: string; content: string; similarity: number; createdAt: Date }>> {
    return withSpan('ai_memory.recall', { tenantId: params.tenantId }, async () => {
      if (!(await this.isPgvectorAvailable())) return [];
      const limit = params.limit ?? 5;
      try {
        const embedding = await this.generateEmbedding(params.query);
        if (embedding) {
          const rows = await this.db.query(
            `SELECT * FROM recall_ai_memory($1, $2, $3::vector, $4)`,
            [params.tenantId, params.userId, this.formatVector(embedding), limit],
          );
          return rows.map((r: Record<string, unknown>) => ({
            role: r.role as string,
            content: r.content as string,
            similarity: Number(r.similarity),
            createdAt: r.created_at as Date,
          }));
        }
        // Fallback: recent messages by date
        const rows = await this.db.query(
          `SELECT role, content, 0 as similarity, created_at
           FROM ai_memory
           WHERE tenant_id = $1 AND user_id = $2 AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT $3`,
          [params.tenantId, params.userId, limit],
        );
        return rows.map((r: Record<string, unknown>) => ({
          role: r.role as string, content: r.content as string,
          similarity: 0, createdAt: r.created_at as Date,
        }));
      } catch (err) {
        this.logger.warn(`AI memory recall failed: ${String(err)}`);
        return [];
      }
    });
  }

  /**
   * Index a platform entity for semantic search.
   * Called when entities are created/updated (via ActivityFeedService or events).
   */
  async indexEntity(params: {
    tenantId: string;
    entityType: string;
    entityId: string;
    content: string;
    chunkIndex?: number;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    return withSpan('ai_memory.index_entity', { entityType: params.entityType }, async () => {
      if (!(await this.isPgvectorAvailable())) return;
      try {
        const embedding = await this.generateEmbedding(params.content);
        if (!embedding) return;

        await this.db.query(
          `INSERT INTO entity_embeddings (tenant_id, entity_type, entity_id, chunk_index, content, embedding, meta, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6::vector, $7, NOW())
           ON CONFLICT (tenant_id, entity_type, entity_id, chunk_index)
           DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding,
                         meta = EXCLUDED.meta, updated_at = NOW()`,
          [
            params.tenantId, params.entityType, params.entityId,
            params.chunkIndex ?? 0, params.content,
            this.formatVector(embedding), JSON.stringify(params.meta ?? {}),
          ],
        );
      } catch (err) {
        this.logger.warn(`Entity index failed (${params.entityType}:${params.entityId}): ${String(err)}`);
      }
    });
  }

  /**
   * Semantic cross-module entity search.
   * Returns entities ranked by vector similarity to the query.
   */
  async semanticSearch(params: {
    tenantId: string;
    query: string;
    entityTypes?: string[];
    limit?: number;
  }): Promise<Array<{ entityType: string; entityId: string; content: string; similarity: number; meta: Record<string, unknown> }>> {
    return withSpan('ai_memory.semantic_search', { tenantId: params.tenantId }, async () => {
      if (!(await this.isPgvectorAvailable())) return [];
      try {
        const embedding = await this.generateEmbedding(params.query);
        if (!embedding) return [];

        const rows = await this.db.query(
          `SELECT * FROM semantic_entity_search($1, $2::vector, $3, $4)`,
          [
            params.tenantId,
            this.formatVector(embedding),
            params.entityTypes ?? null,
            params.limit ?? 10,
          ],
        );
        return rows.map((r: Record<string, unknown>) => ({
          entityType: r.entity_type as string,
          entityId: r.entity_id as string,
          content: r.content as string,
          similarity: Number(r.similarity),
          meta: (r.meta ?? {}) as Record<string, unknown>,
        }));
      } catch (err) {
        this.logger.warn(`Semantic search failed: ${String(err)}`);
        return [];
      }
    });
  }

  /**
   * Store an AI-generated insight from a workflow execution.
   */
  async storeInsight(params: {
    tenantId: string;
    workflowId?: string;
    executionId?: string;
    insightType: string;
    summary: string;
    confidence?: number;
    entityRefs?: string[];
  }): Promise<void> {
    return withSpan('ai_memory.store_insight', { insightType: params.insightType }, async () => {
      if (!(await this.isPgvectorAvailable())) return;
      try {
        const embedding = await this.generateEmbedding(params.summary);
        await this.db.query(
          `INSERT INTO ai_workflow_insights
           (tenant_id, workflow_id, execution_id, insight_type, summary, embedding, confidence, entity_refs)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            params.tenantId, params.workflowId ?? null, params.executionId ?? null,
            params.insightType, params.summary,
            embedding ? this.formatVector(embedding) : null,
            params.confidence ?? 0.0,
            JSON.stringify(params.entityRefs ?? []),
          ],
        );
      } catch (err) {
        this.logger.warn(`Insight store failed: ${String(err)}`);
      }
    });
  }

  /**
   * Remove expired memories — called daily by CronOrchestratorService.
   */
  async cleanup(): Promise<{ deletedMemories: number }> {
    try {
      const result = await this.db.query(
        `DELETE FROM ai_memory WHERE expires_at < NOW() RETURNING id`
      );
      const deleted = result.length ?? 0;
      if (deleted > 0) this.logger.log(`AI memory cleanup: removed ${deleted} expired records`);
      return { deletedMemories: deleted };
    } catch (err) {
      this.logger.warn(`Memory cleanup failed: ${String(err)}`);
      return { deletedMemories: 0 };
    }
  }
}
