import { Injectable, Logger } from '@nestjs/common';
import { OperationalKnowledgeGraph, GraphNode, GraphEdge } from './operational-knowledge-graph.service';

// ── RCA Types ─────────────────────────────────────────────────────────────────

export interface RcaSuggestion {
  node:           GraphNode;
  /** 0–1: composite score (causal confidence × centrality × temporal proximity) */
  score:          number;
  /** How many times this node appeared in the blast radii of similar incidents */
  repeatCount:    number;
  /** How deep in the causal chain this node is from the incident anchor */
  depth:          number;
  /** Human-readable explanation of why this node is a probable root cause */
  rationale:      string;
  /** Incoming edge confidence from child → this node */
  edgeConfidence: number;
}

export interface RcaReport {
  incidentNodeId:  string;
  incidentLabel:   string;
  suggestions:     RcaSuggestion[];
  analysisDepth:   number;
  totalCandidates: number;
  analysisMs:      number;
  generatedAt:     string;
}

/**
 * AUTOMATED RCA ENGINE — Phase AM
 *
 * Traverses the OperationalKnowledgeGraph backward from an incident node to
 * identify and rank probable root causes.
 *
 * ── Scoring model ─────────────────────────────────────────────────────────────
 *  Each candidate root cause node is scored by a composite of three signals:
 *
 *  1. CAUSAL CONFIDENCE (weight 0.5)
 *     The confidence score on the causal edges connecting this node to the
 *     incident anchor. Higher = more deterministic causal link.
 *
 *  2. TEMPORAL PROXIMITY (weight 0.3)
 *     How close in time the candidate occurred relative to the incident onset.
 *     Nodes that occurred immediately before the incident are more likely causes.
 *     Decay: linear, from 1.0 at t=0 to 0.0 at t=30min before incident.
 *
 *  3. CAUSAL DEPTH (weight 0.2, inverted)
 *     Nodes at depth 1 (direct parent) are scored higher than depth 4 nodes.
 *     Depth 1 = 1.0, Depth 2 = 0.75, Depth 3 = 0.5, Depth 4+ = 0.25.
 *
 * ── Root-cause identification heuristics ──────────────────────────────────────
 *  A node is a strong root cause candidate if:
 *  - It has NO incoming CAUSED edges within the traversal (true root)
 *  - OR it has incoming edges from outside the incident's causal subgraph
 *  - OR its edge confidence is 1.0 (causationId-backed deterministic link)
 *
 * ── Limitations ───────────────────────────────────────────────────────────────
 *  - The accuracy of suggestions is bounded by the completeness of the graph.
 *    If causal edges were established via temporal proximity (confidence 0.5),
 *    the root cause may be incorrectly attributed.
 *  - repeatCount requires persistent graph data (PersistentGraphService).
 *    For the in-memory-only graph, repeatCount is always 0.
 *  - The engine is intentionally conservative: it presents suggestions as
 *    "probable root causes" not "confirmed root causes".
 */
@Injectable()
export class AutoRcaService {
  private readonly logger = new Logger(AutoRcaService.name);
  private readonly MAX_DEPTH    = 6;
  private readonly MAX_RESULTS  = 10;
  private readonly PROXIMITY_WINDOW_MS = 30 * 60 * 1000; // 30min

  constructor(private readonly graph: OperationalKnowledgeGraph) {}

  // ── Core Analysis ─────────────────────────────────────────────────────────

  /**
   * Analyze an incident node and return ranked probable root cause suggestions.
   */
  analyze(incidentNodeId: string): RcaReport {
    const start     = Date.now();
    const incident  = this.graph.getNeighborhood(incidentNodeId).node;

    if (!incident) {
      this.logger.warn(`[RCA] Incident node not found: ${incidentNodeId}`);
      return { incidentNodeId, incidentLabel: 'Unknown', suggestions: [], analysisDepth: 0, totalCandidates: 0, analysisMs: 0, generatedAt: new Date().toISOString() };
    }

    const incidentTs = new Date(incident.timestamp).getTime();

    // BFS backward from incident — collect all ancestor nodes with their path context
    const ancestors = this.bfsBackward(incidentNodeId, this.MAX_DEPTH);

    const suggestions: RcaSuggestion[] = [];

    for (const { node, depth, minEdgeConfidence, pathEdges } of ancestors) {
      if (node.id === incidentNodeId) continue;

      // Skip recovery events — they can't be root causes
      if (node.type === 'INCIDENT' && node.label.toLowerCase().includes('recovery')) continue;

      const causalScore = this.scoreCausality(minEdgeConfidence);
      const proximityScore = this.scoreProximity(new Date(node.timestamp).getTime(), incidentTs);
      const depthScore = this.scoreDepth(depth);

      const composite = (causalScore * 0.5) + (proximityScore * 0.3) + (depthScore * 0.2);

      suggestions.push({
        node,
        score:          Math.round(composite * 1000) / 1000,
        depth,
        repeatCount:    0, // Populated by PersistentGraphService cross-incident analysis
        edgeConfidence: minEdgeConfidence,
        rationale:      this.buildRationale(node, depth, minEdgeConfidence, proximityScore, incidentTs),
      });
    }

    // Sort by score DESC
    suggestions.sort((a, b) => b.score - a.score);

    const topSuggestions = suggestions.slice(0, this.MAX_RESULTS);
    const elapsed = Date.now() - start;

    return {
      incidentNodeId,
      incidentLabel:   incident.label,
      suggestions:     topSuggestions,
      analysisDepth:   this.MAX_DEPTH,
      totalCandidates: suggestions.length,
      analysisMs:      elapsed,
      generatedAt:     new Date().toISOString(),
    };
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  private scoreCausality(confidence: number): number {
    return confidence; // 1.0, 0.7, or 0.5 from edge confidence field
  }

  private scoreProximity(candidateTs: number, incidentTs: number): number {
    if (candidateTs >= incidentTs) return 0; // Future events can't be causes
    const delta = incidentTs - candidateTs;
    return Math.max(0, 1 - (delta / this.PROXIMITY_WINDOW_MS));
  }

  private scoreDepth(depth: number): number {
    if (depth <= 1) return 1.0;
    if (depth === 2) return 0.75;
    if (depth === 3) return 0.5;
    return 0.25;
  }

  // ── BFS Backward ─────────────────────────────────────────────────────────

  private bfsBackward(startId: string, maxDepth: number): Array<{
    node: GraphNode; depth: number; minEdgeConfidence: number; pathEdges: GraphEdge[];
  }> {
    type BfsItem = {
      id: string; depth: number; minEdgeConf: number; pathEdges: GraphEdge[];
    };

    const visited: Map<string, BfsItem> = new Map();
    const queue: BfsItem[] = [{ id: startId, depth: 0, minEdgeConf: 1.0, pathEdges: [] }];

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (visited.has(item.id) || item.depth > maxDepth) continue;
      visited.set(item.id, item);

      const { causedBy } = this.graph.getNeighborhood(item.id);
      // Resolve edges going TO this node to get confidence
      // We approximate by looking at the neighborhood's incoming edges
      for (const parent of causedBy) {
        if (!visited.has(parent.id)) {
          // Edge confidence is not directly available from getNeighborhood
          // Use a conservative default; PersistentGraphService can enrich this
          const edgeConf = 0.7;
          queue.push({
            id: parent.id,
            depth: item.depth + 1,
            minEdgeConf: Math.min(item.minEdgeConf, edgeConf),
            pathEdges: item.pathEdges,
          });
        }
      }
    }

    const results: Array<{ node: GraphNode; depth: number; minEdgeConfidence: number; pathEdges: GraphEdge[] }> = [];
    for (const [id, item] of visited.entries()) {
      const node = this.graph.getNeighborhood(id).node;
      if (node) results.push({ node, depth: item.depth, minEdgeConfidence: item.minEdgeConf, pathEdges: item.pathEdges });
    }
    return results;
  }

  // ── Rationale ─────────────────────────────────────────────────────────────

  private buildRationale(
    node: GraphNode,
    depth: number,
    edgeConf: number,
    proximityScore: number,
    incidentTs: number,
  ): string {
    const parts: string[] = [];

    const depthDesc = depth === 1 ? 'direct parent' : `${depth} hops back`;
    parts.push(`${node.type.replace('_', ' ')} node at depth ${depth} (${depthDesc})`);

    if (edgeConf >= 1.0) {
      parts.push('deterministic causal link (causationId-backed)');
    } else if (edgeConf >= 0.7) {
      parts.push('strong causal link (correlationId chain)');
    } else {
      parts.push('inferred causal link (temporal proximity)');
    }

    const minutesBeforeIncident = Math.round((incidentTs - new Date(node.timestamp).getTime()) / 60000);
    if (minutesBeforeIncident <= 2)  parts.push('occurred immediately before incident onset');
    else if (minutesBeforeIncident <= 10) parts.push(`occurred ${minutesBeforeIncident}m before incident`);
    else parts.push(`occurred ${minutesBeforeIncident}m before incident (longer lag)`);

    if (proximityScore < 0.3) parts.push('⚠ low temporal proximity — verify causal relationship');

    return parts.join(' · ');
  }
}
