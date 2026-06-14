/**
 * GOVERNANCE RULE ID ENUM — Pre-Commit 11 Canonicalization
 *
 * Every rule in the ForbiddenDependencyMatrix must use a value from this enum.
 * String literals are forbidden from appearing directly in rule definitions.
 *
 * WHY THIS MATTERS:
 *
 * 1. FINGERPRINT STABILITY
 *    computeViolationFingerprint() includes ruleId as a key component.
 *    If a rule ID changes (even a typo fix), all historical fingerprints
 *    for that rule become stale. The enum forces conscious ID management.
 *
 * 2. DASHBOARD AGGREGATION
 *    GovernanceHealthService groups violations by rule ID for trend queries.
 *    Unstable IDs produce fragmented time series.
 *
 * 3. SARIF EXPORT (Commit 11)
 *    SARIF ReportingDescriptor.id must be stable across runs for
 *    GitHub code scanning to correlate findings across PRs.
 *
 * 4. ALERT ROUTING
 *    PagerDuty/OpsGenie rules reference IDs. A renamed rule silently
 *    breaks existing alert configurations.
 *
 * VERSIONING POLICY:
 *    Values (string literals) are IMMUTABLE once a rule has generated
 *    ViolationLogEntity rows in production.
 *    Adding new enum members: always allowed.
 *    Renaming existing values: requires a data migration first.
 *    Removing enum members: requires confirming zero DB rows reference the ID.
 */
export enum GovernanceRuleId {
  // ── CRITICAL: Handler mutation boundary ─────────────────────────────────
  /** Handlers must not import operational domain entity classes. */
  HANDLER_NO_DOMAIN_ENTITY_IMPORT    = 'HANDLER_NO_DOMAIN_ENTITY_IMPORT',
  /** Handlers must not inject TypeORM repositories or EntityManagers. */
  HANDLER_NO_TYPEORM_INJECTION       = 'HANDLER_NO_TYPEORM_INJECTION',
  /** Handlers must not inject transactional domain services. */
  HANDLER_NO_TRANSACTIONAL_SERVICES  = 'HANDLER_NO_TRANSACTIONAL_SERVICES',

  // ── HIGH: Policy bypass boundaries ──────────────────────────────────────
  /** Controllers must not inject TypeORM repositories directly. */
  CONTROLLER_NO_DIRECT_REPO          = 'CONTROLLER_NO_DIRECT_REPO',
  /** GovernanceModule must not import domain feature modules. */
  GOVERNANCE_MODULE_NO_DOMAIN_IMPORTS = 'GOVERNANCE_MODULE_NO_DOMAIN_IMPORTS',

  // ── MEDIUM: Coupling violations ──────────────────────────────────────────
  /** Transition engines must not import HTTP/controller-layer constructs. */
  TRANSITION_ENGINE_NO_HTTP          = 'TRANSITION_ENGINE_NO_HTTP',
  /** Outbox infrastructure must not import domain services. */
  OUTBOX_NO_DOMAIN_SERVICES          = 'OUTBOX_NO_DOMAIN_SERVICES',

  // ── Reserved — future rules ──────────────────────────────────────────────
  // Naming convention: {LAYER}_{DIRECTION}_{WHAT}
  // Add new IDs here before creating a rule in the matrix.
  // Do not use string literals anywhere outside this enum.
}

/**
 * SARIF severity level mapping.
 * Maps GovernanceRuleId severity tier to SARIF v2.1.0 ReportingConfiguration.level.
 */
export const RULE_SARIF_LEVEL: Record<string, 'error' | 'warning' | 'note'> = {
  critical: 'error',
  high:     'error',
  medium:   'warning',
  low:      'note',
};
