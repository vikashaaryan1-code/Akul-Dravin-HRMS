/**
 * SLO TYPES — Tracks I + O (Error Budget Extension)
 *
 * Core type contracts for the SLO Engine and Error Budget system.
 *
 * Design philosophy:
 *  - SLOs are first-class named contracts, not anonymous threshold checks.
 *  - Every breach produces a structured AlertRecord with enough context
 *    for an on-call engineer to act without needing to query logs.
 *  - Severity maps directly to pager escalation paths:
 *    CRITICAL → PagerDuty/SMS, HIGH → Slack #alerts, MEDIUM → Slack #ops,
 *    LOW → dashboard-only.
 *  - Error budgets transform SLOs from binary pass/fail into
 *    continuous reliability capital with measurable burn velocity.
 */

// ── SLO Identifiers ───────────────────────────────────────────────────────────

export type SloId =
  | 'projection-rebuild-lag'   // Analytics projection rebuild latency
  | 'payroll-job-success-rate' // Payroll job success rate (24h)
  | 'dlq-spike'                // DLQ total depth (all queues)
  | 'notification-delivery-lag'// Notification delivery latency
  | 'ai-recompute-latency';    // AI worker p95 job duration

// ── Severity ──────────────────────────────────────────────────────────────────

export enum SloSeverity {
  /** Immediate operator action required — breach of business-critical SLO */
  CRITICAL = 'CRITICAL',
  /** Rapid investigation required — degraded but not failed */
  HIGH     = 'HIGH',
  /** Investigation needed within the current shift */
  MEDIUM   = 'MEDIUM',
  /** Informational — no immediate action required */
  LOW      = 'LOW',
}

// ── SLO Status ────────────────────────────────────────────────────────────────

export enum SloStatus {
  /** Currently meeting the SLO target */
  PASSING  = 'PASSING',
  /** Currently breaching the SLO target */
  BREACHING = 'BREACHING',
  /** Not enough data to evaluate */
  UNKNOWN  = 'UNKNOWN',
}

// ── SLO Definition ────────────────────────────────────────────────────────────

export interface SloDefinition {
  /** Stable identifier used in alerts and dashboards */
  id: SloId;
  /** Human-readable name for dashboards */
  name: string;
  /** Description of what this SLO measures */
  description: string;
  /** The target value (e.g. 30 for <30s, 99.95 for 99.95%) */
  target: number;
  /** Unit for display (e.g. 'seconds', 'percent', 'count', 'ms') */
  unit: string;
  /** Direction: 'lower_is_better' | 'higher_is_better' */
  direction: 'lower_is_better' | 'higher_is_better';
  /** Breach severity — drives alert routing */
  severity: SloSeverity;
  /** Cooldown between repeated alerts for this SLO (seconds) */
  alertCooldownSeconds: number;
}

// ── Evaluation Result ─────────────────────────────────────────────────────────

export interface SloResult {
  sloId: SloId;
  sloName: string;
  status: SloStatus;
  /** Measured value at evaluation time */
  currentValue: number;
  /** The configured threshold */
  threshold: number;
  unit: string;
  severity: SloSeverity;
  /** Human-readable breach description */
  message: string;
  /** Percentage deviation from target (+ = breaching, - = headroom) */
  deviationPct: number;
  evaluatedAt: string;
}

// ── Alert Record ──────────────────────────────────────────────────────────────

/**
 * Persistent record of a fired alert.
 * Stored in AlertHistoryService ring buffer and served to PlatformOpsView.
 */
export interface AlertRecord {
  id: string;
  sloId: SloId;
  sloName: string;
  severity: SloSeverity;
  status: 'FIRED' | 'RESOLVED' | 'SUPPRESSED';
  /** Measured value that triggered the breach */
  triggeredValue: number;
  /** Configured threshold */
  threshold: number;
  unit: string;
  message: string;
  tenantId?: string;
  /** ISO timestamp when alert was first fired */
  firedAt: string;
  /** ISO timestamp when alert was resolved (SLO returned to passing) */
  resolvedAt?: string;
  /** Was this alert suppressed by cooldown? */
  suppressed: boolean;
}

// ── Platform Alert Payload ────────────────────────────────────────────────────

/**
 * Extended alert payload for the webhook.
 * Extends the existing DlqAlertPayload with SLO-aware fields.
 */
export interface SloAlertPayload {
  type: 'SLO_BREACH';
  sloId: SloId;
  sloName: string;
  severity: SloSeverity;
  currentValue: number;
  threshold: number;
  unit: string;
  deviationPct: number;
  message: string;
  tenantId?: string;
  timestamp: string;
  remediation: string;
  /** Link to the ops dashboard panel for this SLO */
  dashboardUrl?: string;
}
// ── Error Budget ──────────────────────────────────────────────────────────────

/**
 * Evaluation window labels used across burn rate and rolling window systems.
 */
export type SloWindow = '1h' | '6h' | '24h' | '7d' | '30d';

/**
 * Computed error budget state for a single SLO over a given window.
 *
 * Error budget is the allowed amount of failure before an SLO is breached.
 * For a 99.95% SLO over 30 days: budget = 0.05% × 43,200 min = 21.6 min.
 */
export interface ErrorBudget {
  sloId: SloId;
  sloName: string;
  window: SloWindow;
  /** Duration of the window in minutes */
  windowMinutes: number;
  /** Total allowed error minutes in this window */
  budgetTotalMin: number;
  /** Actual error minutes consumed */
  budgetUsedMin: number;
  /** Remaining budget (may be negative = overdrawn) */
  budgetRemainingMin: number;
  /** 0.0 to 1.0+ — fraction consumed (>1.0 = budget overdrawn) */
  budgetConsumedPct: number;
  /** If budget is overdrawn, by how many minutes */
  overdraftMin: number;
  computedAt: string;
}

/**
 * Burn rate analysis for an SLO.
 *
 * Burn rate 1.0 = exactly on pace to exhaust budget over the full window.
 * Burn rate 14.0 = consuming budget 14× faster → exhausts in 1/14 of window.
 *
 * Standard SRE fast/slow burn thresholds (from Google SRE Workbook):
 *  Fast burn: rate ≥ 14× (1h window) → immediate page
 *  Slow burn: rate ≥  6× (6h window) → investigation alert
 */
export interface BurnRate {
  sloId: SloId;
  window: SloWindow;
  /** Current burn rate multiplier (1.0 = sustainable) */
  rate: number;
  /** Violation count in the window */
  violationCount: number;
  /** Total samples in the window */
  sampleCount: number;
  /** Violation rate: violations / samples */
  violationRate: number;
  /** Is this a fast-burn breach (rate ≥ fast threshold)? */
  isFastBurn: boolean;
  /** Is this a slow-burn breach (rate ≥ slow threshold)? */
  isSlowBurn: boolean;
  /** Fast-burn threshold for this SLO+window */
  fastBurnThreshold: number;
  /** Slow-burn threshold for this SLO+window */
  slowBurnThreshold: number;
  /** Estimated minutes until budget exhaustion at current rate (null = not burning) */
  forecastExhaustionMin: number | null;
  /** Trend vs the previous equivalent window: 'improving' | 'degrading' | 'stable' */
  trend: 'improving' | 'degrading' | 'stable';
  computedAt: string;
}

/**
 * Rolling window SLO evaluation result.
 * Supplements the point-in-time SloResult with windowed statistics.
 */
export interface WindowedSloResult {
  sloId: SloId;
  sloName: string;
  window: SloWindow;
  /** Total SLO evaluations sampled in the window */
  totalSamples: number;
  /** Number of breach samples */
  breachSamples: number;
  /** Breach rate (0.0 to 1.0) */
  breachRate: number;
  /** Estimated percentile breach value (p50, p95, p99) */
  p50Value: number | null;
  p95Value: number | null;
  p99Value: number | null;
  /** Is the trend worsening compared to the prior equivalent window? */
  trend: 'improving' | 'degrading' | 'stable';
  computedAt: string;
}

/**
 * Alert payload fired when burn rate breaches fast or slow burn thresholds.
 * Distinct from SloAlertPayload (point-in-time) — this is a rate-of-change alert.
 */
export interface BurnRateAlert {
  type: 'BURN_RATE_BREACH';
  alertClass: 'fast_burn' | 'slow_burn';
  sloId: SloId;
  sloName: string;
  severity: SloSeverity;
  /** The burn rate multiplier that triggered the alert */
  burnRate: number;
  threshold: number;
  window: SloWindow;
  /** Estimated time until budget exhaustion */
  forecastExhaustionMin: number | null;
  budgetConsumedPct: number;
  message: string;
  timestamp: string;
  remediation: string;
  dashboardUrl?: string;
}

// ── Dual-Window Burn Rate Alert ───────────────────────────────────────────────

/**
 * Alert fired only when burn rate is confirmed across TWO windows simultaneously.
 * Implements the Google SRE Workbook dual-window model to eliminate false positives.
 *
 * Fast-burn page:   1h  ≥ 14× AND 5min ≥ 14× (sustained spike, not transient)
 * Slow-burn ticket: 6h  ≥  6× AND 1h  ≥  6×  (trend, not a blip)
 */
export interface DualWindowBurnAlert {
  type: 'DUAL_WINDOW_BURN';
  alertClass: 'fast_burn' | 'slow_burn';
  sloId: SloId;
  sloName: string;
  severity: SloSeverity;
  /** Primary (shorter) window that triggered */
  primaryWindow: SloWindow;
  primaryBurnRate: number;
  /** Confirmation (longer) window that corroborated */
  confirmationWindow: SloWindow;
  confirmationBurnRate: number;
  /** Both windows exceeded threshold — this is a confirmed degradation event */
  confirmed: true;
  forecastExhaustionMin: number | null;
  budgetConsumedPct: number;
  message: string;
  timestamp: string;
  remediation: string;
  dashboardUrl?: string;
}

// ── Mitigation State Machine ──────────────────────────────────────────────────

/**
 * Lifecycle states for a mitigation signal.
 *
 * PROPOSED     — generated, awaiting operator review
 * ACKNOWLEDGED — operator has seen it; may act or dismiss
 * EXECUTING    — action applied (auto or manual)
 * STABILIZING  — waiting for system to settle after action
 *                (signals for this resource are suppressed during this state)
 * RESOLVED     — SLO returned to passing; mitigation succeeded
 * ROLLED_BACK  — adverse effect detected; operator reversed it (terminal)
 */
export enum MitigationState {
  PROPOSED     = 'PROPOSED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  EXECUTING    = 'EXECUTING',
  STABILIZING  = 'STABILIZING',
  RESOLVED     = 'RESOLVED',
  ROLLED_BACK  = 'ROLLED_BACK',
}

/** A single state transition in a signal's lifecycle audit trail */
export interface MitigationTransition {
  from:   MitigationState;
  to:     MitigationState;
  /** 'system' for auto-transitions, operator ID or 'operator' for manual */
  actor:  'system' | string;
  reason?: string;
  at:     string; // ISO timestamp
}

// ── Mitigation Signal ─────────────────────────────────────────────────────────

export type MitigationActionType =
  | 'reduce_concurrency'    // Reduce queue worker concurrency
  | 'pause_queue'           // Temporarily pause a non-critical queue
  | 'priority_rebuild'      // Trigger immediate projection rebuild (bypass debounce)
  | 'circuit_break'         // Disable non-essential fanout
  | 'drain_dlq';            // Alert operator to actively drain DLQ

export interface MitigationSignal {
  id: string;
  policyId?: string;
  sloId: SloId;
  /** Which operational resource is affected — used as stabilization key */
  targetResource: string;
  action: MitigationActionType;
  recommendation: string;
  autoExecutable: boolean;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  parameter?: number | string;
  triggerReason: string;
  /** Current lifecycle state */
  state: MitigationState;
  /** Ordered audit trail of all state transitions */
  transitions: MitigationTransition[];
  /** ISO timestamp of last state change */
  lastTransitionAt: string;
  /** STABILIZING only: ISO timestamp when stabilization window expires */
  stabilizingUntil?: string;
  generatedAt: string;
}

