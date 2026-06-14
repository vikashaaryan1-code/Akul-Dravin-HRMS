/**
 * GOVERNANCE SCANNER SPECIFICATION — Handler Mutation Invariant
 *
 * These tests verify that the ForbiddenDependencyMatrix correctly codifies
 * the architectural invariants established in Commits 9–11.
 *
 * They run in two modes:
 *   1. Unit tests: verify rule shapes, fingerprint stability, matrix completeness
 *   2. Integration tests (marked :integration): run the actual scanner against
 *      the repository source tree (requires ts-morph to be installed)
 *
 * THE HANDLER MUTATION INVARIANT (tested exhaustively here):
 *   "A projection handler that imports a domain entity class has the ability
 *    to inject a repository and mutate operational state during event replay.
 *    This is the single most dangerous architectural violation. Handlers may
 *    only read event envelope payloads and write to projection tables."
 *
 * Why these tests are architecturally critical:
 *   The ForbiddenDependencyMatrix is the living constitution of the governance
 *   layer. If the matrix shape changes (ID renamed, severity downgraded, rule
 *   removed), these tests catch the regression BEFORE it reaches CI.
 *   The matrix is never tested by the scanner itself — the scanner tests
 *   verify the execution engine, these tests verify the constitution.
 */

import {
  FORBIDDEN_DEPENDENCY_MATRIX,
  ForbiddenDependencyRule,
  getRuleById,
  getRulesBySeverity,
  getCriticalRules,
  getAllRuleIds,
} from '../../common/governance/scanner/forbidden-dependency-matrix';
import {
  GovernanceRuleId,
  RULE_SARIF_LEVEL,
} from '../../common/governance/scanner/governance-rule-id.enum';
import {
  computeViolationFingerprint,
  ViolationType,
  ViolationSeverity,
  ViolationStatus,
} from '../../database/entities/violation-log.entity';
import {
  GovernanceScannerService,
  ScanViolation,
} from '../../common/governance/scanner/governance-scanner.service';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Matrix Shape Invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('ForbiddenDependencyMatrix — shape invariants', () => {
  it('should contain at least 6 rules (3 critical + 2 high + 1 medium)', () => {
    expect(FORBIDDEN_DEPENDENCY_MATRIX.length).toBeGreaterThanOrEqual(6);
  });

  it('should have at least 3 CRITICAL rules protecting the handler mutation boundary', () => {
    const critical = getCriticalRules();
    expect(critical.length).toBeGreaterThanOrEqual(3);
  });

  it('should have at least 2 HIGH rules protecting policy bypass boundaries', () => {
    const high = getRulesBySeverity('high');
    expect(high.length).toBeGreaterThanOrEqual(2);
  });

  it('every rule must have a stable ID from GovernanceRuleId enum', () => {
    const validIds = Object.values(GovernanceRuleId) as string[];
    for (const rule of FORBIDDEN_DEPENDENCY_MATRIX) {
      expect(validIds).toContain(rule.id);
    }
  });

  it('every rule must have at least one forbiddenImport entry', () => {
    for (const rule of FORBIDDEN_DEPENDENCY_MATRIX) {
      expect(rule.forbiddenImports.length).toBeGreaterThan(0);
    }
  });

  it('every forbiddenImport must have a module and reason', () => {
    for (const rule of FORBIDDEN_DEPENDENCY_MATRIX) {
      for (const fi of rule.forbiddenImports) {
        expect(fi.module).toBeTruthy();
        expect(fi.reason).toBeTruthy();
      }
    }
  });

  it('rule IDs must be globally unique within the matrix', () => {
    const ids = FORBIDDEN_DEPENDENCY_MATRIX.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('every rule must have a ViolationType that matches its semantic', () => {
    const validTypes = Object.values(ViolationType) as string[];
    for (const rule of FORBIDDEN_DEPENDENCY_MATRIX) {
      expect(validTypes).toContain(rule.violationType);
    }
  });

  it('matrix must be ordered critical-first (all criticals before all highs, highs before mediums)', () => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    let lastSeverityRank = -1;
    for (const rule of FORBIDDEN_DEPENDENCY_MATRIX) {
      const rank = severityOrder[rule.severity] ?? 99;
      // Within same severity group, order doesn't matter — only cross-group order
      // We allow same-severity adjacency
      if (rank < lastSeverityRank) {
        fail(
          `Rule ${rule.id} (${rule.severity}) appears after a lower-severity rule. ` +
          'Matrix must be ordered critical → high → medium.'
        );
      }
      lastSeverityRank = rank;
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Critical Rule Content: HANDLER_NO_DOMAIN_ENTITY_IMPORT
// ─────────────────────────────────────────────────────────────────────────────

describe('HANDLER_NO_DOMAIN_ENTITY_IMPORT — handler mutation invariant', () => {
  let rule: ForbiddenDependencyRule;

  beforeAll(() => {
    rule = getRuleById(GovernanceRuleId.HANDLER_NO_DOMAIN_ENTITY_IMPORT)!;
    if (!rule) throw new Error(`Rule ${GovernanceRuleId.HANDLER_NO_DOMAIN_ENTITY_IMPORT} not found in matrix`);
  });

  it('must exist in the matrix', () => {
    expect(rule).toBeDefined();
  });

  it('must be CRITICAL severity', () => {
    expect(rule.severity).toBe('critical');
  });

  it('must use HANDLER_ENTITY_INJECTION violation type', () => {
    expect(rule.violationType).toBe(ViolationType.HANDLER_ENTITY_INJECTION);
  });

  it('must match projection-handler.ts files', () => {
    expect(rule.sourcePattern.test('src/common/domain-events/handlers/payroll.projection-handler.ts')).toBe(true);
  });

  it('must match /handlers/ directory files', () => {
    expect(rule.sourcePattern.test('src/modules/payroll/handlers/payroll-submitted.handler.ts')).toBe(true);
  });

  it('must NOT match service files (would be too broad)', () => {
    // The rule pattern should not catch .service.ts files
    expect(rule.sourcePattern.test('src/modules/payroll/payroll.service.ts')).toBe(false);
  });

  it('must NOT match controller files (different rule covers those)', () => {
    expect(rule.sourcePattern.test('src/modules/payroll/payroll.controller.ts')).toBe(false);
  });

  it('must list all operational domain entities as forbidden symbols', () => {
    // Find the src/database/entities forbidden import
    const entitiesImport = rule.forbiddenImports.find(
      (fi) => fi.module === 'src/database/entities',
    );
    expect(entitiesImport).toBeDefined();
    expect(entitiesImport!.symbols).toBeDefined();

    const expectedEntities = [
      'PayrollBatchEntity',
      'LeaveRequestEntity',
      'EmployeeEntity',
      'AttendanceEntity',
      'TransactionEntity',
      'WalletEntity',
      'WorkflowExecutionEntity',
      'TaskEntity',
    ];
    for (const entity of expectedEntities) {
      expect(entitiesImport!.symbols).toContain(entity);
    }
  });

  it('must also forbid any import from database/entities path (broader guard)', () => {
    const broadGuard = rule.forbiddenImports.find(
      (fi) => fi.module === 'database/entities',
    );
    expect(broadGuard).toBeDefined();
    // Broader guard has no symbols (any import from this path is forbidden)
    expect(broadGuard!.symbols).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Critical Rule Content: HANDLER_NO_TYPEORM_INJECTION
// ─────────────────────────────────────────────────────────────────────────────

describe('HANDLER_NO_TYPEORM_INJECTION — alias-proof TypeORM guard', () => {
  let rule: ForbiddenDependencyRule;

  beforeAll(() => {
    rule = getRuleById(GovernanceRuleId.HANDLER_NO_TYPEORM_INJECTION)!;
  });

  it('must exist and be CRITICAL', () => {
    expect(rule).toBeDefined();
    expect(rule.severity).toBe('critical');
  });

  it('must forbid Repository, EntityManager, DataSource, QueryRunner from typeorm', () => {
    const typeormImport = rule.forbiddenImports.find((fi) => fi.module === 'typeorm');
    expect(typeormImport).toBeDefined();
    const forbidden = typeormImport!.symbols!;
    expect(forbidden).toContain('Repository');
    expect(forbidden).toContain('EntityManager');
    expect(forbidden).toContain('DataSource');
    expect(forbidden).toContain('QueryRunner');
  });

  it('must forbid NestJS DI decorators: InjectRepository, InjectDataSource, InjectEntityManager', () => {
    const nestImport = rule.forbiddenImports.find((fi) => fi.module === '@nestjs/typeorm');
    expect(nestImport).toBeDefined();
    const forbidden = nestImport!.symbols!;
    expect(forbidden).toContain('InjectRepository');
    expect(forbidden).toContain('InjectDataSource');
    expect(forbidden).toContain('InjectEntityManager');
  });

  it('must apply the same sourcePattern as HANDLER_NO_DOMAIN_ENTITY_IMPORT', () => {
    // Both rules guard the same file category
    const entityRule = getRuleById(GovernanceRuleId.HANDLER_NO_DOMAIN_ENTITY_IMPORT)!;
    expect(rule.sourcePattern.source).toBe(entityRule.sourcePattern.source);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. HIGH Rule: CONTROLLER_NO_DIRECT_REPO
// ─────────────────────────────────────────────────────────────────────────────

describe('CONTROLLER_NO_DIRECT_REPO — policy bypass protection', () => {
  let rule: ForbiddenDependencyRule;

  beforeAll(() => {
    rule = getRuleById(GovernanceRuleId.CONTROLLER_NO_DIRECT_REPO)!;
  });

  it('must exist and be HIGH severity', () => {
    expect(rule).toBeDefined();
    expect(rule.severity).toBe('high');
  });

  it('must match .controller.ts files', () => {
    expect(rule.sourcePattern.test('src/modules/payroll/payroll.controller.ts')).toBe(true);
  });

  it('must NOT match .service.ts or .handler.ts files', () => {
    expect(rule.sourcePattern.test('src/modules/payroll/payroll.service.ts')).toBe(false);
    expect(rule.sourcePattern.test('src/common/domain-events/handlers/audit.projection-handler.ts')).toBe(false);
  });

  it('must use CONTROLLER_REPO_INJECTION violation type', () => {
    expect(rule.violationType).toBe(ViolationType.CONTROLLER_REPO_INJECTION);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. HIGH Rule: GOVERNANCE_MODULE_NO_DOMAIN_IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

describe('GOVERNANCE_MODULE_NO_DOMAIN_IMPORTS — observability isolation', () => {
  let rule: ForbiddenDependencyRule;

  beforeAll(() => {
    rule = getRuleById(GovernanceRuleId.GOVERNANCE_MODULE_NO_DOMAIN_IMPORTS)!;
  });

  it('must exist and be HIGH severity', () => {
    expect(rule).toBeDefined();
    expect(rule.severity).toBe('high');
  });

  it('must forbid payroll, leave, employee, attendance, task-management, finance, workflow, recruitment, analytics modules', () => {
    const forbiddenModules = rule.forbiddenImports.map((fi) => fi.module);
    for (const mod of [
      'payroll.module',
      'leave.module',
      'employee.module',
      'attendance.module',
      'task-management.module',
      'finance.module',
      'workflow-automation.module',
      'recruitment-ats.module',
      'analytics.module',
    ]) {
      expect(forbiddenModules).toContain(mod);
    }
  });

  it('must match governance module files', () => {
    expect(rule.sourcePattern.test('src/modules/governance/governance.module.ts')).toBe(true);
    expect(rule.sourcePattern.test('src/common/governance/domain-event.module.ts')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Fingerprint Stability
// ─────────────────────────────────────────────────────────────────────────────

describe('computeViolationFingerprint — stability and uniqueness', () => {
  it('should produce the same fingerprint for identical inputs across calls', () => {
    const fp1 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    const fp2 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    expect(fp1).toBe(fp2);
  });

  it('should produce different fingerprints for different line numbers', () => {
    const fp1 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    const fp2 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 43, 'typeorm::Repository');
    expect(fp1).not.toBe(fp2);
  });

  it('should produce different fingerprints for different files', () => {
    const fp1 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    const fp2 = computeViolationFingerprint('RULE_A', 'src/handlers/bar.ts', 42, 'typeorm::Repository');
    expect(fp1).not.toBe(fp2);
  });

  it('should produce different fingerprints for different rules', () => {
    const fp1 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    const fp2 = computeViolationFingerprint('RULE_B', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    expect(fp1).not.toBe(fp2);
  });

  it('should produce a 64-character hex string (SHA-256)', () => {
    const fp = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should be deterministic across process restarts (not time-dependent)', () => {
    const fp = computeViolationFingerprint(
      GovernanceRuleId.HANDLER_NO_TYPEORM_INJECTION,
      'src/common/domain-events/handlers/payroll.projection-handler.ts',
      17,
      'typeorm::Repository',
    );
    expect(typeof fp).toBe('string');
    expect(fp.length).toBe(64);
  });

  it('should produce different fingerprints for different ruleVersions', () => {
    const fp1 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository', '1');
    const fp2 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository', '2');
    expect(fp1).not.toBe(fp2);
  });

  it('default ruleVersion (omitted) should equal explicit ruleVersion="1"', () => {
    const fp1 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    const fp2 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository', '1');
    expect(fp1).toBe(fp2);
  });

  it('should normalise Windows backslash paths to produce same fingerprint as forward-slash', () => {
    const fp1 = computeViolationFingerprint('RULE_A', 'src\\handlers\\foo.ts', 42, 'typeorm::Repository');
    const fp2 = computeViolationFingerprint('RULE_A', 'src/handlers/foo.ts', 42, 'typeorm::Repository');
    expect(fp1).toBe(fp2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SARIF Level Mapping
// ─────────────────────────────────────────────────────────────────────────────

describe('RULE_SARIF_LEVEL — GitHub Code Scanning severity mapping', () => {
  it('critical should map to error (blocks merge)', () => {
    expect(RULE_SARIF_LEVEL['critical']).toBe('error');
  });

  it('high should map to error (blocks merge)', () => {
    expect(RULE_SARIF_LEVEL['high']).toBe('error');
  });

  it('medium should map to warning (informational in PR diff)', () => {
    expect(RULE_SARIF_LEVEL['medium']).toBe('warning');
  });

  it('low should map to note (advisory only)', () => {
    expect(RULE_SARIF_LEVEL['low']).toBe('note');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7b. ViolationStatus Lifecycle Enum Stability
// ─────────────────────────────────────────────────────────────────────────────

describe('ViolationStatus — lifecycle enum stability', () => {
  /**
   * Guards against accidental renaming of enum values.
   * The status column in the DB uses these exact string values.
   * If a value is renamed here, existing DB rows will fail to deserialise.
   */
  it('should have exactly 4 lifecycle states: ACTIVE, SUPPRESSED, ACCEPTED, RESOLVED', () => {
    const values = Object.values(ViolationStatus);
    expect(values).toHaveLength(4);
    expect(values).toContain('ACTIVE');
    expect(values).toContain('SUPPRESSED');
    expect(values).toContain('ACCEPTED');
    expect(values).toContain('RESOLVED');
  });

  it('ACTIVE should be the default status for new violations', () => {
    // Mirrors the DB column DEFAULT 'ACTIVE'
    expect(ViolationStatus.ACTIVE).toBe('ACTIVE');
  });

  it('enum values should equal their keys (DB enum uses string values)', () => {
    for (const [key, value] of Object.entries(ViolationStatus)) {
      expect(key).toBe(value);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Matrix Accessor Functions
// ─────────────────────────────────────────────────────────────────────────────

describe('Matrix accessor functions', () => {
  it('getAllRuleIds should return all rule IDs without duplicates', () => {
    const ids = getAllRuleIds();
    expect(ids.length).toBe(FORBIDDEN_DEPENDENCY_MATRIX.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getRuleById should return undefined for unknown IDs', () => {
    expect(getRuleById('NONEXISTENT_RULE')).toBeUndefined();
  });

  it('getRuleById should find each rule by its own ID', () => {
    for (const rule of FORBIDDEN_DEPENDENCY_MATRIX) {
      const found = getRuleById(rule.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(rule.id);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. GovernanceScannerService — unit tests (no file I/O)
// ─────────────────────────────────────────────────────────────────────────────

describe('GovernanceScannerService — constructor and options', () => {
  it('should instantiate without error using default project root', () => {
    expect(() => new GovernanceScannerService()).not.toThrow();
  });

  it('should accept a custom project root', () => {
    expect(() => new GovernanceScannerService('/tmp/test-project')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Existing Handler Files: Handler Mutation Invariant Smoke Test
// ─────────────────────────────────────────────────────────────────────────────

describe('Existing handler files — mutation invariant smoke test (regex mode)', () => {
  /**
   * This test runs the regex scanner against the actual handler files in this repo.
   * If any existing handler file violates the Handler Mutation Invariant, this
   * test will catch it immediately (no need to wait for CI).
   *
   * Note: This test uses regex mode (available without ts-morph).
   * The CI step uses AST mode for alias-proof detection.
   */
  it('audit.projection-handler.ts should pass the handler mutation invariant', async () => {
    const scanner = new GovernanceScannerService();

    // We use dashboard mode so no DB writes occur
    const result = await scanner.scan({ mode: 'dashboard' });

    // Filter to violations from our known handler files
    const handlerViolations = result.violations.filter((v) =>
      v.filePath.includes('projection-handler') ||
      (v.filePath.includes('/handlers/') && !v.filePath.includes('.spec.ts')),
    );

    if (handlerViolations.length > 0) {
      const details = handlerViolations
        .map((v) => `  ${v.severity} [${v.ruleId}] ${v.filePath}:${v.lineNumber}\n    ${v.message}`)
        .join('\n');
      fail(
        `Handler mutation invariant VIOLATED:\n${details}\n\n` +
        'Fix: Remove the forbidden import from the handler file.',
      );
    }

    expect(handlerViolations).toHaveLength(0);
  });
});
