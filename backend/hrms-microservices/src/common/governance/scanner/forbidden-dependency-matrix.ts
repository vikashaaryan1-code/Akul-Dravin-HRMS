/**
 * FORBIDDEN DEPENDENCY MATRIX — Commit 10 (Revised)
 *
 * Normalized rule shape for machine-readable CI enforcement and SARIF export.
 *
 * Each rule's `forbiddenImports` uses:
 *   { module: string, symbols?: string[] }
 *
 * Where:
 *   module  → npm package name or source path fragment (e.g., 'typeorm', 'src/database/entities')
 *   symbols → specific named exports to forbid (undefined = any import from this module)
 *
 * ALIAS SAFETY:
 *   The scanner resolves named imports via TypeScript AST getName() calls,
 *   which return the ORIGINAL symbol name, not the alias.
 *   `import { EntityManager as EM }` → getName() = 'EntityManager'
 *   → Alias bypasses are structurally impossible.
 *
 * SARIF EXPORT READINESS:
 *   ruleId, severity, and sourcePattern are formatted to map directly to
 *   SARIF v2.1.0 ReportingDescriptor and Result objects.
 */

import { ViolationType, ViolationSeverity } from '../../../database/entities/violation-log.entity';
import { GovernanceRuleId } from './governance-rule-id.enum';


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ForbiddenImport {
  /**
   * npm package name or source path fragment.
   * Matched via: moduleSpecifier.includes(module)
   * Examples: 'typeorm', '@nestjs/common', 'src/database/entities'
   */
  module: string;
  /**
   * Optional list of specific exported symbols to forbid from this module.
   * Matched against the ORIGINAL name (alias-proof via AST getName()).
   * Undefined = ANY import from this module triggers the violation.
   */
  symbols?: string[];
  /** Human-readable reason for this specific import being forbidden. */
  reason: string;
}

export interface ForbiddenDependencyRule {
  /**
   * Stable identifier — used in violation reports, ViolationLogEntity, and test assertions.
   * Never rename without updating enforcement tests and existing DB records.
   */
  id: string;
  /**
   * Regex that matches the relative file path of files this rule applies to.
   * Evaluated against: path.relative(projectRoot, filePath).replace(/\\/g, '/')
   */
  sourcePattern: RegExp;
  /** What these files must not import. */
  forbiddenImports: ForbiddenImport[];
  /** Human-readable explanation of WHY this rule exists. */
  rationale: string;
  /** Severity tier for ViolationLogEntity and governance dashboard. */
  severity: 'critical' | 'high' | 'medium';
  /** ViolationType for ViolationLogEntity persistence. */
  violationType: ViolationType;
}

// ─────────────────────────────────────────────────────────────────────────────
// The Forbidden Dependency Matrix
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FORBIDDEN_DEPENDENCY_MATRIX
 *
 * Ordered by severity (critical first) then by importance.
 *
 * Rule IDs are stable architectural identifiers.
 * The matrix is the domain knowledge; the scanner is the execution engine.
 * New rules require no scanner changes — only matrix additions.
 */
export const FORBIDDEN_DEPENDENCY_MATRIX: ReadonlyArray<ForbiddenDependencyRule> = [

  // ══════════════════════════════════════════════════════════════════════════
  // CRITICAL — Replay correctness violations
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: GovernanceRuleId.HANDLER_NO_DOMAIN_ENTITY_IMPORT,
    sourcePattern: /\.projection-handler\.ts$|\/handlers\/[^/]+\.ts$/,
    forbiddenImports: [
      {
        module:  'src/database/entities',
        symbols: [
          // Operational truth-plane entities — handlers must NEVER import these
          'PayrollBatchEntity',
          'LeaveRequestEntity',
          'EmployeeEntity',
          'AttendanceEntity',
          'TransactionEntity',
          'WalletEntity',
          'WorkflowExecutionEntity',
          'TaskEntity',
          // Adding new domain entities here is the ONLY required change
          // when a new governed domain is added to the platform.
        ],
        reason:
          'Projection handlers that import domain entity classes can inject ' +
          'domain repositories, giving them the ability to mutate operational state. ' +
          'This is the single most dangerous violation: replaying an event through ' +
          'a handler that mutates PayrollBatch would corrupt the operational truth plane.',
      },
      {
        // Broader guard: any import from entities/ that is not an explicit projection entity
        module: 'database/entities',
        reason:
          'Handlers must not depend on the entities directory at all. ' +
          'Handlers receive typed payloads from envelopes — they do not need entity classes.',
      },
    ],
    rationale:
      'This is the most important static analysis rule in the entire governance layer. ' +
      'Commit 9 established the invariant: "projection handlers may not mutate operational entities." ' +
      'Without this static rule, a future engineer can inject a repository into a handler ' +
      'and mutate payroll state during replay, destroying replay determinism. ' +
      'The only safe handlers are those that write exclusively to projection tables ' +
      '(audit_logs, search_index, activity_feed) — never to operational entity tables.',
    severity:      'critical',
    violationType: ViolationType.HANDLER_ENTITY_INJECTION,
  },

  {
    id: GovernanceRuleId.HANDLER_NO_TYPEORM_INJECTION,
    sourcePattern: /\.projection-handler\.ts$|\/handlers\/[^/]+\.ts$/,
    forbiddenImports: [
      {
        module:  'typeorm',
        symbols: ['Repository', 'EntityManager', 'DataSource', 'QueryRunner'],
        reason:
          'TypeORM repository/manager types in a handler parameter ' +
          'indicate direct DB mutation capability. Alias-proof: ' +
          'import { EntityManager as EM } still has getName()=EntityManager.',
      },
      {
        module:  '@nestjs/typeorm',
        symbols: ['InjectRepository', 'InjectDataSource', 'InjectEntityManager'],
        reason:
          'These decorators inject TypeORM resources into the constructor. ' +
          'A handler with @InjectRepository(PayrollBatchEntity) ' +
          'can write to payroll tables during replay.',
      },
    ],
    rationale:
      'Handlers are projection-only actors. They consume event envelopes and ' +
      'write to projection tables (audit, search, notifications). ' +
      'TypeORM access enables operational entity mutations, destroying replay safety.',
    severity:      'critical',
    violationType: ViolationType.HANDLER_ENTITY_INJECTION,
  },

  {
    id: GovernanceRuleId.HANDLER_NO_TRANSACTIONAL_SERVICES,
    sourcePattern: /\.projection-handler\.ts$|\/handlers\/[^/]+\.ts$/,
    forbiddenImports: [
      {
        module:  'payroll.service',
        reason:  'Transactional domain service — can trigger entity mutations',
      },
      {
        module:  'leave.service',
        reason:  'Transactional domain service — can trigger entity mutations',
      },
      {
        module:  'employee.service',
        reason:  'Transactional domain service — can trigger entity mutations',
      },
      {
        module:  'attendance.service',
        reason:  'Transactional domain service — can trigger entity mutations',
      },
      {
        module:  'task-management.service',
        reason:  'Transactional domain service — can trigger entity mutations',
      },
      {
        module:  'finance.service',
        reason:  'Transactional domain service — can trigger entity mutations',
      },
    ],
    rationale:
      'Domain services hold transaction boundaries. Injecting them into handlers ' +
      'creates a replay path that can trigger cascading operational mutations.',
    severity:      'critical',
    violationType: ViolationType.HANDLER_SERVICE_INJECTION,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HIGH — Policy boundary violations
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: GovernanceRuleId.CONTROLLER_NO_DIRECT_REPO,
    sourcePattern: /\.controller\.ts$/,
    forbiddenImports: [
      {
        module:  'typeorm',
        symbols: ['Repository', 'EntityManager', 'DataSource'],
        reason:  'Direct repo in controller bypasses TransitionPolicyEngine and audit journaling.',
      },
      {
        module:  '@nestjs/typeorm',
        symbols: ['InjectRepository', 'InjectDataSource'],
        reason:  '@InjectRepository on a controller = policy bypass.',
      },
    ],
    rationale:
      'Controllers are HTTP transport. They must call services, which own the ' +
      'transaction boundary and governance policy enforcement.',
    severity:      'high',
    violationType: ViolationType.CONTROLLER_REPO_INJECTION,
  },

  {
    id: GovernanceRuleId.GOVERNANCE_MODULE_NO_DOMAIN_IMPORTS,
    sourcePattern: /modules\/governance\/[^/]+\.module\.ts$|common\/governance\/[^/]+\.module\.ts$/,
    forbiddenImports: [
      { module: 'payroll.module',               reason: 'Domain module' },
      { module: 'leave.module',                 reason: 'Domain module' },
      { module: 'employee.module',              reason: 'Domain module' },
      { module: 'attendance.module',            reason: 'Domain module' },
      { module: 'task-management.module',       reason: 'Domain module' },
      { module: 'finance.module',               reason: 'Domain module' },
      { module: 'workflow-automation.module',   reason: 'Domain module' },
      { module: 'recruitment-ats.module',       reason: 'Domain module' },
      { module: 'analytics.module',             reason: 'Domain module' },
    ],
    rationale:
      'GovernanceModule reads from shared infrastructure tables only. ' +
      'Importing domain modules creates tight coupling between the observability ' +
      'layer and the business domains it observes.',
    severity:      'high',
    violationType: ViolationType.FORBIDDEN_MODULE_IMPORT,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEDIUM — Coupling violations
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: GovernanceRuleId.TRANSITION_ENGINE_NO_HTTP,
    sourcePattern: /governance\/transitions\/[^/]+\.ts$|-transition-engine\.ts$/,
    forbiddenImports: [
      {
        module:  '.controller',
        reason:  'Controller import in transition engine = transport/domain coupling.',
      },
      {
        module:  '@nestjs/common',
        symbols: ['Controller', 'Get', 'Post', 'Put', 'Delete', 'Patch', 'Body', 'Param', 'Query'],
        reason:  'HTTP decorators in a domain-layer engine — prevents non-HTTP usage.',
      },
    ],
    rationale:
      'TransitionEngines are domain-layer policy objects. They must be usable in ' +
      'background workers, queue processors, and test environments without HTTP context.',
    severity:      'medium',
    violationType: ViolationType.TRANSITION_ENGINE_VIOLATION,
  },

  {
    id: GovernanceRuleId.OUTBOX_NO_DOMAIN_SERVICES,
    sourcePattern: /domain-events\/outbox[^/]+\.ts$/,
    forbiddenImports: [
      { module: 'payroll.service',   reason: 'Domain service import in outbox infrastructure.' },
      { module: 'leave.service',     reason: 'Domain service import in outbox infrastructure.' },
      { module: 'employee.service',  reason: 'Domain service import in outbox infrastructure.' },
    ],
    rationale:
      'Outbox infrastructure knows only about envelopes and event names. ' +
      'Importing domain services creates circular dependencies (services use outbox, ' +
      'outbox would depend on services).',
    severity:      'medium',
    violationType: ViolationType.FORBIDDEN_MODULE_IMPORT,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Accessors
// ─────────────────────────────────────────────────────────────────────────────

export function getRuleById(id: string): ForbiddenDependencyRule | undefined {
  return FORBIDDEN_DEPENDENCY_MATRIX.find((r) => r.id === id);
}

export function getRulesBySeverity(severity: 'critical' | 'high' | 'medium'): ForbiddenDependencyRule[] {
  return FORBIDDEN_DEPENDENCY_MATRIX.filter((r) => r.severity === severity);
}

export function getAllRuleIds(): string[] {
  return FORBIDDEN_DEPENDENCY_MATRIX.map((r) => r.id);
}

export function getCriticalRules(): ForbiddenDependencyRule[] {
  return getRulesBySeverity('critical');
}
