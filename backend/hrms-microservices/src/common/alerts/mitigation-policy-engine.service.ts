import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  BurnRate, SloId, MitigationSignal, MitigationState,
  MitigationTransition, MitigationActionType,
} from './slo.types';
import { RemediationConfidenceService } from './remediation-confidence.service';

// ── Policy DSL ────────────────────────────────────────────────────────────────

/**
 * Observable metrics that policy conditions can reference.
 *
 * All burn_rate_* metrics compare against `BurnRate.rate`.
 * `violation_rate_*` compares against `BurnRate.violationRate` (0–1).
 * `confidence_score` compares against RemediationConfidenceService.getActionScore().
 */
export type PolicyMetric =
  | 'burn_rate_1h'        // BurnRate.rate where window = '1h'
  | 'burn_rate_6h'        // BurnRate.rate where window = '6h'
  | 'burn_rate_24h'       // BurnRate.rate where window = '24h'
  | 'violation_rate_1h'   // BurnRate.violationRate where window = '1h'
  | 'violation_count_1h'  // BurnRate.violationCount where window = '1h'
  | 'forecast_exhaustion' // BurnRate.forecastExhaustionMin (from 1h window)
  | 'confidence_score';   // Historical remediation confidence (0–100), or null if no data

export type PolicyOperator = '>' | '>=' | '<' | '<=' | '==';

/** A single predicate in a policy condition — all conditions in a policy are AND-joined */
export interface PolicyCondition {
  metric:   PolicyMetric;
  operator: PolicyOperator;
  value:    number;
}

/**
 * A declarative mitigation policy rule.
 *
 * Replaces the hardcoded if-else chains in MitigationSignalService.
 * Policies are evaluated in priority order (lower number = higher priority).
 * The first matching policy per (sloId, action) pair wins.
 *
 * ── Condition semantics ──────────────────────────────────────────────────────
 *  All conditions in `conditions[]` are AND-joined.
 *  A policy matches only when ALL conditions evaluate to true.
 *
 * ── Confidence guard ─────────────────────────────────────────────────────────
 *  If `minConfidenceScore` is set, the policy only fires when historical
 *  outcome data supports this action with at least that confidence score.
 *  If no outcome data exists yet (null), the policy fires unconditionally
 *  (bootstrap behavior — data will accumulate over time).
 */
export interface MitigationPolicy {
  id:            string;
  sloId:         SloId;
  name:          string;
  description:   string;
  priority:      number;       // Lower = evaluated first
  conditions:    PolicyCondition[];
  action:        MitigationActionType;
  urgency:       'CRITICAL' | 'HIGH' | 'MEDIUM';
  autoExecutable: boolean;
  parameter?:    number | string;
  /** targetResource for this action — e.g. 'projection:workforce', 'queue:ai-jobs' */
  targetResource: string;
  /** Recommendation text template. {sloId}, {rate_1h}, {rate_6h} are interpolated */
  recommendationTemplate: string;
  /** Minimum historical confidence (0–100) required to fire; null = no gate */
  minConfidenceScore?: number;
  enabled:       boolean;
}

/** Result of evaluating one policy against current metrics */
export interface PolicyMatch {
  policy:          MitigationPolicy;
  matchedConditions: Array<{ condition: PolicyCondition; observedValue: number }>;
  confidenceScore: number | null;
  triggerReason:   string;
}

// ── Default Policy Registry ───────────────────────────────────────────────────

/**
 * Platform-wide default policy set.
 *
 * These replace all hardcoded conditional branches in MitigationSignalService.
 * The declarative format means new policies can be added, modified, or disabled
 * without touching evaluation logic.
 *
 * Ordering: CRITICAL fast-burn policies always have lower priority numbers
 * than HIGH slow-burn policies for the same SLO.
 */
export const DEFAULT_POLICIES: MitigationPolicy[] = [
  // ── projection-rebuild-lag ────────────────────────────────────────────────
  {
    id: 'pol-proj-fast-burn',
    sloId: 'projection-rebuild-lag', priority: 10,
    name: 'Projection Fast-Burn Emergency Rebuild',
    description: 'Immediately rebuilds kpi-snapshot when 1h burn rate exceeds the fast threshold',
    conditions: [{ metric: 'burn_rate_1h', operator: '>=', value: 14 }],
    action: 'priority_rebuild', urgency: 'CRITICAL', autoExecutable: true,
    targetResource: 'projection:workforce',
    recommendationTemplate: 'Projection fast-burn ({rate_1h}× over 1h). Immediate kpi-snapshot rebuild triggered.',
    enabled: true,
  },
  {
    id: 'pol-proj-slow-burn',
    sloId: 'projection-rebuild-lag', priority: 20,
    name: 'Projection Slow-Burn Debounce Reduction',
    description: 'Suggests reducing analytics-queue debounce when 6h burn exceeds slow threshold',
    conditions: [{ metric: 'burn_rate_6h', operator: '>=', value: 6 }],
    action: 'priority_rebuild', urgency: 'HIGH', autoExecutable: false, parameter: 1000,
    targetResource: 'projection:all-domains',
    recommendationTemplate: 'Projection slow-burn ({rate_6h}× over 6h). Consider reducing analytics-queue debounce 5s → 1s.',
    enabled: true,
  },

  // ── ai-recompute-latency ──────────────────────────────────────────────────
  {
    id: 'pol-ai-dual-fast-burn',
    sloId: 'ai-recompute-latency', priority: 10,
    name: 'AI Dual-Window Fast-Burn Throttle',
    description: 'Proposes concurrency reduction when both 1h AND 6h confirm fast-burn',
    conditions: [
      { metric: 'burn_rate_1h', operator: '>=', value: 14 },
      { metric: 'burn_rate_6h', operator: '>=', value: 14 },
    ],
    action: 'reduce_concurrency', urgency: 'CRITICAL', autoExecutable: false, parameter: 1,
    targetResource: 'queue:ai-jobs',
    recommendationTemplate: 'AI dual-window fast-burn (1h={rate_1h}×, 6h={rate_6h}×). Reduce concurrency 3 → 1.',
    enabled: true,
  },
  {
    id: 'pol-ai-slow-burn',
    sloId: 'ai-recompute-latency', priority: 20,
    name: 'AI Slow-Burn Concurrency Reduction',
    description: 'Throttles AI insights when 1h burn exceeds slow threshold',
    conditions: [{ metric: 'burn_rate_1h', operator: '>=', value: 6 }],
    action: 'reduce_concurrency', urgency: 'HIGH', autoExecutable: false, parameter: 2,
    targetResource: 'queue:ai-jobs',
    recommendationTemplate: 'AI slow-burn ({rate_1h}× over 1h). Throttle scheduled AI insights until latency recovers.',
    enabled: true,
  },

  // ── dlq-spike ─────────────────────────────────────────────────────────────
  {
    id: 'pol-dlq-fast-burn',
    sloId: 'dlq-spike', priority: 10,
    name: 'DLQ Fast-Burn Drain Alert',
    description: 'Immediately alerts operator to drain DLQ when fast-burn detected',
    conditions: [{ metric: 'burn_rate_1h', operator: '>=', value: 14 }],
    action: 'drain_dlq', urgency: 'CRITICAL', autoExecutable: false,
    targetResource: 'queue:all',
    recommendationTemplate: 'DLQ fast-burn ({violation_count_1h} entries this hour). Navigate to DLQ Manager and replay/dismiss.',
    enabled: true,
  },
  {
    id: 'pol-dlq-slow-burn-circuit',
    sloId: 'dlq-spike', priority: 20,
    name: 'DLQ Slow-Burn Circuit Breaker',
    description: 'Proposes disabling non-critical notification fanout on sustained DLQ growth',
    conditions: [{ metric: 'burn_rate_6h', operator: '>=', value: 6 }],
    action: 'circuit_break', urgency: 'HIGH', autoExecutable: false,
    targetResource: 'queue:notifications',
    recommendationTemplate: 'DLQ slow-burn ({rate_6h}× over 6h). Disable non-critical notification fanout (marketing, digests).',
    enabled: true,
  },

  // ── notification-delivery-lag ─────────────────────────────────────────────
  {
    id: 'pol-notif-slow-burn',
    sloId: 'notification-delivery-lag', priority: 10,
    name: 'Notification Slow-Burn Queue Pause',
    description: 'Pauses digest/bulk notification jobs during sustained pressure',
    conditions: [{ metric: 'burn_rate_1h', operator: '>=', value: 6 }],
    action: 'pause_queue', urgency: 'MEDIUM', autoExecutable: false,
    targetResource: 'queue:notifications',
    recommendationTemplate: 'Notification slow-burn ({rate_1h}× over 1h). Pause digest/bulk jobs during pressure period.',
    enabled: true,
  },
];

// ── Policy Evaluation Context ─────────────────────────────────────────────────

interface EvalContext {
  burnRateByKey: Map<string, BurnRate>; // `${sloId}:${window}` → BurnRate
}

/**
 * MITIGATION POLICY ENGINE — Phase AG
 *
 * Evaluates the policy registry against current burn rate metrics, returning
 * matched policies as structured PolicyMatch results.
 *
 * ── Architecture ──────────────────────────────────────────────────────────────
 *  Before:  MitigationSignalService contains hardcoded if-else evaluation logic.
 *           Adding a new mitigation type requires editing the service itself.
 *
 *  After:   MitigationPolicyEngine holds a declarative policy registry.
 *           MitigationSignalService delegates evaluation here.
 *           Adding a new mitigation type = adding one entry to DEFAULT_POLICIES.
 *
 * ── Evaluation semantics ──────────────────────────────────────────────────────
 *  1. Filter to enabled policies for the SLOs that have burn rate data.
 *  2. Sort by priority ASC within each SLO.
 *  3. For each policy, evaluate ALL conditions (AND-join).
 *  4. If minConfidenceScore is set and outcome data exists, enforce the gate.
 *  5. Return PolicyMatch[] for all matching policies.
 *     → Callers decide whether to propose signals or deduplicate.
 *
 * ── Runtime policy modification ───────────────────────────────────────────────
 *  Policies can be disabled/enabled at runtime via disablePolicy/enablePolicy.
 *  This allows operators to suppress specific automated responses during
 *  maintenance windows or incident investigation without a service redeploy.
 */
@Injectable()
export class MitigationPolicyEngine {
  private readonly logger   = new Logger(MitigationPolicyEngine.name);
  private readonly policies = new Map<string, MitigationPolicy>(
    DEFAULT_POLICIES.map(p => [p.id, p]),
  );

  constructor(private readonly confidence: RemediationConfidenceService) {}

  // ── Evaluation ────────────────────────────────────────────────────────────

  evaluate(burnRates: BurnRate[]): PolicyMatch[] {
    const ctx: EvalContext = {
      burnRateByKey: new Map(burnRates.map(br => [`${br.sloId}:${br.window}`, br])),
    };

    const matches: PolicyMatch[] = [];
    const sorted = [...this.policies.values()]
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const policy of sorted) {
      const match = this.matchPolicy(policy, ctx);
      if (match) {
        matches.push(match);
        this.logger.debug(`[PolicyEngine] MATCH: ${policy.id} (${policy.sloId}/${policy.action})`);
      }
    }

    return matches;
  }

  /**
   * Convert a PolicyMatch into a MitigationSignal for handoff to MitigationSignalService.
   * Called by MitigationSignalService.evaluate() after dedup/stabilization checks.
   */
  buildSignalFromMatch(match: PolicyMatch, now = new Date().toISOString()): Omit<MitigationSignal, 'id' | 'state' | 'transitions' | 'lastTransitionAt' | 'generatedAt'> {
    const { policy, matchedConditions, triggerReason } = match;
    const burnRates = matchedConditions.map(mc =>
      `${mc.condition.metric}=${mc.observedValue.toFixed(2)}`,
    );
    const recommendation = this.interpolateTemplate(policy.recommendationTemplate, matchedConditions);

    return {
      policyId:       policy.id,
      sloId:          policy.sloId,
      targetResource: policy.targetResource,
      action:         policy.action,
      recommendation,
      autoExecutable: policy.autoExecutable,
      urgency:        policy.urgency,
      parameter:      policy.parameter,
      triggerReason:  `[${policy.id}] ${triggerReason} (${burnRates.join(', ')})`,
    };
  }

  // ── Policy Registry Management ────────────────────────────────────────────

  getPolicies(): MitigationPolicy[] { return [...this.policies.values()]; }

  getPolicy(id: string): MitigationPolicy | undefined { return this.policies.get(id); }

  addPolicy(policy: MitigationPolicy): void {
    this.policies.set(policy.id, policy);
    this.logger.log(`[PolicyEngine] Policy added: ${policy.id}`);
  }

  disablePolicy(id: string): boolean {
    const p = this.policies.get(id);
    if (!p) return false;
    this.policies.set(id, { ...p, enabled: false });
    this.logger.warn(`[PolicyEngine] Policy DISABLED: ${id}`);
    return true;
  }

  enablePolicy(id: string): boolean {
    const p = this.policies.get(id);
    if (!p) return false;
    this.policies.set(id, { ...p, enabled: true });
    this.logger.log(`[PolicyEngine] Policy ENABLED: ${id}`);
    return true;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private matchPolicy(policy: MitigationPolicy, ctx: EvalContext): PolicyMatch | null {
    const matchedConditions: Array<{ condition: PolicyCondition; observedValue: number }> = [];

    for (const cond of policy.conditions) {
      const observed = this.resolveMetric(cond.metric, policy.sloId, ctx);
      if (observed === null) return null;  // metric unavailable — skip policy

      if (!this.applyOperator(observed, cond.operator, cond.value)) return null;
      matchedConditions.push({ condition: cond, observedValue: observed });
    }

    // Confidence gate
    let confidenceScore: number | null = null;
    if (policy.minConfidenceScore !== undefined) {
      confidenceScore = this.confidence.getActionScore(policy.action, policy.sloId);
      if (confidenceScore !== null && confidenceScore < policy.minConfidenceScore) {
        this.logger.debug(
          `[PolicyEngine] CONFIDENCE GATE BLOCKED: ${policy.id} ` +
          `(score=${confidenceScore} < min=${policy.minConfidenceScore})`,
        );
        return null;
      }
    }

    const triggerReason = matchedConditions
      .map(mc => `${mc.condition.metric} ${mc.condition.operator} ${mc.condition.value}`)
      .join(' AND ');

    return { policy, matchedConditions, confidenceScore, triggerReason };
  }

  private resolveMetric(
    metric: PolicyMetric,
    sloId: SloId,
    ctx: EvalContext,
  ): number | null {
    const br1h = ctx.burnRateByKey.get(`${sloId}:1h`);
    const br6h = ctx.burnRateByKey.get(`${sloId}:6h`);

    switch (metric) {
      case 'burn_rate_1h':       return br1h?.rate       ?? null;
      case 'burn_rate_6h':       return br6h?.rate       ?? null;
      case 'burn_rate_24h':      return ctx.burnRateByKey.get(`${sloId}:24h`)?.rate ?? null;
      case 'violation_rate_1h':  return br1h?.violationRate   ?? null;
      case 'violation_count_1h': return br1h?.violationCount  ?? null;
      case 'forecast_exhaustion': return br1h?.forecastExhaustionMin ?? null;
      case 'confidence_score': {
        // confidence_score is evaluated separately in matchPolicy
        // If referenced in a condition, we need a placeholder
        return null;
      }
    }
  }

  private applyOperator(lhs: number, op: PolicyOperator, rhs: number): boolean {
    switch (op) {
      case '>':  return lhs >  rhs;
      case '>=': return lhs >= rhs;
      case '<':  return lhs <  rhs;
      case '<=': return lhs <= rhs;
      case '==': return lhs === rhs;
    }
  }

  private interpolateTemplate(template: string, matched: Array<{ condition: PolicyCondition; observedValue: number }>): string {
    let result = template;
    for (const { condition, observedValue } of matched) {
      const key = `{${condition.metric.replace('burn_rate_', 'rate_')}}`;
      result = result.replace(key, observedValue.toFixed(2));
    }
    return result
      .replace(/\{rate_1h\}/g, matched.find(m => m.condition.metric === 'burn_rate_1h')?.observedValue.toFixed(2) ?? '?')
      .replace(/\{rate_6h\}/g, matched.find(m => m.condition.metric === 'burn_rate_6h')?.observedValue.toFixed(2) ?? '?')
      .replace(/\{violation_count_1h\}/g, String(matched.find(m => m.condition.metric === 'violation_count_1h')?.observedValue ?? '?'));
  }
}
