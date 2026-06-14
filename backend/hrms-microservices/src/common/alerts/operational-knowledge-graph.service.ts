import { Injectable, Logger } from '@nestjs/common';

// ── Node / Edge Types ─────────────────────────────────────────────────────────

export type GraphNodeType =
  | 'INCIDENT'       // A detected SLO breach or anomaly
  | 'MITIGATION'     // A fired MitigationSignal
  | 'PROJECTION'     // A projection staleness event
  | 'QUEUE_JOB'      // A queue job (DLQ entry or notable execution)
  | 'DOMAIN_EVENT'   // A domain mutation (PayrollBatch, EmployeeHired, etc.)
  | 'REVISION';      // A revision/snapshot of an entity's state

export type GraphEdgeRelation =
  | 'CAUSED'         // This node directly caused the target
  | 'TRIGGERED'      // This node triggered the target (causal, but weaker)
  | 'RESOLVED'       // This node resolved the target
  | 'ROLLED_BACK'    // This node rolled back the target
  | 'PROJECTED'      // Domain event was projected into a projection node
  | 'ENQUEUED'       // Domain event was enqueued as a queue job
  | 'CORRELATED';    // Shares a correlationId — causal link inferred, not certain

export interface GraphNode {
  id:           string;
  type:         GraphNodeType;
  label:        string;
  timestamp:    string;
  severity?:    'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  sloId?:       string;
  tenantId?:    string;
  correlationId?: string;
  /** Arbitrary metadata for UI drill-down */
  metadata:     Record<string, unknown>;
}

export interface GraphEdge {
  from:     string;   // GraphNode.id
  to:       string;   // GraphNode.id
  relation: GraphEdgeRelation;
  timestamp: string;
  /** Weight: 1.0 = deterministic (causationId), 0.7 = strong, 0.5 = inferred */
  confidence: number;
}

export interface GraphTraversalResult {
  rootNode:   GraphNode;
  nodes:      GraphNode[];
  edges:      GraphEdge[];
  depth:      number;
}

/**
 * OPERATIONAL KNOWLEDGE GRAPH — Phase AI
 *
 * An in-memory typed adjacency graph linking operational events across
 * all layers (incidents, mitigations, projections, queue jobs, domain events,
 * revisions) through causal, correlation, and lifecycle edges.
 *
 * ── Architecture ──────────────────────────────────────────────────────────────
 *  This is the backbone for:
 *   - Root-cause analysis (traverse backwards from an incident to its origin)
 *   - Blast-radius estimation (traverse forwards from a domain event)
 *   - Automated incident summarization (BFS from incident node → key linked events)
 *   - Mitigation effectiveness correlation (incident ↔ mitigation node edges)
 *   - AI-assisted operations (graph context → LLM prompt enrichment)
 *
 * ── Data model ────────────────────────────────────────────────────────────────
 *  Nodes: indexed by id (O(1) lookup)
 *  Edges: stored as adjacency lists (forward: from→tos, backward: to→froms)
 *  Both directions are stored for efficient bidirectional traversal.
 *
 * ── Population ────────────────────────────────────────────────────────────────
 *  Populated by IncidentPlaybackService.reconstruct() — after each incident
 *  reconstruction, the timeline events are ingested as graph nodes/edges.
 *  Also accepts direct addNode/addEdge calls from domain handlers.
 *
 * ── Pruning ───────────────────────────────────────────────────────────────────
 *  The graph is bounded at MAX_NODES (5000). When the limit is reached,
 *  oldest nodes by timestamp are evicted first (LRU-by-timestamp).
 *  This prevents unbounded memory growth while retaining recent operational history.
 *
 * ── Serialization ─────────────────────────────────────────────────────────────
 *  The graph can be serialized to a subgraph (nodes + edges for a given incident)
 *  for frontend visualization or export to persistent graph storage (future).
 */
@Injectable()
export class OperationalKnowledgeGraph {
  private readonly logger = new Logger(OperationalKnowledgeGraph.name);
  private readonly MAX_NODES = 5_000;

  private readonly nodes    = new Map<string, GraphNode>();
  private readonly fwdEdges = new Map<string, Set<string>>(); // from → to node ids
  private readonly bwdEdges = new Map<string, Set<string>>(); // to → from node ids
  private readonly edges    = new Map<string, GraphEdge>();   // `${from}:${to}:${relation}` → edge

  // ── Mutation ──────────────────────────────────────────────────────────────

  addNode(node: GraphNode): void {
    if (this.nodes.size >= this.MAX_NODES) this.evictOldest();
    this.nodes.set(node.id, node);
  }

  addEdge(edge: GraphEdge): void {
    const key = `${edge.from}:${edge.to}:${edge.relation}`;
    if (this.edges.has(key)) return; // idempotent

    this.edges.set(key, edge);

    if (!this.fwdEdges.has(edge.from)) this.fwdEdges.set(edge.from, new Set());
    if (!this.bwdEdges.has(edge.to))   this.bwdEdges.set(edge.to,   new Set());

    this.fwdEdges.get(edge.from)!.add(edge.to);
    this.bwdEdges.get(edge.to)!.add(edge.from);
  }

  /** Ingest a full IncidentTimeline into the graph after reconstruction */
  ingestIncidentTimeline(events: Array<{
    id: string; type: string; timestamp: string; severity?: string;
    source: string; description: string; sloId?: string; correlationId?: string;
    causationId?: string; tenantId?: string; causalChain: string[];
    metadata: Record<string, unknown>;
  }>): void {
    const typeMap: Record<string, GraphNodeType> = {
      SLO_BREACH: 'INCIDENT', SLO_RECOVERY: 'INCIDENT',
      DLQ_ENTRY: 'QUEUE_JOB', PROJECTION_STALE: 'PROJECTION',
      MITIGATION_PROPOSED: 'MITIGATION', MITIGATION_EXECUTED: 'MITIGATION',
      MITIGATION_STABILIZING: 'MITIGATION', MITIGATION_RESOLVED: 'MITIGATION',
      MITIGATION_ROLLED_BACK: 'MITIGATION', DOMAIN_MUTATION: 'DOMAIN_EVENT',
    };

    for (const evt of events) {
      this.addNode({
        id: evt.id, type: typeMap[evt.type] ?? 'INCIDENT',
        label: evt.description.slice(0, 80),
        timestamp: evt.timestamp,
        severity: evt.severity as GraphNode['severity'],
        sloId: evt.sloId, tenantId: evt.tenantId,
        correlationId: evt.correlationId,
        metadata: { source: evt.source, ...evt.metadata },
      });

      for (const causedById of evt.causalChain) {
        if (this.nodes.has(causedById)) {
          this.addEdge({
            from: causedById, to: evt.id,
            relation: 'CAUSED',
            timestamp: evt.timestamp,
            confidence: evt.causationId === causedById ? 1.0 : 0.7,
          });
        }
      }
    }
  }

  // ── Traversal ─────────────────────────────────────────────────────────────

  /**
   * Find root causes of a node by traversing backward through CAUSED edges.
   * Returns nodes with no incoming CAUSED edges within the traversal depth.
   */
  findRootCauses(nodeId: string, maxDepth = 5): GraphTraversalResult {
    return this.bfs(nodeId, 'backward', maxDepth);
  }

  /**
   * Estimate blast radius from a node by traversing forward through CAUSED edges.
   * Returns all nodes that were (transitively) caused by the given node.
   */
  getBlastRadius(nodeId: string, maxDepth = 5): GraphTraversalResult {
    return this.bfs(nodeId, 'forward', maxDepth);
  }

  /**
   * Retrieve the direct neighborhood of a node (1 hop in each direction).
   */
  getNeighborhood(nodeId: string): { node: GraphNode | null; caused: GraphNode[]; causedBy: GraphNode[] } {
    const node = this.nodes.get(nodeId) ?? null;
    const caused    = [...(this.fwdEdges.get(nodeId) ?? [])].map(id => this.nodes.get(id)).filter(Boolean) as GraphNode[];
    const causedBy  = [...(this.bwdEdges.get(nodeId) ?? [])].map(id => this.nodes.get(id)).filter(Boolean) as GraphNode[];
    return { node, caused, causedBy };
  }

  /**
   * Extract a subgraph containing a node and all nodes within `depth` hops.
   * Returns nodes + edges for frontend rendering or serialization.
   */
  extractSubgraph(nodeId: string, depth = 3): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const visited = new Set<string>();
    const queue   = [{ id: nodeId, d: 0 }];

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (visited.has(item.id) || item.d > depth) continue;
      visited.add(item.id);

      const fwd = this.fwdEdges.get(item.id) ?? new Set();
      const bwd = this.bwdEdges.get(item.id) ?? new Set();
      for (const n of [...fwd, ...bwd]) {
        if (!visited.has(n)) queue.push({ id: n, d: item.d + 1 });
      }
    }

    const nodes = [...visited].map(id => this.nodes.get(id)).filter(Boolean) as GraphNode[];
    const edges: GraphEdge[] = [];
    for (const edge of this.edges.values()) {
      if (visited.has(edge.from) && visited.has(edge.to)) edges.push(edge);
    }
    return { nodes, edges };
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats(): { nodeCount: number; edgeCount: number; nodesByType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const n of this.nodes.values()) {
      byType[n.type] = (byType[n.type] ?? 0) + 1;
    }
    return { nodeCount: this.nodes.size, edgeCount: this.edges.size, nodesByType: byType };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private bfs(startId: string, direction: 'forward' | 'backward', maxDepth: number): GraphTraversalResult {
    const rootNode = this.nodes.get(startId) ?? null;
    const visited  = new Set<string>();
    const queue    = [{ id: startId, depth: 0 }];
    const resultNodes: GraphNode[] = [];
    const resultEdges: GraphEdge[] = [];
    let   maxReached = 0;

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (visited.has(item.id) || item.depth > maxDepth) continue;
      visited.add(item.id);
      maxReached = Math.max(maxReached, item.depth);

      const node = this.nodes.get(item.id);
      if (node) resultNodes.push(node);

      const neighborIds = direction === 'forward'
        ? this.fwdEdges.get(item.id) ?? new Set()
        : this.bwdEdges.get(item.id) ?? new Set();

      for (const neighborId of neighborIds) {
        if (!visited.has(neighborId)) {
          queue.push({ id: neighborId, depth: item.depth + 1 });
          // Collect the edge
          for (const edge of this.edges.values()) {
            const matches = direction === 'forward'
              ? edge.from === item.id && edge.to === neighborId
              : edge.to === item.id && edge.from === neighborId;
            if (matches && !resultEdges.some(e => e.from === edge.from && e.to === edge.to)) {
              resultEdges.push(edge);
            }
          }
        }
      }
    }

    return {
      rootNode: rootNode!,
      nodes:    resultNodes,
      edges:    resultEdges,
      depth:    maxReached,
    };
  }

  private evictOldest(): void {
    // Sort all nodes by timestamp, evict the 100 oldest
    const sorted = [...this.nodes.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const toEvict = sorted.slice(0, 100);
    for (const node of toEvict) {
      this.nodes.delete(node.id);
      this.fwdEdges.delete(node.id);
      this.bwdEdges.delete(node.id);
      // Clean edges referencing evicted node
      for (const [key, edge] of this.edges.entries()) {
        if (edge.from === node.id || edge.to === node.id) this.edges.delete(key);
      }
    }
    this.logger.debug(`[KnowledgeGraph] Evicted 100 oldest nodes (total now ${this.nodes.size})`);
  }
}
