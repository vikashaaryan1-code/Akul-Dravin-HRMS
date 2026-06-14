import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 7+8: Workflow engine tables + search index
 */
export class AddPhase7WorkflowSearch1747200000000 implements MigrationInterface {
  name = 'AddPhase7WorkflowSearch1747200000000';

  async up(qr: QueryRunner): Promise<void> {
    // ── Workflow Definitions ────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS workflow_definitions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID,
        name            VARCHAR(200) NOT NULL,
        description     TEXT,
        trigger_type    VARCHAR(50) NOT NULL,
        trigger_config  JSONB NOT NULL DEFAULT '{}',
        steps           JSONB NOT NULL DEFAULT '[]',
        conditions      JSONB NOT NULL DEFAULT '{}',
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        version         INT NOT NULL DEFAULT 1,
        tags            TEXT[],
        created_by      UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_wfdef_tenant ON workflow_definitions(tenant_id, is_active);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_wfdef_trigger ON workflow_definitions(trigger_type);`);

    // ── Workflow Executions ─────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS workflow_executions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        definition_id   UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
        tenant_id       UUID,
        trigger_data    JSONB,
        status          VARCHAR(30) NOT NULL DEFAULT 'pending',
        current_step    INT NOT NULL DEFAULT 0,
        step_results    JSONB NOT NULL DEFAULT '[]',
        error_message   TEXT,
        started_at      TIMESTAMPTZ,
        completed_at    TIMESTAMPTZ,
        triggered_by    UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_wfexec_def ON workflow_executions(definition_id, status);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_wfexec_tenant ON workflow_executions(tenant_id, created_at DESC);`);

    // ── Activity Feed ───────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS activity_events (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id   UUID,
        actor_id    UUID,
        actor_name  VARCHAR(200),
        entity_type VARCHAR(60) NOT NULL,
        entity_id   UUID,
        action      VARCHAR(80) NOT NULL,
        description TEXT,
        metadata    JSONB DEFAULT '{}',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_act_tenant ON activity_events(tenant_id, created_at DESC);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_act_entity ON activity_events(entity_type, entity_id);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_act_actor ON activity_events(actor_id, created_at DESC);`);

    // ── Full-text Search (PostgreSQL GIN index) ────────────────────────────
    await qr.query(`
      CREATE TABLE IF NOT EXISTS search_index (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id   UUID NOT NULL,
        entity_type VARCHAR(60) NOT NULL,
        entity_id   UUID NOT NULL,
        title       TEXT NOT NULL,
        body        TEXT,
        tags        TEXT[],
        metadata    JSONB DEFAULT '{}',
        searchable  TSVECTOR,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, entity_type, entity_id)
      );
    `);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_search_tsv ON search_index USING gin(searchable);`);
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_search_tenant ON search_index(tenant_id, entity_type);`);

    // Auto-update searchable column with weighted tsvector
    await qr.query(`
      CREATE OR REPLACE FUNCTION search_index_trigger_fn()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.searchable := setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                          setweight(to_tsvector('english', coalesce(NEW.body, '')), 'B');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await qr.query(`
      DROP TRIGGER IF EXISTS search_index_tsvector_update ON search_index;
      CREATE TRIGGER search_index_tsvector_update
        BEFORE INSERT OR UPDATE ON search_index
        FOR EACH ROW EXECUTE FUNCTION search_index_trigger_fn();
    `);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TRIGGER IF EXISTS search_index_tsvector_update ON search_index;`);
    await qr.query(`DROP FUNCTION IF EXISTS search_index_trigger_fn();`);
    await qr.query(`DROP TABLE IF EXISTS search_index;`);
    await qr.query(`DROP TABLE IF EXISTS activity_events;`);
    await qr.query(`DROP TABLE IF EXISTS workflow_executions;`);
    await qr.query(`DROP TABLE IF EXISTS workflow_definitions;`);
  }
}
