import { MitigationPlanDef } from './mitigation-plan.types';

/**
 * MITIGATION PLAN LIBRARY — Phase AQ
 *
 * Pre-built mitigation plan definitions encoding operational playbooks.
 *
 * Each plan is a directed workflow of mitigation steps with:
 *  - Sequential prerequisites (dependency graph)
 *  - Per-step success predicates (when to advance)
 *  - Compensation steps (rollback on critical failure)
 *  - Timeout enforcement
 *
 * Register with MitigationPlanExecutor.registerPlan() on module init.
 */

// ── Plan 1: DLQ Recovery ──────────────────────────────────────────────────────

/**
 * DLQ_RECOVERY_PLAN
 *
 * Scenario: DLQ depth has breached SLO; notification and analytics queues
 * are accumulating failed jobs that may cascade to projection staleness.
 *
 * Workflow:
 *   [1] circuit_break (queue:notifications)  — isolate the failing consumer
 *         ↓
 *   [2] drain_dlq (queue:all)                — process accumulated failures
 *         ↓
 *   [3] priority_rebuild (projection:workforce) — rebuild stale projections
 *
 * Rollback:
 *   If drain fails → clear circuit breaker (step 1 compensation)
 */
export const DLQ_RECOVERY_PLAN: MitigationPlanDef = {
  id:          'plan-dlq-recovery',
  name:        'DLQ Recovery Pipeline',
  description: 'Isolate failing consumer → drain DLQ → rebuild stale projections',
  triggerHint: 'dlq-spike SLO breach with queue depth > 500',
  steps: [
    {
      id:              'step-circuit',
      name:            'Circuit Break Failing Consumer',
      action:          'circuit_break',
      targetResource:  'queue:notifications',
      sloId:           'dlq-spike',
      urgency:         'HIGH',
      prerequisites:   [],
      criticalPath:    true,
      successPredicate: { type: 'SIGNAL_RESOLVED' },
      timeoutMs:       10 * 60 * 1000, // 10 min
    },
    {
      id:              'step-drain',
      name:            'Drain DLQ',
      action:          'drain_dlq',
      targetResource:  'queue:all',
      sloId:           'dlq-spike',
      urgency:         'HIGH',
      prerequisites:   ['step-circuit'],
      criticalPath:    true,
      successPredicate: { type: 'STABILIZED', stabilizationMs: 5 * 60 * 1000 },
      timeoutMs:       20 * 60 * 1000, // 20 min
      compensationSteps: [
        {
          action:        'circuit_break',
          targetResource: 'queue:notifications',
          reason:        'Re-isolate consumer — drain failed',
        },
      ],
    },
    {
      id:              'step-rebuild',
      name:            'Rebuild Stale Projections',
      action:          'priority_rebuild',
      targetResource:  'projection:workforce',
      sloId:           'projection-rebuild-lag',
      urgency:         'MEDIUM',
      prerequisites:   ['step-drain'],
      criticalPath:    false,  // rebuild failure doesn't abort plan
      successPredicate: { type: 'TIME_BASED', waitMs: 8 * 60 * 1000 }, // 8 min rebuild window
    },
  ],
};

// ── Plan 2: Projection Lag Recovery ──────────────────────────────────────────

/**
 * PROJECTION_LAG_RECOVERY_PLAN
 *
 * Scenario: AI recompute workloads are starving projection workers,
 * causing workforce/payroll projection staleness.
 *
 * Workflow:
 *   [1] reduce_concurrency (queue:ai-jobs)      — reduce AI job pressure
 *         ↓
 *   [2] priority_rebuild (projection:workforce)  — fast-track stale rebuild
 *
 * Compensation:
 *   If rebuild fails → restore concurrency immediately
 */
export const PROJECTION_LAG_RECOVERY_PLAN: MitigationPlanDef = {
  id:          'plan-projection-lag',
  name:        'Projection Lag Recovery Pipeline',
  description: 'Throttle AI workload → rebuild stale projections',
  triggerHint: 'projection-lag or ai-recompute SLO with staleness > 15min',
  steps: [
    {
      id:              'step-throttle',
      name:            'Throttle AI Job Concurrency',
      action:          'reduce_concurrency',
      targetResource:  'queue:ai-jobs',
      sloId:           'ai-recompute-latency',
      urgency:         'HIGH',
      prerequisites:   [],
      criticalPath:    true,
      successPredicate: { type: 'TIME_BASED', waitMs: 3 * 60 * 1000 }, // 3 min settle
      timeoutMs:       10 * 60 * 1000,
    },
    {
      id:              'step-rebuild-proj',
      name:            'Priority Rebuild Workforce Projection',
      action:          'priority_rebuild',
      targetResource:  'projection:workforce',
      sloId:           'projection-rebuild-lag',
      urgency:         'HIGH',
      prerequisites:   ['step-throttle'],
      criticalPath:    true,
      successPredicate: { type: 'STABILIZED', stabilizationMs: 10 * 60 * 1000 },
      timeoutMs:       25 * 60 * 1000,
      compensationSteps: [
        {
          action:        'reduce_concurrency',
          targetResource: 'queue:ai-jobs',
          reason:        'Rebuild failed — restore AI concurrency to normal',
        },
      ],
    },
  ],
};

// ── Plan 3: Fast Burn Emergency Response ──────────────────────────────────────

/**
 * FAST_BURN_EMERGENCY_PLAN
 *
 * Scenario: Rapid SLO burn rate detected (1h window exhausting >14× budget).
 * Immediate multi-front suppression with operator approval gate at each step.
 *
 * Workflow:
 *   [1] pause_queue (queue:ai-jobs)             — stop new job intake
 *         ↓
 *   [2] drain_dlq (queue:all)                   — clear backlog
 *         ↓
 *   [3] priority_rebuild (projection:all-domains) — restore all domains
 *
 * Each step requires OPERATOR_CONFIRMED success predicate — no automatic advancement.
 */
export const FAST_BURN_EMERGENCY_PLAN: MitigationPlanDef = {
  id:          'plan-fast-burn-emergency',
  name:        'Fast Burn Emergency Response',
  description: 'Full suppression pipeline with operator-gated advancement',
  triggerHint: 'Any SLO with fast burn rate × 14 (1h window)',
  steps: [
    {
      id:              'step-pause',
      name:            'Pause AI Job Queue',
      action:          'pause_queue',
      targetResource:  'queue:ai-jobs',
      sloId:           'ai-recompute-latency',
      urgency:         'CRITICAL',
      prerequisites:   [],
      criticalPath:    true,
      successPredicate: { type: 'OPERATOR_CONFIRMED' },
      timeoutMs:       45 * 60 * 1000,
    },
    {
      id:              'step-drain-all',
      name:            'Drain All DLQs',
      action:          'drain_dlq',
      targetResource:  'queue:all',
      sloId:           'dlq-spike',
      urgency:         'HIGH',
      prerequisites:   ['step-pause'],
      criticalPath:    true,
      successPredicate: { type: 'OPERATOR_CONFIRMED' },
      timeoutMs:       30 * 60 * 1000,
      compensationSteps: [
        {
          action:        'pause_queue',
          targetResource: 'queue:ai-jobs',
          reason:        'Emergency: restore queue pause — drain failed',
        },
      ],
    },
    {
      id:              'step-full-rebuild',
      name:            'Full Domain Projection Rebuild',
      action:          'priority_rebuild',
      targetResource:  'projection:all-domains',
      sloId:           'projection-rebuild-lag',
      urgency:         'HIGH',
      prerequisites:   ['step-drain-all'],
      criticalPath:    false,
      successPredicate: { type: 'OPERATOR_CONFIRMED' },
      timeoutMs:       60 * 60 * 1000,
    },
  ],
};

// ── Canonical Library ─────────────────────────────────────────────────────────

export const MITIGATION_PLAN_LIBRARY: MitigationPlanDef[] = [
  DLQ_RECOVERY_PLAN,
  PROJECTION_LAG_RECOVERY_PLAN,
  FAST_BURN_EMERGENCY_PLAN,
];
