import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { TenantScopeViolationError } from './tenant-scope-violation.error';

/**
 * QUERY INTROSPECTION RESULT
 *
 * Returned by QueryIntrospector.inspect() for every governed query.
 * Rich enough for CI diagnostics, governance reporting, and future AST migration.
 */
export interface IntrospectionResult {
  /** True if tenant_id appears in a predicate position (WHERE or JOIN). */
  governed: boolean;

  /** True if tenant_id appears anywhere in the SQL (token presence, weaker check). */
  tokenFound: boolean;

  /** Where the predicate was found. UNKNOWN means tokenFound=true but not in predicate. */
  predicateType: 'WHERE' | 'JOIN' | 'SUBQUERY' | 'UNKNOWN' | 'NONE';

  /**
   * Risk classification:
   *  - 'none'       → tenant_id found in WHERE/JOIN predicate (governed)
   *  - 'token-only' → tenant_id in SQL but not in predicate (false positive risk)
   *  - 'unscoped'   → tenant_id absent entirely (critical governance gap)
   */
  risk: 'none' | 'token-only' | 'unscoped';

  /** The actual SQL fragments that matched, for diagnostic output in CI. */
  matchedFragments: string[];

  /** The raw SQL that was inspected — included for test fixture snapshots. */
  rawSql: string;
}

/**
 * QUERY INTROSPECTOR
 *
 * Validates that emitted SQL contains tenant_id in a predicate position
 * (WHERE clause or JOIN ON condition), not merely as a selected column.
 *
 * This is the difference between governance and convention:
 *   SELECT tenant_id FROM users   → token-only (false positive)
 *   WHERE tenant_id = $1          → governed (correct)
 *
 * Enforcement model:
 *  - Used in integration tests to assert SQL predicate participation.
 *  - Used by TenantQueryPolicy to produce diagnostic context on failure.
 *  - Long-term migration path: replace regex with full SQL AST parsing.
 *
 * Regex approach is intentionally pragmatic — dramatically safer than token
 * presence, while remaining dependency-free and CI-executable without a
 * database connection.
 */
export class QueryIntrospector {
  /**
   * Patterns that indicate tenant_id participates in a predicate, not
   * merely appears as a selected column or alias.
   *
   * Handles:
   *  - Standard WHERE: WHERE tenant_id = $1 / WHERE "tenant_id" = ?
   *  - AND chaining: AND tenant_id = :tenantId
   *  - JOIN ON: JOIN ... ON ... tenant_id = $1
   *  - Subquery WHERE: (SELECT ... WHERE tenant_id = ...)
   *  - Parameterized variants: $1, ?, :tenantId, :tenant_id
   */
  private static readonly PREDICATE_PATTERNS: {
    type: IntrospectionResult['predicateType'];
    pattern: RegExp;
  }[] = [
    {
      type: 'JOIN',
      pattern:
        /ON\s+(?:(?!\b(?:WHERE|JOIN|GROUP|ORDER|LIMIT|UNION|SELECT)\b).)*?(?:"?tenant_id"?|[a-z0-9_]+\."?tenant_id"?)\s*=\s*(?:\$\d+|\?|:\w+)/i,
    },
    {
      type: 'WHERE',
      pattern:
        /(?:WHERE|AND|OR)\s+(?:"?tenant_id"?|[a-z0-9_]+\."?tenant_id"?)\s*=\s*(?:\$\d+|\?|:\w+)/i,
    },
    {
      type: 'SUBQUERY',
      pattern:
        /\(SELECT\s+.*?WHERE\s+.*?(?:"?tenant_id"?|[a-z0-9_]+\."?tenant_id"?)\s*=\s*(?:\$\d+|\?|:\w+)/is,
    },
  ];

  /** Token presence — weaker check, catches obvious absence but not false positives. */
  private static readonly TOKEN_PATTERN = /tenant_id/i;

  /**
   * Inspect a raw SQL string for tenant_id predicate participation.
   *
   * @param sql The raw SQL string to inspect (from QueryBuilder.getSql() or similar).
   * @returns IntrospectionResult with full diagnostic context.
   */
  static inspect(sql: string): IntrospectionResult {
    const normalizedSql = sql.trim();
    const tokenFound = this.TOKEN_PATTERN.test(normalizedSql);

    if (!tokenFound) {
      return {
        governed: false,
        tokenFound: false,
        predicateType: 'NONE',
        risk: 'unscoped',
        matchedFragments: [],
        rawSql: normalizedSql,
      };
    }

    // Check predicate participation — ordered by specificity
    for (const { type, pattern } of this.PREDICATE_PATTERNS) {
      const match = normalizedSql.match(pattern);
      if (match) {
        return {
          governed: true,
          tokenFound: true,
          predicateType: type,
          risk: 'none',
          matchedFragments: match.filter(Boolean),
          rawSql: normalizedSql,
        };
      }
    }

    // token_found but no predicate match → false positive risk
    return {
      governed: false,
      tokenFound: true,
      predicateType: 'UNKNOWN',
      risk: 'token-only',
      matchedFragments: [],
      rawSql: normalizedSql,
    };
  }

  /**
   * Assert that a SQL string is governed (tenant_id in predicate position).
   * Throws TenantScopeViolationError with diagnostic context on failure.
   *
   * Use in integration tests and TenantQueryPolicy for test-time enforcement.
   */
  static assertGoverned(
    sql: string,
    service: string,
    entity: string,
    operation?: string,
    correlationId?: string,
  ): void {
    const result = this.inspect(sql);
    if (!result.governed) {
      throw new TenantScopeViolationError(
        service,
        entity,
        `${operation ?? 'query'} [risk=${result.risk}]`,
        correlationId,
      );
    }
  }

  /**
   * Inspect a TypeORM SelectQueryBuilder directly.
   * Extracts SQL and inspects it without executing.
   */
  static inspectQueryBuilder<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>): IntrospectionResult {
    return this.inspect(qb.getSql());
  }

  /**
   * Assert governance on a TypeORM SelectQueryBuilder.
   * Throws TenantScopeViolationError if not governed.
   */
  static assertQueryBuilderGoverned<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    service: string,
    entity: string,
    operation?: string,
    correlationId?: string,
  ): void {
    this.assertGoverned(qb.getSql(), service, entity, operation, correlationId);
  }
}
