import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: Operational Governance Persistence — Phases AJ + AK
 *
 * ── mitigation_policies ───────────────────────────────────────────────────────
 *  Persistent registry for the declarative mitigation policy DSL.
 *  Replaces the in-memory DEFAULT_POLICIES array with a DB-backed registry
 *  that supports versioning, runtime enable/disable, simulation mode,
 *  and full audit trails.
 *
 * ── mitigation_policy_revisions ──────────────────────────────────────────────
 *  Full JSONB snapshot of a policy at every version boundary.
 *  Enables historical policy diff, rollback of policy changes, and
 *  analysis of how policy evolution affected operational outcomes.
 *
 * ── mitigation_policy_audit ───────────────────────────────────────────────────
 *  Structured audit log for every evaluation, match, signal proposal,
 *  enable/disable, and version change event. Enables policy efficacy analysis.
 *
 * ── op_graph_nodes ────────────────────────────────────────────────────────────
 *  Persistent storage for the Operational Knowledge Graph node set.
 *  Each node represents one observable event across any operational layer:
 *  incident, mitigation, projection, queue job, domain event, or revision.
 *
 * ── op_graph_edges ────────────────────────────────────────────────────────────
 *  Directed edges between graph nodes with a typed relation and confidence score.
 *  CASCADE deletion ensures orphan edges are cleaned automatically.
 *
 * ── op_graph_incident_subgraphs ───────────────────────────────────────────────
 *  Pre-computed incident subgraphs from IncidentPlaybackService.reconstruct().
 *  Stores the set of node IDs and edge IDs for each reconstructed incident,
 *  enabling fast cross-incident graph queries without re-traversal.
 */
export class AddOperationalGovernancePersistence1747420000000 implements MigrationInterface {
  name = 'AddOperationalGovernancePersistence1747420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Phase AJ: Policy Registry ─────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mitigation_policies (
        id                      VARCHAR(120)  PRIMARY KEY,

        -- Policy identity
        slo_id                  VARCHAR(80)   NOT NULL,
        name                    VARCHAR(200)  NOT NULL,
        description             TEXT,
        priority                INTEGER       NOT NULL DEFAULT 50,

        -- Declarative condition DSL (array of {metric, operator, value})
        conditions              JSONB         NOT NULL DEFAULT '[]',

        -- Mitigation configuration
        action                  VARCHAR(60)   NOT NULL,
        urgency                 VARCHAR(20)   NOT NULL DEFAULT 'MEDIUM',
        auto_executable         BOOLEAN       NOT NULL DEFAULT FALSE,
        parameter               JSONB,
        target_resource         VARCHAR(200)  NOT NULL,
        recommendation_template TEXT          NOT NULL,

        -- Confidence gate: minimum historical success score (0-100) to fire
        -- NULL = no gate (fires unconditionally, bootstrap behavior)
        min_confidence_score    SMALLINT,

        -- Lifecycle flags
        enabled                 BOOLEAN       NOT NULL DEFAULT TRUE,

        -- Simulation mode: policy is evaluated but signals are marked SIMULATED
        -- Used for dry-run validation before enabling a policy in production
        simulation_mode         BOOLEAN       NOT NULL DEFAULT FALSE,

        -- Versioning: incremented on every policy field change
        version                 INTEGER       NOT NULL DEFAULT 1,

        -- Origin: 'DEFAULT' (seeded from code) | 'OPERATOR' (runtime-created)
        origin                  VARCHAR(20)   NOT NULL DEFAULT 'DEFAULT',

        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_policies_slo
        ON mitigation_policies (slo_id)
        WHERE enabled = TRUE
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_policies_priority
        ON mitigation_policies (priority ASC, slo_id)
        WHERE enabled = TRUE
    `);

    // ── Policy Revision History ───────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mitigation_policy_revisions (
        id            SERIAL        PRIMARY KEY,
        policy_id     VARCHAR(120)  NOT NULL REFERENCES mitigation_policies(id) ON DELETE CASCADE,
        version       INTEGER       NOT NULL,

        -- Full JSONB snapshot of the policy at this version boundary
        snapshot      JSONB         NOT NULL,

        -- Who made the change and why
        changed_by    VARCHAR(120),
        change_reason TEXT,

        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

        UNIQUE (policy_id, version)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_policy_revisions_policy
        ON mitigation_policy_revisions (policy_id, version DESC)
    `);

    // ── Policy Evaluation Audit ───────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mitigation_policy_audit (
        id            BIGSERIAL     PRIMARY KEY,
        policy_id     VARCHAR(120)  NOT NULL,

        -- Event classification
        event_type    VARCHAR(40)   NOT NULL,
        -- Valid values:
        --   EVALUATED      — policy was checked against current metrics (no match)
        --   MATCHED        — policy conditions were satisfied
        --   SIGNAL_PROPOSED — a MitigationSignal was generated from this match
        --   SIMULATION_HIT — matched in simulation_mode (signal not proposed)
        --   ENABLED        — policy was enabled by an operator
        --   DISABLED       — policy was disabled by an operator
        --   CONFIDENCE_BLOCKED — policy matched but confidence gate blocked signal
        --   VERSION_CHANGED — policy was updated (new revision created)

        -- Runtime observability: what metrics were observed when this fired
        observed_metrics JSONB,

        -- Actor (operator ID or 'system' for automatic events)
        actor         VARCHAR(120),

        -- Additional context
        metadata      JSONB         NOT NULL DEFAULT '{}',

        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_policy_audit_policy
        ON mitigation_policy_audit (policy_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_policy_audit_event
        ON mitigation_policy_audit (event_type, created_at DESC)
    `);

    // Retention: policy audit auto-partitioned by month is recommended at >50M rows.
    // For now, implement a simple 90-day soft-delete via scheduled cleanup (future).

    // ── Phase AK: Graph Persistence ───────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS op_graph_nodes (
        id              VARCHAR(120)  PRIMARY KEY,

        -- Node classification
        type            VARCHAR(30)   NOT NULL,
        -- Valid types: INCIDENT | MITIGATION | PROJECTION | QUEUE_JOB | DOMAIN_EVENT | REVISION

        label           TEXT          NOT NULL,

        -- Temporal anchor — the moment this event occurred (not DB insert time)
        event_timestamp TIMESTAMPTZ   NOT NULL,

        -- Severity (nullable — not all node types have severity)
        severity        VARCHAR(20),

        -- Domain linkage
        slo_id          VARCHAR(80),
        tenant_id       UUID,
        correlation_id  VARCHAR(120),

        -- Full event metadata for UI drill-down and future AI enrichment
        metadata        JSONB         NOT NULL DEFAULT '{}',

        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_op_nodes_type_time
        ON op_graph_nodes (type, event_timestamp DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_op_nodes_correlation
        ON op_graph_nodes (correlation_id, event_timestamp DESC)
        WHERE correlation_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_op_nodes_slo
        ON op_graph_nodes (slo_id, event_timestamp DESC)
        WHERE slo_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_op_nodes_tenant
        ON op_graph_nodes (tenant_id, event_timestamp DESC)
        WHERE tenant_id IS NOT NULL
    `);

    // ── Graph Edges ───────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS op_graph_edges (
        id            BIGSERIAL     PRIMARY KEY,

        from_node_id  VARCHAR(120)  NOT NULL REFERENCES op_graph_nodes(id) ON DELETE CASCADE,
        to_node_id    VARCHAR(120)  NOT NULL REFERENCES op_graph_nodes(id) ON DELETE CASCADE,

        -- Edge type
        relation      VARCHAR(30)   NOT NULL,
        -- Valid relations: CAUSED | TRIGGERED | RESOLVED | ROLLED_BACK |
        --                  PROJECTED | ENQUEUED | CORRELATED

        -- When this causal relationship was established
        edge_timestamp TIMESTAMPTZ  NOT NULL,

        -- Causal confidence: 1.0 = deterministic, 0.7 = strong, 0.5 = inferred
        confidence    NUMERIC(3,2)  NOT NULL DEFAULT 0.5,

        UNIQUE (from_node_id, to_node_id, relation)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_op_edges_from
        ON op_graph_edges (from_node_id, relation)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_op_edges_to
        ON op_graph_edges (to_node_id, relation)
    `);

    // Composite: forward traversal
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_op_edges_traversal_fwd
        ON op_graph_edges (from_node_id, to_node_id, confidence DESC)
    `);

    // ── Incident Subgraph Index ───────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS op_graph_incident_subgraphs (
        id                SERIAL        PRIMARY KEY,

        -- The incident breach node that anchors this subgraph
        incident_node_id  VARCHAR(120)  NOT NULL REFERENCES op_graph_nodes(id) ON DELETE CASCADE,

        -- Pre-computed traversal: all node IDs reachable from this incident
        -- within depth=5 bidirectional BFS
        node_ids          TEXT[]        NOT NULL,

        -- All edge IDs included in this subgraph (for fast join)
        edge_ids          BIGINT[]      NOT NULL,

        -- Reconstruction metadata
        reconstructed_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        depth_traversed   SMALLINT      NOT NULL DEFAULT 5,
        node_count        SMALLINT      NOT NULL DEFAULT 0,
        edge_count        SMALLINT      NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subgraph_incident
        ON op_graph_incident_subgraphs (incident_node_id, reconstructed_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_subgraph_timestamp
        ON op_graph_incident_subgraphs (reconstructed_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS op_graph_incident_subgraphs`);
    await queryRunner.query(`DROP TABLE IF EXISTS op_graph_edges`);
    await queryRunner.query(`DROP TABLE IF EXISTS op_graph_nodes`);
    await queryRunner.query(`DROP TABLE IF EXISTS mitigation_policy_audit`);
    await queryRunner.query(`DROP TABLE IF EXISTS mitigation_policy_revisions`);
    await queryRunner.query(`DROP TABLE IF EXISTS mitigation_policies`);
  }
}
