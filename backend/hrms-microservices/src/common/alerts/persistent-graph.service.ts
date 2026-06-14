import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperationalKnowledgeGraph, GraphNode, GraphEdge } from './operational-knowledge-graph.service';

/**
 * PERSISTENT GRAPH SERVICE — Phase AK
 *
 * Bridges the in-memory OperationalKnowledgeGraph with the `op_graph_nodes`,
 * `op_graph_edges`, and `op_graph_incident_subgraphs` tables introduced
 * in migration 1747420000000.
 *
 * ── Write strategy ────────────────────────────────────────────────────────────
 *  - Writes are async and non-blocking (fire-and-forget with error logging)
 *  - INSERT ON CONFLICT DO NOTHING for idempotent re-ingestion
 *  - Edges use UNIQUE(from, to, relation) — safe to call repeatedly
 *
 * ── Read strategy ─────────────────────────────────────────────────────────────
 *  - The in-memory graph is the primary read path (O(1) lookup, no I/O)
 *  - DB is the durable backup and cross-incident analysis source
 *  - loadRecentIncidents() hydrates the in-memory graph on startup
 *
 * ── Cross-incident analysis ───────────────────────────────────────────────────
 *  The persistent graph unlocks capabilities unavailable with in-memory only:
 *  - Which incidents share a correlationId across different deployments?
 *  - Which queue jobs appear in blast radii of multiple incidents?
 *  - Which mitigation actions are consistently in the RESOLVED set?
 *  - What is the average blast radius depth for projection staleness incidents?
 *
 * ── Graph retention ───────────────────────────────────────────────────────────
 *  Nodes older than 90 days should be pruned via a scheduled job (future).
 *  Incident subgraphs for active incidents are retained indefinitely.
 *  CASCADE deletion on op_graph_edges ensures referential integrity.
 */
@Injectable()
export class PersistentGraphService {
  private readonly logger = new Logger(PersistentGraphService.name);

  constructor(
    private readonly graph:      OperationalKnowledgeGraph,
    private readonly dataSource: DataSource,
  ) {}

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Persist a batch of nodes to the DB (idempotent — safe to call on re-ingestion).
   * Writes are fire-and-forget; failures are logged at WARN level.
   */
  async persistNodes(nodes: GraphNode[]): Promise<void> {
    if (nodes.length === 0) return;
    const values = nodes.map((n, i) => {
      const base = i * 8;
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8}::jsonb)`;
    }).join(',');
    const params = nodes.flatMap(n => [
      n.id, n.type, n.label.slice(0, 400), n.timestamp,
      n.severity ?? null, n.sloId ?? null, n.correlationId ?? null,
      JSON.stringify(n.metadata ?? {}),
    ]);
    await this.dataSource.query(`
      INSERT INTO op_graph_nodes
        (id, type, label, event_timestamp, severity, slo_id, correlation_id, metadata)
      VALUES ${values}
      ON CONFLICT (id) DO NOTHING
    `, params).catch(e => this.logger.warn(`[PersistentGraph] Node persist failed: ${String(e)}`));
  }

  /**
   * Persist a batch of edges to the DB (idempotent).
   */
  async persistEdges(edges: GraphEdge[]): Promise<void> {
    if (edges.length === 0) return;
    const values = edges.map((_, i) => {
      const base = i * 4;
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5})`;
    }).join(',');
    const params = edges.flatMap(e => [e.from, e.to, e.relation, e.timestamp, e.confidence]);
    await this.dataSource.query(`
      INSERT INTO op_graph_edges (from_node_id, to_node_id, relation, edge_timestamp, confidence)
      VALUES ${values}
      ON CONFLICT (from_node_id, to_node_id, relation) DO NOTHING
    `, params).catch(e => this.logger.warn(`[PersistentGraph] Edge persist failed: ${String(e)}`));
  }

  /**
   * Persist a complete incident subgraph after reconstruction.
   * The subgraph indexes which nodes + edges belong to a given incident
   * for fast cross-incident queries.
   */
  async persistIncidentSubgraph(
    incidentNodeId: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): Promise<void> {
    // First persist nodes + edges
    await this.persistNodes(nodes);
    await this.persistEdges(edges);

    // Resolve DB edge IDs for this subgraph
    const edgeIds = await this.resolveEdgeIds(edges);

    await this.dataSource.query(`
      INSERT INTO op_graph_incident_subgraphs
        (incident_node_id, node_ids, edge_ids, depth_traversed, node_count, edge_count)
      VALUES ($1, $2, $3, 5, $4, $5)
    `, [
      incidentNodeId,
      nodes.map(n => n.id),
      edgeIds,
      nodes.length,
      edges.length,
    ]).catch(e => this.logger.warn(`[PersistentGraph] Subgraph persist failed: ${String(e)}`));
  }

  // ── Read / Cross-Incident Analysis ───────────────────────────────────────

  /**
   * Load the most recent N incident subgraphs from DB and hydrate the in-memory graph.
   * Called on service startup to restore recent operational history.
   */
  async loadRecentIncidents(limit = 20): Promise<void> {
    try {
      const subgraphs: Array<Record<string, unknown>> = await this.dataSource.query(`
        SELECT s.incident_node_id, s.node_ids, s.edge_ids
        FROM op_graph_incident_subgraphs s
        ORDER BY s.reconstructed_at DESC
        LIMIT $1
      `, [limit]);

      for (const sg of subgraphs) {
        const nodeIds = sg.node_ids as string[];
        if (!nodeIds.length) continue;

        const nodes: Array<Record<string, unknown>> = await this.dataSource.query(`
          SELECT * FROM op_graph_nodes WHERE id = ANY($1)
        `, [nodeIds]);

        const edgeIds = sg.edge_ids as number[];
        const edges: Array<Record<string, unknown>> = edgeIds.length ? await this.dataSource.query(`
          SELECT * FROM op_graph_edges WHERE id = ANY($1)
        `, [edgeIds]) : [];

        for (const n of nodes) {
          this.graph.addNode({
            id: String(n.id), type: n.type as GraphNode['type'],
            label: String(n.label), timestamp: String(n.event_timestamp),
            severity: n.severity as GraphNode['severity'],
            sloId: n.slo_id as string | undefined,
            correlationId: n.correlation_id as string | undefined,
            metadata: (n.metadata ?? {}) as Record<string, unknown>,
          });
        }
        for (const e of edges) {
          this.graph.addEdge({
            from: String(e.from_node_id), to: String(e.to_node_id),
            relation: e.relation as GraphEdge['relation'],
            timestamp: String(e.edge_timestamp),
            confidence: Number(e.confidence),
          });
        }
      }

      this.logger.log(`[PersistentGraph] Hydrated from ${subgraphs.length} recent incident subgraphs`);
    } catch (e) {
      this.logger.warn(`[PersistentGraph] Startup hydration failed: ${String(e)}`);
    }
  }

  /**
   * Find all incident subgraphs that share a correlationId.
   * Enables cross-incident causal analysis (e.g. same service failure pattern
   * appearing across multiple deployments).
   */
  async findIncidentsByCorrelationId(correlationId: string): Promise<Array<{ incidentNodeId: string; nodeCount: number; reconstructedAt: string }>> {
    const rows = await this.dataSource.query(`
      SELECT s.incident_node_id, s.node_count, s.reconstructed_at
      FROM op_graph_incident_subgraphs s
      JOIN op_graph_nodes n ON s.incident_node_id = n.id
      WHERE $1 = ANY(s.node_ids)
        AND EXISTS (
          SELECT 1 FROM op_graph_nodes n2
          WHERE n2.id = ANY(s.node_ids)
            AND n2.correlation_id = $1
        )
      ORDER BY s.reconstructed_at DESC
      LIMIT 20
    `, [correlationId]).catch(() => []);

    return rows.map((r: Record<string, unknown>) => ({
      incidentNodeId: String(r.incident_node_id),
      nodeCount:      Number(r.node_count),
      reconstructedAt: String(r.reconstructed_at),
    }));
  }

  /**
   * Identify the "hottest" nodes — graph nodes that appear in the blast radius
   * of the most incidents. These are the operational risk hotspots.
   */
  async getHotspotNodes(limit = 10): Promise<Array<{ nodeId: string; label: string; type: string; incidentCount: number }>> {
    const rows = await this.dataSource.query(`
      SELECT n.id AS node_id, n.label, n.type,
             COUNT(DISTINCT s.id) AS incident_count
      FROM op_graph_nodes n
      JOIN op_graph_incident_subgraphs s ON n.id = ANY(s.node_ids)
      GROUP BY n.id, n.label, n.type
      ORDER BY incident_count DESC
      LIMIT $1
    `, [limit]).catch(() => []);

    return rows.map((r: Record<string, unknown>) => ({
      nodeId:        String(r.node_id),
      label:         String(r.label),
      type:          String(r.type),
      incidentCount: Number(r.incident_count),
    }));
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async resolveEdgeIds(edges: GraphEdge[]): Promise<number[]> {
    if (edges.length === 0) return [];
    const rows = await this.dataSource.query(`
      SELECT id FROM op_graph_edges
      WHERE (from_node_id, to_node_id, relation) IN (${edges.map((_, i) => `($${i * 3 + 1},$${i * 3 + 2},$${i * 3 + 3})`).join(',')})
    `, edges.flatMap(e => [e.from, e.to, e.relation])).catch(() => []);
    return rows.map((r: Record<string, unknown>) => Number(r.id));
  }
}
