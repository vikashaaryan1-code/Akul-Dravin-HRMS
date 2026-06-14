/**
 * TENANT SCOPE GOVERNANCE — INTEGRATION ENFORCEMENT TESTS
 *
 * These tests validate the invariant pipeline introduced in Commit 1:
 *
 *   TenantScopedEntity (type-system boundary)
 *   → TenantQueryPolicy (runtime query governance)
 *   → QueryIntrospector (emitted SQL verification)
 *   → TenantScopeViolationError (enforcement consequence)
 *
 * Test philosophy: invariant coverage, not code coverage.
 *
 * Each test validates ONE invariant across MULTIPLE verification dimensions:
 *   - Error type (what is thrown)
 *   - Error context (why it was thrown)
 *   - SQL predicate participation (what the database would see)
 *   - Provenance tagging (what observability receives)
 *
 * These are integration-style tests — they validate system behavior,
 * not isolated implementation logic.
 *
 * CI gate: any test failure here blocks merge.
 * No exceptions. This is an architectural law, not a suggestion.
 */

import {
  TenantScopeViolationError,
  TenantQueryPolicy,
  QueryIntrospector,
} from '../../common/governance/tenant';
import { TenantScopedEntity } from '../../database/entities/tenant-scoped.entity';

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 1: TenantScopedEntity — Type-System Governance Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('TenantScopedEntity — Governance Contract', () => {
  it('exposes IS_TENANT_SCOPED static marker for runtime introspection', () => {
    expect(TenantScopedEntity.IS_TENANT_SCOPED).toBe(true);
  });

  it('IS_TENANT_SCOPED is a const literal (not a mutable boolean)', () => {
    // Validates the as const declaration — governance scanners can rely on this value
    const marker: true = TenantScopedEntity.IS_TENANT_SCOPED;
    expect(marker).toBe(true);
  });

  it('confirms abstract base cannot be instantiated directly (compile-time contract)', () => {
    // This is a documentation test — it cannot be broken at runtime.
    // The compile-time enforcement is in the TypeScript type system.
    // Future: add ESLint rule that asserts all tenant entity files extend TenantScopedEntity.
    expect(TenantScopedEntity.IS_TENANT_SCOPED).toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 2: TenantScopeViolationError — Structured Error Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('TenantScopeViolationError — Error Contract', () => {
  const makeError = (overrides: Partial<{ operation: string; correlationId: string }> = {}) =>
    new TenantScopeViolationError(
      'PayrollService',
      'PayrollItemEntity',
      overrides.operation ?? 'findByBatch',
      overrides.correlationId,
    );

  it('has correct error code for SIEM routing', () => {
    expect(makeError().code).toBe('TENANT_SCOPE_VIOLATION');
  });

  it('returns HTTP 401 — not 400 — because this is an auth gap, not validation failure', () => {
    expect(makeError().httpStatus).toBe(401);
  });

  it('preserves service and entity context for forensic reconstruction', () => {
    const err = makeError({ correlationId: 'trace-xyz' });
    expect(err.context.service).toBe('PayrollService');
    expect(err.context.entity).toBe('PayrollItemEntity');
    expect(err.context.correlationId).toBe('trace-xyz');
  });

  it('includes timestamp for audit trail', () => {
    const before = Date.now();
    const err = makeError();
    const after = Date.now();
    const ts = new Date(err.context.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('toLogPayload() returns structured object compatible with pino/winston', () => {
    const payload = makeError({ correlationId: 'corr-123' }).toLogPayload();
    expect(payload).toMatchObject({
      errorCode: 'TENANT_SCOPE_VIOLATION',
      httpStatus: 401,
      service: 'PayrollService',
      entity: 'PayrollItemEntity',
      correlationId: 'corr-123',
    });
    expect(typeof payload['message']).toBe('string');
  });

  it('toSpanAttributes() returns OTel-compatible flat key-value record', () => {
    const attrs = makeError().toSpanAttributes();
    expect(attrs['governance.violation']).toBe(true);
    expect(attrs['governance.violation.code']).toBe('TENANT_SCOPE_VIOLATION');
    expect(attrs['governance.service']).toBe('PayrollService');
    expect(attrs['governance.entity']).toBe('PayrollItemEntity');
  });

  it('message includes service, entity, and operation for developer context', () => {
    const err = makeError({ operation: 'findByEmployee' });
    expect(err.message).toContain('PayrollService');
    expect(err.message).toContain('PayrollItemEntity');
    expect(err.message).toContain('findByEmployee');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 3: QueryIntrospector — SQL Predicate Participation Contract
//
// This is the core governance verification: predicate participation,
// not token presence.
// ──────────────────────────────────────────────────────────────────────────────

describe('QueryIntrospector — SQL Predicate Participation', () => {
  // ── Governed SQL patterns ────────────────────────────────────────────────

  const governedSqlCases: Array<{ label: string; sql: string; predicateType: string }> = [
    {
      label: 'standard WHERE clause (PostgreSQL $1)',
      sql: 'SELECT * FROM payroll_items pi WHERE pi.tenant_id = $1 AND pi.batch_id = $2',
      predicateType: 'WHERE',
    },
    {
      label: 'AND-chained WHERE clause',
      sql: 'SELECT * FROM employees e WHERE e.status = $1 AND e.tenant_id = $2',
      predicateType: 'WHERE',
    },
    {
      label: 'WHERE with named parameter (:tenantId)',
      sql: 'SELECT * FROM leave_requests lr WHERE lr.tenant_id = :tenantId',
      predicateType: 'WHERE',
    },
    {
      label: 'WHERE with generic named parameter (:tenant_id)',
      sql: 'SELECT * FROM tasks t WHERE t.tenant_id = :tenant_id',
      predicateType: 'WHERE',
    },
    {
      label: 'JOIN ON condition',
      sql: 'SELECT p.* FROM payroll_batches pb INNER JOIN payroll_items p ON p.batch_id = pb.id AND p.tenant_id = $1',
      predicateType: 'JOIN',
    },
    {
      label: 'TypeORM standard _governedTenantId alias',
      sql: 'SELECT p0.* FROM payroll_items p0 WHERE p0."tenant_id" = :_governedTenantId',
      predicateType: 'WHERE',
    },
  ];

  test.each(governedSqlCases)('✅ GOVERNED: $label', ({ sql, predicateType }) => {
    const result = QueryIntrospector.inspect(sql);
    expect(result.governed).toBe(true);
    expect(result.risk).toBe('none');
    expect(result.predicateType).toBe(predicateType);
    expect(result.matchedFragments.length).toBeGreaterThan(0);
  });

  // ── False positive cases — token present but NOT in predicate ──────────

  const falsePositiveCases: Array<{ label: string; sql: string }> = [
    {
      label: 'SELECT tenant_id as column (not in predicate)',
      sql: 'SELECT tenant_id, employee_id FROM payroll_items ORDER BY created_at',
    },
    {
      label: 'tenant_id in SELECT and ORDER BY but not WHERE',
      sql: 'SELECT p.tenant_id, p.gross_salary FROM payroll_items p ORDER BY p.tenant_id',
    },
    {
      label: 'tenant_id only in GROUP BY',
      sql: 'SELECT tenant_id, SUM(net_payable) FROM payroll_items GROUP BY tenant_id',
    },
    {
      label: 'tenant_id in comment',
      sql: '-- filter by tenant_id\nSELECT * FROM payroll_items',
    },
  ];

  test.each(falsePositiveCases)('⚠️ TOKEN-ONLY (false positive): $label', ({ sql }) => {
    const result = QueryIntrospector.inspect(sql);
    expect(result.governed).toBe(false);
    expect(result.tokenFound).toBe(true);
    expect(result.risk).toBe('token-only');
    expect(result.predicateType).toBe('UNKNOWN');
  });

  // ── Completely unscoped SQL ────────────────────────────────────────────

  const unscopedCases: Array<{ label: string; sql: string }> = [
    {
      label: 'no tenant_id at all (the original bug: repo.find() without scope)',
      sql: 'SELECT * FROM payroll_items ORDER BY created_at DESC',
    },
    {
      label: 'aggregation without tenant scope (cross-tenant ROI calculation)',
      sql: 'SELECT SUM(gross_salary) as total FROM payroll_items WHERE month = $1',
    },
    {
      label: 'empty string',
      sql: '',
    },
  ];

  test.each(unscopedCases)('🔴 UNSCOPED: $label', ({ sql }) => {
    const result = QueryIntrospector.inspect(sql);
    expect(result.governed).toBe(false);
    expect(result.tokenFound).toBe(false);
    expect(result.risk).toBe('unscoped');
    expect(result.predicateType).toBe('NONE');
    expect(result.matchedFragments).toHaveLength(0);
  });

  // ── assertGoverned() throws on ungoverned SQL ──────────────────────────

  it('assertGoverned() throws TenantScopeViolationError on unscoped SQL', () => {
    const unscopedSql = 'SELECT * FROM payroll_items WHERE month = $1';
    expect(() =>
      QueryIntrospector.assertGoverned(unscopedSql, 'PayrollService', 'PayrollItemEntity'),
    ).toThrow(TenantScopeViolationError);
  });

  it('assertGoverned() throws on token-only SQL (false positive protection)', () => {
    const tokenOnlySql = 'SELECT tenant_id, gross_salary FROM payroll_items';
    expect(() =>
      QueryIntrospector.assertGoverned(tokenOnlySql, 'PayrollService', 'PayrollItemEntity'),
    ).toThrow(TenantScopeViolationError);
  });

  it('assertGoverned() does NOT throw on governed SQL', () => {
    const governedSql =
      'SELECT * FROM payroll_items pi WHERE pi.tenant_id = $1 AND pi.batch_id = $2';
    expect(() =>
      QueryIntrospector.assertGoverned(governedSql, 'PayrollService', 'PayrollItemEntity'),
    ).not.toThrow();
  });

  it('IntrospectionResult contains rawSql for test fixture snapshots', () => {
    const sql = 'SELECT * FROM tasks t WHERE t.tenant_id = $1';
    const result = QueryIntrospector.inspect(sql);
    expect(result.rawSql).toBe(sql.trim());
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 4: TenantQueryPolicy — Enforcement Boundary Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('TenantQueryPolicy — Enforcement Contract', () => {
  // ── assertPresent() ───────────────────────────────────────────────────

  describe('assertPresent()', () => {
    it('throws TenantScopeViolationError when tenantId is undefined', () => {
      expect(() =>
        TenantQueryPolicy.assertPresent(undefined, 'PayrollService', 'PayrollItemEntity'),
      ).toThrow(TenantScopeViolationError);
    });

    it('throws when tenantId is null', () => {
      expect(() =>
        TenantQueryPolicy.assertPresent(null, 'PayrollService', 'PayrollItemEntity'),
      ).toThrow(TenantScopeViolationError);
    });

    it('throws when tenantId is empty string', () => {
      expect(() =>
        TenantQueryPolicy.assertPresent('', 'PayrollService', 'PayrollItemEntity'),
      ).toThrow(TenantScopeViolationError);
    });

    it('throws when tenantId is whitespace-only', () => {
      expect(() =>
        TenantQueryPolicy.assertPresent('   ', 'PayrollService', 'PayrollItemEntity'),
      ).toThrow(TenantScopeViolationError);
    });

    it('does NOT throw when tenantId is a valid UUID-like string', () => {
      expect(() =>
        TenantQueryPolicy.assertPresent(
          'tenant-abc-123',
          'PayrollService',
          'PayrollItemEntity',
        ),
      ).not.toThrow();
    });

    it('thrown error carries 401 status — not 400', () => {
      try {
        TenantQueryPolicy.assertPresent(undefined, 'WalletService', 'WalletEntity');
        fail('Expected TenantScopeViolationError');
      } catch (err) {
        expect(err).toBeInstanceOf(TenantScopeViolationError);
        expect((err as TenantScopeViolationError).httpStatus).toBe(401);
      }
    });
  });

  // ── wrapRaw() ─────────────────────────────────────────────────────────

  describe('wrapRaw()', () => {
    it('returns original SQL when tenantId present AND SQL is governed', () => {
      const sql =
        'SELECT * FROM payroll_items pi WHERE pi.tenant_id = $1 AND pi.batch_id = $2';
      const result = TenantQueryPolicy.wrapRaw(
        sql,
        'tenant-abc',
        'PayrollService',
        'PayrollItemEntity',
        'findByBatch',
      );
      expect(result).toBe(sql);
    });

    it('throws TenantScopeViolationError when tenantId is absent', () => {
      const sql = 'SELECT * FROM payroll_items pi WHERE pi.tenant_id = $1';
      expect(() =>
        TenantQueryPolicy.wrapRaw(
          sql,
          undefined,
          'PayrollService',
          'PayrollItemEntity',
          'findByBatch',
        ),
      ).toThrow(TenantScopeViolationError);
    });

    it('throws TenantScopeViolationError when raw SQL is unscoped — even with valid tenantId', () => {
      const unscopedSql = 'SELECT SUM(gross_salary) FROM payroll_items WHERE month = $1';
      expect(() =>
        TenantQueryPolicy.wrapRaw(
          unscopedSql,
          'tenant-abc',
          'AnalyticsService',
          'PayrollItemEntity',
          'roiCalc',
        ),
      ).toThrow(TenantScopeViolationError);
    });

    it('catches cross-tenant ROI aggregation — the critical original bug', () => {
      // This is the exact class of query that caused the tenant isolation failure
      // in roi.service.ts. The fix required INNER JOIN + tenant_id filter.
      const dangerousSql =
        'SELECT SUM(gross_salary) as total_cost FROM payroll_items pi ORDER BY pi.created_at';
      expect(() =>
        TenantQueryPolicy.wrapRaw(
          dangerousSql,
          'tenant-xyz',
          'RoiService',
          'PayrollItemEntity',
          'computeROI',
        ),
      ).toThrow(TenantScopeViolationError);
    });
  });

  // ── buildProvenanceTag() ──────────────────────────────────────────────

  describe('buildProvenanceTag()', () => {
    it('produces a governance-tagged provenance record', () => {
      const tag = TenantQueryPolicy.buildProvenanceTag(
        'tenant-abc',
        'PayrollItemEntity',
        'PayrollService',
        'findByBatch',
        'corr-456',
      );

      expect(tag.tenantId).toBe('tenant-abc');
      expect(tag.entity).toBe('PayrollItemEntity');
      expect(tag.service).toBe('PayrollService');
      expect(tag.operation).toBe('findByBatch');
      expect(tag.correlationId).toBe('corr-456');
      expect(tag.governance).toBe(true);
      expect(typeof tag.timestamp).toBe('string');
    });

    it('governance flag is always true — not configurable', () => {
      const tag = TenantQueryPolicy.buildProvenanceTag(
        'tenant-abc',
        'TaskEntity',
        'TaskService',
        'create',
      );
      // The governance=true flag identifies this query as governed in traces
      expect(tag.governance).toBe(true);
    });

    it('correlationId can be undefined for background jobs', () => {
      const tag = TenantQueryPolicy.buildProvenanceTag(
        'tenant-abc',
        'PayrollBatchEntity',
        'PayrollScheduler',
        'scheduledRun',
        undefined, // background jobs may not have a request correlationId
      );
      expect(tag.correlationId).toBeUndefined();
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 5: Multi-Dimension Invariant Assertions
//
// One invariant, multiple verification dimensions simultaneously.
// This is stronger than isolated unit tests.
// ──────────────────────────────────────────────────────────────────────────────

describe('Multi-Dimension Invariant: Unscoped Query Attempt', () => {
  it('absent tenantId produces correct error type, HTTP status, context, and span attributes', () => {
    let caughtError: TenantScopeViolationError | null = null;

    try {
      TenantQueryPolicy.assertPresent(
        undefined,
        'FinanceService',
        'LedgerTransactionEntity',
        'computeMonthlyLedger',
        'corr-multi-789',
      );
    } catch (err) {
      caughtError = err as TenantScopeViolationError;
    }

    // Dimension 1: Error type
    expect(caughtError).toBeInstanceOf(TenantScopeViolationError);

    // Dimension 2: HTTP status (auth boundary, not validation)
    expect(caughtError!.httpStatus).toBe(401);

    // Dimension 3: Structured error context
    expect(caughtError!.context.service).toBe('FinanceService');
    expect(caughtError!.context.entity).toBe('LedgerTransactionEntity');
    expect(caughtError!.context.operation).toBe('computeMonthlyLedger');
    expect(caughtError!.context.correlationId).toBe('corr-multi-789');

    // Dimension 4: Log payload completeness
    const logPayload = caughtError!.toLogPayload();
    expect(logPayload['errorCode']).toBe('TENANT_SCOPE_VIOLATION');
    expect(logPayload['correlationId']).toBe('corr-multi-789');

    // Dimension 5: Span attributes for OTel
    const spanAttrs = caughtError!.toSpanAttributes();
    expect(spanAttrs['governance.violation']).toBe(true);
    expect(spanAttrs['governance.service']).toBe('FinanceService');
  });
});

describe('Multi-Dimension Invariant: Governed SQL Verification', () => {
  it('governed SQL passes all verification dimensions simultaneously', () => {
    const governedSql =
      'SELECT pi.* FROM payroll_items pi ' +
      'INNER JOIN payroll_batches pb ON pb.id = pi.batch_id AND pi.tenant_id = $1 ' +
      'WHERE pb.status = $2';

    // Dimension 1: Introspector classifies as governed
    const result = QueryIntrospector.inspect(governedSql);
    expect(result.governed).toBe(true);
    expect(result.risk).toBe('none');

    // Dimension 2: Predicate type is correctly identified
    expect(result.predicateType).toBe('JOIN');

    // Dimension 3: assertGoverned does not throw
    expect(() =>
      QueryIntrospector.assertGoverned(governedSql, 'PayrollService', 'PayrollItemEntity'),
    ).not.toThrow();

    // Dimension 4: wrapRaw accepts and returns the SQL
    const wrapped = TenantQueryPolicy.wrapRaw(
      governedSql,
      'tenant-prod-001',
      'PayrollService',
      'PayrollItemEntity',
      'joinBatch',
    );
    expect(wrapped).toBe(governedSql);

    // Dimension 5: matchedFragments contains diagnostic evidence
    expect(result.matchedFragments.length).toBeGreaterThan(0);
  });
});
