// ── Wait-For Graph Primitives ─────────────────────────────────────────────────

export type WaitForNodeType =
  | 'ACTIVE_SIGNAL'   // an in-flight mitigation signal currently holding a resource
  | 'DEFERRED_MATCH'  // a policy match waiting in the scheduler queue
  | 'PLAN_STEP'       // a step in a running plan execution
  | 'RESERVATION'     // a pre-claim lease on a resource (Phase AT-2)
  | 'RESOURCE';       // a target resource (queue:*, projection:*)

export type WaitForEdgeType =
  | 'HOLDS'       // node owns/holds a resource or produces a signal
  | 'WAITS_FOR'   // node cannot progress until target node resolves
  | 'BLOCKED_BY'   // node was arbitration-blocked by target signal
  | 'BORROWS'      // node has delegated access (Phase AT-1)
  | 'SUPERSEDES';  // node displaced a previous holder (Phase AT-1)

export interface WaitForNode {
  id:    string;
  type:  WaitForNodeType;
  label: string;
  meta?: {
    resource?:      string;
    action?:        string;
    urgency?:       string;
    state?:         string;
    waitingMs?:     number;
    deferralCount?: number;
    planName?:      string;
  };
}

export interface WaitForEdge {
  from: string;        // node ID
  to:   string;        // node ID
  type: WaitForEdgeType;
  label?: string;      // human-readable reason
}

export interface WaitForGraph {
  nodes:   WaitForNode[];
  edges:   WaitForEdge[];
  builtAt: string;
}

// ── Cycle Detection ───────────────────────────────────────────────────────────

export type CycleSeverity = 'DEADLOCK' | 'LIVELOCK_RISK';

/**
 * A detected cycle in the wait-for graph.
 *
 * DEADLOCK       — mutual WAITS_FOR creates a cycle where nothing can proceed
 *                  without external intervention (e.g. signal timeout or abort).
 * LIVELOCK_RISK  — a long wait chain where completion depends on a series of
 *                  conditions that may not resolve independently.
 */
export interface DetectedCycle {
  id:                string;
  severity:          CycleSeverity;
  /** Ordered list of node IDs forming the cycle (last edge connects back to first) */
  path:              string[];
  pathLabels:        string[];
  involvedResources: string[];
  detectedAt:        string;
  /** Human-readable description of the cycle */
  description:       string;
}

// ── Resource Ownership ────────────────────────────────────────────────────────

export interface WaitingEntity {
  nodeId:      string;
  nodeType:    WaitForNodeType;
  label:       string;
  /** How long this entity has been waiting (ms) */
  waitingMs:   number;
}

export interface ResourceOwnership {
  resource:     string;
  /** The active signal currently holding this resource, or null if unowned */
  owner:        WaitForNode | null;
  /** How many entities are waiting for this resource to be released */
  waitingCount: number;
  waiting:      WaitingEntity[];
  /** Contention score: waitingCount * (avgWaitingMs / 300000) — higher = more urgent */
  contentionScore: number;
}

// ── Dependency Analysis Report ────────────────────────────────────────────────

export interface DependencyAnalysisReport {
  graph:             WaitForGraph;
  cycles:            DetectedCycle[];
  resourceOwnership: ResourceOwnership[];
  /** Chains with 3+ hops — potential livelock or long-duration blockage */
  longWaitChains:    Array<{ chain: string[]; chainLabels: string[]; hopCount: number }>;
  /** Top 3 most contested resources by contentionScore */
  hotspots:          ResourceOwnership[];
  stats: {
    nodeCount:         number;
    edgeCount:         number;
    cycleCount:        number;
    longChainCount:    number;
    maxChainDepth:     number;
    totalWaiters:      number;
  };
  generatedAt: string;
}
