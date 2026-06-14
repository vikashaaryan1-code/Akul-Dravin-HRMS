/**
 * QUEUE JOB ENVELOPE + TYPED JOB PAYLOADS
 *
 * PRD §Distributed Architecture — Standard job contract for all BullMQ queues.
 *
 * ── Design Principles ───────────────────────────────────────────────────────
 *  1. Every job carries a QueueJobEnvelope<T> — prevents queue inconsistency
 *     as processor count grows.
 *  2. idempotencyKey is MANDATORY — processors use it for deduplication.
 *     Format convention: `<domain>:<entityId>:<operation>:<period>`
 *     Example: `payroll:batch_abc123:run:2026-05`
 *  3. correlationId threads back to the originating HTTP request for end-to-end
 *     tracing: request → event → queue → processor → audit.
 *  4. causationId identifies the upstream event or job that triggered this job,
 *     enabling full causal lineage reconstruction.
 *  5. timestamp is immutable — set at enqueue time.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENVELOPE (every job wraps its payload in this)
// ─────────────────────────────────────────────────────────────────────────────

export interface QueueJobEnvelope<T = Record<string, unknown>> {
  /** Tenant that owns this job — never nullable. */
  readonly tenantId: string;
  /** Threads back to originating HTTP request. */
  readonly correlationId: string;
  /** ID of upstream event/job that triggered this job (causal lineage). */
  readonly causationId?: string;
  /** Actor (userId or 'system') that originated the operation. */
  readonly actorId?: string;
  /**
   * Idempotency key — processor uses Redis SET NX to guarantee exactly-once
   * processing within a TTL window. MUST be unique per logical operation.
   */
  readonly idempotencyKey: string;
  /** ISO timestamp of enqueue time — immutable. */
  readonly timestamp: string;
  /** Domain-specific job payload. */
  readonly payload: T;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI QUEUE PAYLOADS  (queue: 'ai-jobs')
// ─────────────────────────────────────────────────────────────────────────────

export interface AiAttritionScanPayload {
  /** If absent, scan entire tenant workforce. */
  employeeIds?: string[];
  /** Horizon in months for prediction window. Default: 6. */
  horizonMonths?: number;
}

export interface AiCandidateScorePayload {
  candidateId: string;
  jobId: string;
}

export interface AiWorkforceForecastPayload {
  horizonMonths: number;
  includeScenarios?: boolean;
}

export type AiAttritionScanJob       = QueueJobEnvelope<AiAttritionScanPayload>;
export type AiCandidateScoreJob      = QueueJobEnvelope<AiCandidateScorePayload>;
export type AiWorkforceForecastJob   = QueueJobEnvelope<AiWorkforceForecastPayload>;

// AI job names (string constants used with @Process() decorator)
export const AI_JOB = {
  ATTRITION_SCAN:       'attrition-scan',
  CANDIDATE_SCORE:      'candidate-score',
  WORKFORCE_FORECAST:   'workforce-forecast',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS QUEUE PAYLOADS  (queue: 'analytics')
// ─────────────────────────────────────────────────────────────────────────────

export type AnalyticsDomain = 'workforce' | 'recruitment' | 'revenue';

export interface AnalyticsKpiSnapshotPayload {
  domain: AnalyticsDomain;
}

export interface AnalyticsCacheWarmPayload {
  /** Specific cache keys to warm. If absent, warm all keys for tenant. */
  keys?: string[];
}

export interface AnalyticsTrendMaterializePayload {
  /** ISO date string: 'YYYY-MM' */
  period: string;
  domain: AnalyticsDomain;
}

export type AnalyticsKpiSnapshotJob     = QueueJobEnvelope<AnalyticsKpiSnapshotPayload>;
export type AnalyticsCacheWarmJob       = QueueJobEnvelope<AnalyticsCacheWarmPayload>;
export type AnalyticsTrendMaterializeJob = QueueJobEnvelope<AnalyticsTrendMaterializePayload>;

export const ANALYTICS_JOB = {
  KPI_SNAPSHOT:       'kpi-snapshot',
  CACHE_WARM:         'cache-warm',
  TREND_MATERIALIZE:  'trend-materialize',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL QUEUE PAYLOADS  (queue: 'payroll')
// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollBatchPayload {
  batchId: string;
  /** ISO date string: 'YYYY-MM' */
  period: string;
  dryRun?: boolean;
}

export interface CommissionPeriodPayload {
  /** ISO date string: 'YYYY-MM' */
  period: string;
  /** If absent, compute for all recruiters in tenant. */
  recruiterIds?: string[];
}

export type PayrollBatchJob       = QueueJobEnvelope<PayrollBatchPayload>;
export type CommissionPeriodJob   = QueueJobEnvelope<CommissionPeriodPayload>;

export const PAYROLL_JOB = {
  PAYROLL_BATCH:      'payroll-batch',
  COMMISSION_PERIOD:  'commission-period',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION QUEUE PAYLOADS  (queue: 'notifications')
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'in_app' | 'sms';

export interface NotificationPayload {
  recipientId: string;
  recipientEmail?: string;
  channel: NotificationChannel;
  template: string;
  templateData: Record<string, unknown>;
  webhookUrl?: string;
}

export type NotificationJob = QueueJobEnvelope<NotificationPayload>;

export const NOTIFICATION_JOB = {
  SEND: 'send',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNANCE QUEUE PAYLOADS  (queue: 'governance')
// ─────────────────────────────────────────────────────────────────────────────

export type ChangeReason =
  | 'PROMOTION'
  | 'SALARY_ADJUSTMENT'
  | 'COMPENSATION_REVIEW'
  | 'COMPLIANCE_UPDATE'
  | 'SYSTEM_MIGRATION'
  | 'MANUAL_OVERRIDE'
  | 'ONBOARDING'
  | 'OFFBOARDING'
  | 'ROLE_CHANGE'
  | 'POLICY_ENFORCEMENT'
  | 'AUDIT_CORRECTION';

export interface AuditPersistPayload {
  tenantId: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  description?: string;
  changeReason?: ChangeReason;
  metadata?: Record<string, unknown>;
}

export interface ComplianceScanPayload {
  entityType: string;
  entityId?: string;
  /** Scan scope: 'entity' (single) or 'tenant' (all entities of type). */
  scope: 'entity' | 'tenant';
}

export interface PolicyEvaluatePayload {
  entityType: string;
  entityId: string;
  triggerEvent: string;
}

export type AuditPersistJob        = QueueJobEnvelope<AuditPersistPayload>;
export type ComplianceScanJob      = QueueJobEnvelope<ComplianceScanPayload>;
export type PolicyEvaluateJob      = QueueJobEnvelope<PolicyEvaluatePayload>;

export const GOVERNANCE_JOB = {
  AUDIT_PERSIST:      'audit-persist',
  COMPLIANCE_SCAN:    'compliance-scan',
  POLICY_EVALUATE:    'policy-evaluate',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DEAD LETTER RECORD
// ─────────────────────────────────────────────────────────────────────────────

export interface DeadLetterRecord {
  queueName: string;
  jobName: string;
  tenantId: string;
  idempotencyKey: string;
  payload: QueueJobEnvelope<unknown>;
  errorMessage: string;
  stackTrace?: string;
  attempts: number;
}
