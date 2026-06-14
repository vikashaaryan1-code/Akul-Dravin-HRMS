import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  WaitForGraph, WaitForNode, WaitForEdge, WaitForNodeType,
  DetectedCycle, ResourceOwnership, DependencyAnalysisReport, WaitingEntity,
} from './workflow-dependency.types';
import { MitigationSignal, MitigationState } from './slo.types';
import { MitigationPlanExecution } from './mitigation-plan.types';
import { DeferredMitigation } from './mitigation-scheduler.types';
import { ResourceReservation } from './resource-reservation.types';

const LONG_CHAIN_THRESHOLD = 3; // hops before flagged as livelock risk

/**
 * WORKFLOW DEPENDENCY ANALYZER — Phase AR
 *
 * Builds a wait-for graph from current operational state and detects
 * structural hazards (cycles, long chains, resource contention).
 *
 * ── What the wait-for graph captures ─────────────────────────────────────────
 *
 *   ACTIVE_SIGNAL →[HOLDS]→ RESOURCE
 *     An in-flight signal claims exclusive use of its target resource.
 *     No other signal should be executing against the same resource.
 *
 *   DEFERRED_MATCH →[WAITS_FOR]→ ACTIVE_SIGNAL
 *     A scheduler entry is waiting for a specific signal to resolve.
 *     (RESOURCE_BUSY or DEPENDENCY_INCOMPLETE condition)
 *
 *   DEFERRED_MATCH →[WAITS_FOR]→ RESOURCE
 *     A scheduler entry is waiting for a resource to become unowned.
 *     (RESOURCE_BUSY with only resourceKey, no owningSignalId)
 *
 *   PLAN_STEP →[WAITS_FOR]→ PLAN_STEP
 *     A plan step has unmet prerequisites.
 *
 *   PLAN_STEP →[HOLDS]→ ACTIVE_SIGNAL
 *     A plan step has a signal currently executing.
 *
 * ── Deadlock detection ────────────────────────────────────────────────────────
 *
 *  DFS cycle detection over WAITS_FOR + BLOCKED_BY edges.
 *  Uses WHITE/GRAY/BLACK coloring for efficient O(V+E) detection.
 *
 *  A true deadlock occurs when A waits for B which (transitively) waits for A.
 *  In practice, most cycles resolve via signal timeout — but detecting them
 *  early enables proactive operator intervention.
 *
 * ── Pure analysis service ─────────────────────────────────────────────────────
 *
 *  This service performs no I/O. All data is passed in from the caller
 *  (typically a scheduled endpoint or the dashboard controller).
 *  This keeps it testable, replayable, and simulation-compatible.
 */
@Injectable()
export class WorkflowDependencyAnalyzer {
  private readonly logger = new Logger(WorkflowDependencyAnalyzer.name);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Full dependency analysis pass.
   *
   * @param activeSignals   Current non-terminal signals
   * @param planExecutions  Running and compensating plan executions
   * @param deferredQueue   Current scheduler deferred queue
   */
  analyze(
    activeSignals:      MitigationSignal[],
    planExecutions:     MitigationPlanExecution[],
    deferredQueue:      DeferredMitigation[],
    activeReservations: ResourceReservation[] = [],
  ): DependencyAnalysisReport {
    const graph           = this.buildWaitForGraph(activeSignals, planExecutions, deferredQueue, activeReservations);
    const cycles          = this.detectCycles(graph);
    const resourceOwn     = this.buildResourceOwnership(graph, activeSignals, deferredQueue);
    const longChains      = this.detectLongChains(graph);
    const hotspots        = [...resourceOwn]
      .sort((a, b) => b.contentionScore - a.contentionScore)
      .slice(0, 3);

    const totalWaiters = resourceOwn.reduce((s, r) => s + r.waitingCount, 0);
    const maxDepth     = longChains.length > 0 ? Math.max(...longChains.map(c => c.hopCount)) : 0;

    return {
      graph, cycles, resourceOwnership: resourceOwn, longWaitChains: longChains, hotspots,
      stats: {
        nodeCount:      graph.nodes.length,
        edgeCount:      graph.edges.length,
        cycleCount:     cycles.length,
        longChainCount: longChains.length,
        maxChainDepth:  maxDepth,
        totalWaiters,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Graph Construction ────────────────────────────────────────────────────

  buildWaitForGraph(
    activeSignals:      MitigationSignal[],
    planExecutions:     MitigationPlanExecution[],
    deferredQueue:      DeferredMitigation[],
    activeReservations: ResourceReservation[] = [],
  ): WaitForGraph {
    const nodes = new Map<string, WaitForNode>();
    const edges: WaitForEdge[] = [];
    const now = Date.now();

    // ── Phase AT-2: Reservation nodes → HOLDS → resources ───────────────────
    //  Reservation nodes sit between owners and resources as intermediate pre-claims.
    //  This makes the full chain visible: PLAN_STEP →HOLDS→ RESERVATION →HOLDS→ RESOURCE
    //  and enables cycle detection across pre-claim dependencies.
    for (const reserv of activeReservations) {
      const reservId = `reserv:${reserv.id}`;
      nodes.set(reservId, {
        id: reservId, type: 'RESERVATION',
        label: `[Reserv] ${reserv.resourceKey} ← ${reserv.ownerLabel}`,
        meta:  { resource: reserv.resourceKey, urgency: reserv.urgency, state: reserv.status },
      });
      const resId = `res:${reserv.resourceKey}`;
      if (!nodes.has(resId)) {
        nodes.set(resId, { id: resId, type: 'RESOURCE', label: reserv.resourceKey, meta: { resource: reserv.resourceKey } });
      }
      edges.push({ from: reservId, to: resId, type: 'HOLDS', label: reserv.status });
      
      // Phase AT-1: Lineage - Supersession edge
      if (reserv.supersededReservationId) {
        edges.push({ from: reservId, to: `reserv:${reserv.supersededReservationId}`, type: 'SUPERSEDES', label: 'higher urgency' });
      }

      // If a plan step owns this reservation, add the ownership edge
      if (reserv.planStepId) {
        for (const exec of planExecutions) {
          const step = exec.steps.find(s => s.stepId === reserv.planStepId);
          if (step) {
            // Differentiate between parent OWNER and child BORROWER
            const isBorrower = reserv.status === 'BORROWED';
            edges.push({ 
              from: `step:${exec.id}:${step.stepId}`, 
              to: reservId, 
              type: isBorrower ? 'BORROWS' : 'HOLDS', 
              label: isBorrower ? 'borrowed' : 'reservation' 
            });
            break;
          }
        }
      }
    }

    // ── Active signals → HOLDS → resources ──────────────────────────────────
    for (const sig of activeSignals) {
      if (sig.state === MitigationState.RESOLVED || sig.state === MitigationState.ROLLED_BACK) continue;
      const sigNode: WaitForNode = {
        id: `sig:${sig.id}`, type: 'ACTIVE_SIGNAL',
        label: `${sig.action} (${sig.id.slice(0, 8)})`,
        meta:  { resource: sig.targetResource, action: sig.action, urgency: sig.urgency, state: sig.state },
      };
      const resId = `res:${sig.targetResource}`;
      const resNode: WaitForNode = {
        id: resId, type: 'RESOURCE',
        label: sig.targetResource, meta: { resource: sig.targetResource },
      };
      nodes.set(sigNode.id, sigNode);
      nodes.set(resId, resNode);
      edges.push({ from: sigNode.id, to: resId, type: 'HOLDS', label: sig.state });
    }

    // ── Deferred matches → WAITS_FOR → reservation or signal/resource ───────
    for (const entry of deferredQueue) {
      const dmId   = `dm:${entry.id}`;
      const waitMs = now - new Date(entry.enqueuedAt).getTime();
      const dmNode: WaitForNode = {
        id: dmId, type: 'DEFERRED_MATCH',
        label: `${entry.match.policy.action} (deferred ${entry.totalDeferrals}×)`,
        meta:  {
          resource: entry.match.policy.targetResource, action: entry.match.policy.action,
          urgency:  entry.match.policy.urgency, state: entry.condition.type,
          waitingMs: waitMs, deferralCount: entry.totalDeferrals,
        },
      };
      nodes.set(dmId, dmNode);
      // Prefer pointing to reservation node if one exists for this resource
      const reserv = activeReservations.find(r => r.resourceKey === entry.match.policy.targetResource);
      if (reserv) {
        edges.push({ from: dmId, to: `reserv:${reserv.id}`, type: 'WAITS_FOR', label: 'reservation held' });
      } else if (entry.condition.owningSignalId) {
        edges.push({ from: dmId, to: `sig:${entry.condition.owningSignalId}`, type: 'WAITS_FOR', label: entry.condition.type });
      } else if (entry.condition.resourceKey) {
        const resId = `res:${entry.condition.resourceKey}`;
        if (!nodes.has(resId)) nodes.set(resId, { id: resId, type: 'RESOURCE', label: entry.condition.resourceKey });
        edges.push({ from: dmId, to: resId, type: 'WAITS_FOR', label: entry.condition.type });
      }
      if (entry.condition.dependsOnSignalId) {
        edges.push({ from: dmId, to: `sig:${entry.condition.dependsOnSignalId}`, type: 'WAITS_FOR', label: 'DEPENDENCY_INCOMPLETE' });
      }
    }

    // ── Plan steps → WAITS_FOR → prerequisite steps ──────────────────────────
    for (const exec of planExecutions) {
      if (exec.state !== 'RUNNING' && exec.state !== 'COMPENSATING') continue;

      for (const step of exec.steps) {
        const stepId = `step:${exec.id}:${step.stepId}`;
        const stepNode: WaitForNode = {
          id: stepId, type: 'PLAN_STEP',
          label: `[${exec.planName}] ${step.stepName}`,
          meta:  { state: step.state, planName: exec.planName },
        };
        nodes.set(stepId, stepNode);

        if (step.signalId) {
          const sigId = `sig:${step.signalId}`;
          edges.push({ from: stepId, to: sigId, type: 'HOLDS', label: step.state });
        }

        // PENDING steps wait for their predecessors
        if (step.state === 'PENDING') {
          const idx = exec.steps.indexOf(step);
          if (idx > 0) {
            const prereq = exec.steps[idx - 1];
            if (prereq.state !== 'SUCCEEDED' && prereq.state !== 'SKIPPED') {
              edges.push({ from: stepId, to: `step:${exec.id}:${prereq.stepId}`, type: 'WAITS_FOR', label: 'prerequisite' });
            }
          }
        }

        // Phase AT-2: SUBPLAN_RUNNING step waits for first unfinished step in sub-execution.
        // This adds a cross-level dependency edge so DFS detects parent-child orchestration deadlocks.
        // Pattern: parent.step:SUBPLAN_RUNNING →WAITS_FOR→ subExec.firstUnfinishedStep
        if (step.state === 'SUBPLAN_RUNNING' && step.subExecutionId) {
          const subExec = planExecutions.find(e => e.id === step.subExecutionId);
          if (subExec) {
            const firstUnfinished = subExec.steps.find(
              s => s.state === 'PENDING' || s.state === 'EXECUTING' ||
                   s.state === 'AWAITING_SUCCESS' || s.state === 'SUBPLAN_RUNNING',
            );
            if (firstUnfinished) {
              edges.push({
                from: stepId,
                to:   `step:${subExec.id}:${firstUnfinished.stepId}`,
                type: 'WAITS_FOR', label: 'subplan',
              });
            }
          }
        }
      }
    }

    return { nodes: [...nodes.values()], edges, builtAt: new Date().toISOString() };
  }

  // ── Cycle Detection ───────────────────────────────────────────────────────

  /**
   * DFS cycle detection using WHITE/GRAY/BLACK coloring.
   * WHITE = unvisited, GRAY = in current DFS stack, BLACK = fully visited.
   *
   * A cycle is detected when a GRAY node is reached during traversal.
   * Only traverses WAITS_FOR and BLOCKED_BY edges (not HOLDS).
   */
  detectCycles(graph: WaitForGraph): DetectedCycle[] {
    // Build adjacency list for dependency edges only
    const adj = new Map<string, string[]>();
    for (const node of graph.nodes) adj.set(node.id, []);
    for (const edge of graph.edges) {
      if (edge.type === 'WAITS_FOR' || edge.type === 'BLOCKED_BY') {
        adj.get(edge.from)?.push(edge.to);
      }
    }

    const color  = new Map<string, 'WHITE' | 'GRAY' | 'BLACK'>();
    const parent = new Map<string, string | null>();
    const cycles: DetectedCycle[] = [];
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

    for (const node of graph.nodes) color.set(node.id, 'WHITE');

    const dfs = (nodeId: string, stack: string[]): void => {
      color.set(nodeId, 'GRAY');
      stack.push(nodeId);

      for (const neighbor of adj.get(nodeId) ?? []) {
        if (!color.has(neighbor)) continue; // dangling edge (target not in graph)

        if (color.get(neighbor) === 'GRAY') {
          // Found a cycle — extract the cycle path from the current stack
          const cycleStart = stack.indexOf(neighbor);
          if (cycleStart !== -1) {
            const cyclePath   = stack.slice(cycleStart);
            const cycleLabels = cyclePath.map(id => nodeMap.get(id)?.label ?? id);
            const resources   = cyclePath
              .map(id => nodeMap.get(id)?.meta?.resource)
              .filter((r): r is string => !!r);

            cycles.push({
              id:                randomUUID(),
              severity:          'DEADLOCK',
              path:              [...cyclePath, neighbor],
              pathLabels:        [...cycleLabels, nodeMap.get(neighbor)?.label ?? neighbor],
              involvedResources: [...new Set(resources)],
              detectedAt:        new Date().toISOString(),
              description:
                `Cycle detected: ${cycleLabels.join(' → ')} → ${nodeMap.get(neighbor)?.label ?? neighbor}`,
            });
          }
        } else if (color.get(neighbor) === 'WHITE') {
          dfs(neighbor, stack);
        }
      }

      stack.pop();
      color.set(nodeId, 'BLACK');
    };

    for (const node of graph.nodes) {
      if (color.get(node.id) === 'WHITE') dfs(node.id, []);
    }

    if (cycles.length > 0) {
      this.logger.warn(`[DependencyAnalyzer] ⚠ ${cycles.length} cycle(s) detected in wait-for graph`);
    }

    return cycles;
  }

  // ── Resource Ownership ────────────────────────────────────────────────────

  buildResourceOwnership(
    graph:         WaitForGraph,
    activeSignals: MitigationSignal[],
    deferredQueue: DeferredMitigation[],
  ): ResourceOwnership[] {
    const now = Date.now();
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

    // Find all RESOURCE nodes
    const resources = graph.nodes.filter(n => n.type === 'RESOURCE');

    return resources.map(res => {
      // Owner: a signal that HOLDS this resource
      const ownerEdge = graph.edges.find(e => e.to === res.id && e.type === 'HOLDS');
      const owner     = ownerEdge ? nodeMap.get(ownerEdge.from) ?? null : null;

      // Waiters: all nodes with WAITS_FOR edges pointing to this resource or its owner
      const waiterEdges = graph.edges.filter(e =>
        (e.to === res.id || e.to === owner?.id) && e.type === 'WAITS_FOR',
      );
      const waiting: WaitingEntity[] = waiterEdges.map(e => {
        const node     = nodeMap.get(e.from);
        const enqueuedAt = deferredQueue.find(d => `dm:${d.id}` === e.from)?.enqueuedAt;
        const waitingMs  = enqueuedAt ? now - new Date(enqueuedAt).getTime() : 0;
        return {
          nodeId: e.from, nodeType: node?.type ?? 'DEFERRED_MATCH',
          label: node?.label ?? e.from, waitingMs,
        };
      });

      const avgWaitMs = waiting.length > 0
        ? waiting.reduce((s, w) => s + w.waitingMs, 0) / waiting.length : 0;
      const contentionScore = waiting.length * (avgWaitMs / 300000); // normalize to 5-min ticks

      return { resource: res.label, owner, waitingCount: waiting.length, waiting, contentionScore };
    });
  }

  // ── Long Chain Detection ──────────────────────────────────────────────────

  /**
   * Find wait chains with 3+ hops — indicates livelock risk where resolution
   * depends on a series of sequential external events.
   *
   * Example: D1 waits for S1 → S1 was created by Step X → Step X waits for Step Y
   * Chain: D1 → S1 → Step X → Step Y (3 hops)
   */
  detectLongChains(graph: WaitForGraph): Array<{ chain: string[]; chainLabels: string[]; hopCount: number }> {
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const chains: Array<{ chain: string[]; chainLabels: string[]; hopCount: number }> = [];

    // Build forward adjacency for WAITS_FOR
    const adj = new Map<string, string[]>();
    for (const node of graph.nodes) adj.set(node.id, []);
    for (const edge of graph.edges) {
      if (edge.type === 'WAITS_FOR') adj.get(edge.from)?.push(edge.to);
    }

    const visited = new Set<string>();
    const dfs = (nodeId: string, chain: string[]): void => {
      if (visited.has(nodeId) || chain.includes(nodeId)) return; // avoid infinite loops
      chain.push(nodeId);

      const neighbors = adj.get(nodeId) ?? [];
      if (neighbors.length === 0) {
        // Terminal node — check if chain is long enough
        if (chain.length - 1 >= LONG_CHAIN_THRESHOLD) {
          chains.push({
            chain:       [...chain],
            chainLabels: chain.map(id => nodeMap.get(id)?.label ?? id),
            hopCount:    chain.length - 1,
          });
        }
      } else {
        for (const neighbor of neighbors) dfs(neighbor, chain);
      }
      chain.pop();
    };

    // Start DFS from all DEFERRED_MATCH and PLAN_STEP nodes
    for (const node of graph.nodes) {
      if (node.type === 'DEFERRED_MATCH' || node.type === 'PLAN_STEP') {
        dfs(node.id, []);
        visited.add(node.id);
      }
    }

    return chains.sort((a, b) => b.hopCount - a.hopCount);
  }
}
