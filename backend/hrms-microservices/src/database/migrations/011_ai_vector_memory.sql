-- ============================================================
-- AI Memory & Vector Retrieval Migration
-- pgvector-based tenant-scoped embeddings pipeline
--
-- Requires: CREATE EXTENSION vector; (run once by superuser)
-- Compatible: PostgreSQL 14+ with pgvector 0.5+
--
-- Upgrade path for Meilisearch: leave search_index intact,
-- this table adds semantic search alongside lexical.
-- ============================================================

-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── AI Conversation Memory ─────────────────────────────────────────────────
-- Stores per-user, per-tenant conversation turns for long-term AI memory.
-- Embeddings enable semantic retrieval of relevant past context.

CREATE TABLE IF NOT EXISTS ai_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  user_id         UUID NOT NULL,
  session_id      UUID NOT NULL,                  -- groups turns into sessions
  role            VARCHAR(20) NOT NULL,            -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  embedding       vector(1536),                   -- OpenAI text-embedding-3-small dim
  token_count     INTEGER DEFAULT 0,
  meta            JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'  -- auto-expire old memories
);

-- IVFFlat index for fast approximate nearest-neighbour search
-- lists=100 is appropriate for < 1M rows; increase for larger datasets
CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding
  ON ai_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_ai_memory_tenant_user
  ON ai_memory (tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_memory_session
  ON ai_memory (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_memory_expires
  ON ai_memory (expires_at)
  WHERE expires_at IS NOT NULL;

-- ── Entity Knowledge Base ───────────────────────────────────────────────────
-- Stores embeddings for platform entities (employees, deals, tickets, etc.)
-- Enables semantic search across all entity types in one query.

CREATE TABLE IF NOT EXISTS entity_embeddings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  entity_type     VARCHAR(50) NOT NULL,           -- 'employee' | 'crm_lead' | 'job' | etc.
  entity_id       UUID NOT NULL,
  chunk_index     INTEGER DEFAULT 0,              -- for large documents split into chunks
  content         TEXT NOT NULL,                  -- the text that was embedded
  embedding       vector(1536),
  meta            JSONB DEFAULT '{}',             -- {department, status, tags, ...}
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_embeddings_unique
  ON entity_embeddings (tenant_id, entity_type, entity_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_entity_embeddings_vector
  ON entity_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_entity_embeddings_tenant_type
  ON entity_embeddings (tenant_id, entity_type);

-- ── AI Workflow Memory ──────────────────────────────────────────────────────
-- Stores AI insights generated during workflow execution for retrieval.

CREATE TABLE IF NOT EXISTS ai_workflow_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  workflow_id     UUID,
  execution_id    UUID,
  insight_type    VARCHAR(50) NOT NULL,           -- 'onboarding' | 'payroll' | 'risk' | etc.
  summary         TEXT NOT NULL,
  embedding       vector(1536),
  confidence      NUMERIC(4,3) DEFAULT 0.0,       -- 0.0-1.0
  entity_refs     JSONB DEFAULT '[]',             -- referenced entity IDs
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_vector
  ON ai_workflow_insights USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_ai_insights_tenant_type
  ON ai_workflow_insights (tenant_id, insight_type, created_at DESC);

-- ── Helper: Semantic Search Function ───────────────────────────────────────
-- Returns top-K similar entities across all types for a given query embedding.
-- Used by the AI Hub for cross-module semantic retrieval.

CREATE OR REPLACE FUNCTION semantic_entity_search(
  p_tenant_id     UUID,
  p_embedding     vector(1536),
  p_entity_types  TEXT[]  DEFAULT NULL,
  p_limit         INTEGER DEFAULT 10
)
RETURNS TABLE (
  entity_type   TEXT,
  entity_id     UUID,
  content       TEXT,
  similarity    FLOAT,
  meta          JSONB
)
LANGUAGE sql STABLE AS $$
  SELECT
    entity_type::TEXT,
    entity_id,
    content,
    1 - (embedding <=> p_embedding) AS similarity,
    meta
  FROM entity_embeddings
  WHERE tenant_id = p_tenant_id
    AND (p_entity_types IS NULL OR entity_type = ANY(p_entity_types))
    AND embedding IS NOT NULL
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- ── Helper: Memory Recall Function ─────────────────────────────────────────
-- Retrieves the K most semantically relevant past messages for a user session.

CREATE OR REPLACE FUNCTION recall_ai_memory(
  p_tenant_id   UUID,
  p_user_id     UUID,
  p_embedding   vector(1536),
  p_limit       INTEGER DEFAULT 5
)
RETURNS TABLE (
  session_id  UUID,
  role        TEXT,
  content     TEXT,
  similarity  FLOAT,
  created_at  TIMESTAMPTZ
)
LANGUAGE sql STABLE AS $$
  SELECT
    session_id,
    role::TEXT,
    content,
    1 - (embedding <=> p_embedding) AS similarity,
    created_at
  FROM ai_memory
  WHERE tenant_id = p_tenant_id
    AND user_id = p_user_id
    AND embedding IS NOT NULL
    AND expires_at > NOW()
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit;
$$;
