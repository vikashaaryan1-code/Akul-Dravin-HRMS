import { Injectable, Logger } from '@nestjs/common';
import {
  ArbitrationVerdict, ArbitrationDecision, ArbitrationReport,
  ActiveSignalSnapshot, ConflictRule, DEFAULT_CONFLICT_RULES,
} from './mitigation-arbitration.types';
import { PolicyMatch } from './mitigation-policy-engine.service';
import { MitigationState, MitigationActionType } from './slo.types';
import { RemediationConfidenceService } from './remediation-confidence.service';
import { ArbitrationUtilityScorer } from './arbitration-utility-scorer.service';
import { DeferralCondition } from './mitigation-scheduler.types';

/**
 * POLICY ARBITRATION ENGINE — Phase AN
 *
 * Sits between MitigationPolicyEngine (what should fire?) and
 * MitigationSignalService (what signals to create?) to enforce:
 *
 *   1. Resource mutex — one active mitigation per target resource
 *   2. Conflict rules — declarative incompatibility between action pairs
 *   3. Urgency priority — CRITICAL beats HIGH beats MEDIUM on same resource
 *   4. Confidence tiebreaker — when urgency is equal, prefer proven actions
 *   5. Deferral semantics — DEFERRED matches are not lost, re-evaluated next tick
 *
 * ── Position in the control flow ────────────────────────────────────────────
 *
 *   BurnRates
 *     ↓
 *   MitigationPolicyEngine.evaluate() → PolicyMatch[]
 *     ↓
 *   PolicyArbitrationEngine.arbitrate() → ArbitrationReport   ← YOU ARE HERE
 *     ↓
 *   MitigationSignalService (only report.allowed become signals)
 *
 * ── Conflict resolution priority (Phase AP upgrade) ──────────────────────────
 *
 *  When two policy matches target the same resource, the winner is determined
 *  by ArbitrationUtilityScorer — a 5-dimension weighted utility function:
 *
 *   1. URGENCY       (35%) — CRITICAL=1.0, HIGH=0.67, MEDIUM=0.33
 *   2. CONFIDENCE    (30%) — historical success rate from RemediationConfidenceService
 *   3. BLAST RADIUS  (15%) — inverted: smaller blast radius = higher score
 *   4. ROLLBACK RISK (12%) — inverted: lower worsened% = higher score
 *   5. RECOVERY TIME  (8%) — inverted: faster recovery = higher score
 *
 * ── Deferred matches ─────────────────────────────────────────────────────────
 *
 *  DEFERRED matches are re-evaluated on the next evaluation tick.
 *  The arbitration engine does NOT maintain a deferred queue itself — that
 *  responsibility belongs to MitigationSignalService which will naturally
 *  re-encounter the same policy match on the next 5-minute cron tick.
 *  The DEFERRED verdict is advisory — it tells the signal service to skip
 *  this match for this tick without advancing to dedup-suppressed state.
 *
 * ── Rule set management ──────────────────────────────────────────────────────
 *
 *  Conflict rules are managed via addRule/disableRule at runtime.
 *  Rules are always evaluated against currently active signals passed in
 *  from MitigationSignalService.getActiveSignals().
 */
@Injectable()
export class PolicyArbitrationEngine {
  private readonly logger = new Logger(PolicyArbitrationEngine.name);
  private readonly rules  = new Map<string, ConflictRule & { disabled?: boolean }>(
    DEFAULT_CONFLICT_RULES.map(r => [r.id, r]),
  );

  constructor(
    private readonly confidence: RemediationConfidenceService,
    private readonly scorer:     ArbitrationUtilityScorer,
  ) {}

  // ── Core Arbitration ──────────────────────────────────────────────────────

  /**
   * Arbitrate a set of policy matches against currently active signals.
   *
   * @param matches         PolicyMatch[] from MitigationPolicyEngine.evaluate()
   * @param activeSignals   In-flight (non-terminal) MitigationSignals
   * @returns               ArbitrationReport with categorized matches and decisions
   */
  arbitrate(matches: PolicyMatch[], activeSignals: ActiveSignalSnapshot[]): ArbitrationReport {
    const decisions: ArbitrationDecision[] = [];
    const allowed:   PolicyMatch[] = [];
    const blocked:   PolicyMatch[] = [];
    const deferred:  PolicyMatch[] = [];
    const conflicts: ArbitrationReport['conflicts'] = [];

    // Step 1: Apply conflict rules against active signals
    const matchDecisions = matches.map(m => this.applyConflictRules(m, activeSignals));

    // Step 2: Apply same-resource competition resolution among candidates
    const resolvedDecisions = this.resolveIntraMatchConflicts(matchDecisions);

    // Step 3: Categorize
    for (const { match, decision } of resolvedDecisions) {
      decisions.push(decision);

      if (decision.verdict === 'ALLOWED') {
        allowed.push(match);
      } else if (decision.verdict === 'BLOCKED') {
        blocked.push(match);
        this.logger.debug(
          `[Arbitration] BLOCKED: ${match.policy.id} — ${decision.reason}`,
        );
      } else if (decision.verdict === 'DEFERRED') {
        deferred.push(match);
        this.logger.debug(
          `[Arbitration] DEFERRED: ${match.policy.id} — ${decision.reason}`,
        );
      } else if (decision.verdict === 'DOWNGRADED') {
        // DOWNGRADED: use adjusted match if available, otherwise original
        allowed.push(decision.adjustedMatch ?? match);
        this.logger.debug(
          `[Arbitration] DOWNGRADED: ${match.policy.id} ${decision.downgradeFrom} → ${decision.downgradeTo}`,
        );
      }
    }

    // Collect conflict summaries
    const resourceWinners = new Map<string, string>(); // resource → winning policy id
    for (const { match, decision } of resolvedDecisions) {
      if (decision.verdict === 'ALLOWED' || decision.verdict === 'DOWNGRADED') {
        const resource = match.policy.targetResource;
        const existing = resourceWinners.get(resource);
        if (!existing) {
          resourceWinners.set(resource, match.policy.id);
        }
      }
    }
    for (const { match, decision } of resolvedDecisions) {
      if (decision.verdict === 'BLOCKED' || decision.verdict === 'DEFERRED') {
        const resource = match.policy.targetResource;
        const winner   = resourceWinners.get(resource) ?? 'active-signal';
        const ruleId   = decision.triggeredRuleIds[0] ?? 'resource-mutex';
        const existing = conflicts.find(c => c.resource === resource && c.winner === winner && c.ruleId === ruleId);
        if (existing) {
          existing.losers.push(match.policy.id);
        } else {
          conflicts.push({ resource, winner, losers: [match.policy.id], ruleId });
        }
      }
    }

    if (decisions.length > 0) {
      const summary = [
        allowed.length  > 0 ? `✅ ${allowed.length} allowed`  : null,
        blocked.length  > 0 ? `🚫 ${blocked.length} blocked`  : null,
        deferred.length > 0 ? `⏸ ${deferred.length} deferred` : null,
      ].filter(Boolean).join(', ');
      this.logger.log(`[Arbitration] Tick resolved: ${summary || 'no matches'}`);
    }

    return { decisions, allowed, blocked, deferred, conflicts, evaluatedAt: new Date().toISOString() };
  }

  // ── Rule Management ───────────────────────────────────────────────────────

  addRule(rule: ConflictRule): void {
    this.rules.set(rule.id, rule);
    this.logger.log(`[Arbitration] Rule added: ${rule.id}`);
  }

  disableRule(id: string): boolean {
    const r = this.rules.get(id);
    if (!r) return false;
    this.rules.set(id, { ...r, disabled: true });
    this.logger.warn(`[Arbitration] Rule disabled: ${id}`);
    return true;
  }

  enableRule(id: string): boolean {
    const r = this.rules.get(id);
    if (!r) return false;
    this.rules.set(id, { ...r, disabled: false });
    this.logger.log(`[Arbitration] Rule enabled: ${id}`);
    return true;
  }

  getRules(): ConflictRule[] {
    return [...this.rules.values()];
  }

  // ── Conflict Rule Evaluation ──────────────────────────────────────────────

  private applyConflictRules(
    match: PolicyMatch,
    activeSignals: ActiveSignalSnapshot[],
  ): { match: PolicyMatch; decision: ArbitrationDecision } {
    const { policy } = match;
    const enabledRules = [...this.rules.values()].filter(r => !(r as any).disabled);

    for (const sig of activeSignals) {
      // Skip terminal signals
      const terminalStates = new Set([MitigationState.RESOLVED, MitigationState.ROLLED_BACK]);
      if (terminalStates.has(sig.state)) continue;

      // Check each rule for a match
      for (const rule of enabledRules) {
        const triggerStates = rule.triggerStates ?? [MitigationState.EXECUTING, MitigationState.STABILIZING];
        if (!triggerStates.includes(sig.state)) continue;

        if (
          this.matchesResource(sig.action, rule.activeAction) &&
          this.matchesResource(sig.targetResource, rule.activeResource) &&
          this.matchesResource(policy.action, rule.candidateAction) &&
          this.matchesResource(policy.targetResource, rule.candidateResource)
        ) {
          // Skip the catch-all same-resource rule unless urgency is actually lower
          if (rule.id === 'cr-same-resource-lower-urgency') {
            if (!this.isLowerUrgency(policy.urgency, sig.urgency)) continue;
          }

          const verdict: ArbitrationVerdict =
            rule.verdict === 'BLOCK' ? 'BLOCKED' :
            rule.verdict === 'DEFER' ? 'DEFERRED' :
            'DOWNGRADED';
          const decision: ArbitrationDecision = {
            policyId:          policy.id,
            policyName:        policy.name,
            verdict,
            blockedBySignalIds: [sig.id],
            triggeredRuleIds:   [rule.id],
            reason:             rule.reason,
          };

          if (verdict === 'DOWNGRADED' && rule.downgradeTarget) {
            decision.downgradeFrom = policy.urgency as 'CRITICAL' | 'HIGH';
            decision.downgradeTo   = rule.downgradeTarget;
            decision.adjustedMatch = {
              ...match,
              policy: { ...policy, urgency: rule.downgradeTarget },
            };
          }

          // For DEFERRED verdicts — populate suggestedDeferralCondition so
          // MitigationScheduler can use precise condition semantics.
          if (verdict === 'DEFERRED') {
            decision.suggestedDeferralCondition = this.buildDeferralCondition(
              rule.id, sig, policy.targetResource,
            );
          }

          return { match, decision };
        }
      }
    }

    // No conflict detected — ALLOWED
    return {
      match,
      decision: {
        policyId:           policy.id,
        policyName:         policy.name,
        verdict:            'ALLOWED',
        blockedBySignalIds: [],
        triggeredRuleIds:   [],
        reason:             'No conflict detected',
      },
    };
  }

  /**
   * Resolve conflicts among the candidate matches themselves
   * (within-tick intra-competition).
   *
   * Phase AP: replaced urgency/confidence/priority cascade with
   * ArbitrationUtilityScorer 5-dimension composite ranking.
   */
  private resolveIntraMatchConflicts(
    matchDecisions: Array<{ match: PolicyMatch; decision: ArbitrationDecision }>,
  ): Array<{ match: PolicyMatch; decision: ArbitrationDecision }> {
    const allowed    = matchDecisions.filter(md => md.decision.verdict === 'ALLOWED');
    const nonAllowed = matchDecisions.filter(md => md.decision.verdict !== 'ALLOWED');

    const byResource = new Map<string, typeof allowed>();
    for (const md of allowed) {
      const res = md.match.policy.targetResource;
      if (!byResource.has(res)) byResource.set(res, []);
      byResource.get(res)!.push(md);
    }

    const result: Array<{ match: PolicyMatch; decision: ArbitrationDecision }> = [...nonAllowed];

    for (const [resource, group] of byResource.entries()) {
      if (group.length === 1) { result.push(group[0]); continue; }

      // Phase AP: utility scorer replaces urgency/confidence/priority cascade
      const ranked = this.scorer.rank(group.map(md => md.match));
      const winnerMatch = ranked[0].match;
      const winnerGroup = group.find(md => md.match.policy.id === winnerMatch.policy.id)!;
      result.push(winnerGroup);

      for (let i = 1; i < ranked.length; i++) {
        const loserMatch = ranked[i].match;
        const loserGroup = group.find(md => md.match.policy.id === loserMatch.policy.id)!;
        const score      = ranked[i].utilityScore;
        result.push({
          match: loserMatch,
          decision: {
            ...loserGroup.decision,
            verdict:            'DEFERRED',
            blockedBySignalIds: [],
            triggeredRuleIds:   ['intra-tick-resource-mutex'],
            reason: `Resource ${resource} claimed by ${winnerMatch.policy.id} ` +
                    `(utility ${(ranked[0].utilityScore.composite * 100).toFixed(1)}% vs ` +
                    `${(score.composite * 100).toFixed(1)}%)`,
            suggestedDeferralCondition: {
              type:          'RESOURCE_BUSY',
              resourceKey:   resource,
              owningSignalId: undefined, // no active signal — intra-tick candidate won
            },
          },
        });
        this.logger.debug(
          `[Arbitration] Intra-tick deferral: ${loserMatch.policy.id} loses ${resource} ` +
          `(${this.scorer.explain(score)})`,
        );
      }
    }

    return result;
  }

  // ── Deferral Condition Builder ────────────────────────────────────────────

  /**
   * Build a DeferralCondition for DEFERRED decisions triggered by conflict rules.
   * The condition type is derived from the rule ID and active signal context.
   */
  private buildDeferralCondition(
    ruleId: string, sig: ActiveSignalSnapshot, candidateResource: string,
  ): DeferralCondition {
    // Stabilization-related rules — wait for stabilization window to expire
    if (ruleId === 'cr-circuit-then-pause' || ruleId === 'cr-reduce-concurrency-rebuild') {
      return {
        type:          'STABILIZING',
        resourceKey:   `${sig.sloId}:${sig.targetResource}`,
        owningSignalId: sig.id,
      };
    }
    // Default: RESOURCE_BUSY — wait for the specific signal to resolve
    return {
      type:           'RESOURCE_BUSY',
      resourceKey:    `${sig.sloId}:${sig.targetResource}`,
      owningSignalId: sig.id,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Resource pattern matching with prefix glob support.
   * 'queue:*' matches 'queue:ai-jobs', 'queue:notifications', etc.
   * '*' matches anything.
   */
  private matchesResource(actual: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith(':*')) return actual.startsWith(pattern.slice(0, -1));
    return actual === pattern;
  }

  private isLowerUrgency(candidate: string, active: string): boolean {
    return this.urgencyRank(candidate) < this.urgencyRank(active);
  }

  private urgencyRank(urgency: string): number {
    return urgency === 'CRITICAL' ? 3 : urgency === 'HIGH' ? 2 : 1;
  }
}
