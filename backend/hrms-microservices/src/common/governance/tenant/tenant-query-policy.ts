import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { TenantScopeViolationError } from './tenant-scope-violation.error';
import { QueryIntrospector } from './query-introspector';

/**
 * QUERY PROVENANCE TAG
 *
 * Attached to every governed query as span attributes and structured log metadata.
 * Enables:
 *  - "show all ungoverned queries in production traces" (future capability)
 *  - Governance coverage metrics (governed query %)
 *  - Anomaly detection on unscoped query attempts
 *  - Forensic audit reconstruction
 */
export interface QueryProvenanceTag {
  readonly tenantId: string;
  readonly entity: string;
  readonly service: string;
  readonly correlationId: string | undefined;
  readonly operation: string;
  readonly governance: true;
  readonly timestamp: string;
}

/**
 * TENANT QUERY POLICY — THE QUERY GOVERNANCE BOUNDARY
 *
 * This is the heart of Commit 1. It enforces tenant isolation at the
 * SQL query boundary — the only place where multi-tenant correctness
 * can be definitively verified.
 *
 * Architecture: Composition over inheritance.
 * Reason: TypeORM class inheritance is fragile. Custom repositories,
 * getRepository() calls, and EntityManager usage all bypass class
 * inheritance silently. A policy object enforced at the query boundary
 * catches ALL of them.
 *
 * Three enforcement surfaces:
 *  1. .enforce()       → applies WHERE tenant_id constraint to QueryBuilder
 *  2. .assertPresent() → throws TenantScopeViolationError on absent tenantId
 *  3. .wrapRaw()       → validates and marks raw SQL as governed
 *
 * Observability:
 *  Every governed query emits a QueryProvenanceTag for span attributes
 *  and structured log metadata, enabling governance coverage visibility.
 *
 * Usage:
 *   const qb = repo.createQueryBuilder('payroll');
 *   TenantQueryPolicy.enforce(qb, tenantId, 'payroll', 'PayrollService', 'findBatch');
 *   return qb.getMany();
 */
export class TenantQueryPolicy {
  /**
   * Enforce tenant scope on a SelectQueryBuilder.
   *
   * Applies:
   *   .andWhere(`alias.tenant_id = :tenantId`, { tenantId })
   *
   * This ensures tenant_id participates in the WHERE predicate regardless
   * of what other conditions exist on the query.
   *
   * @param qb          The TypeORM SelectQueryBuilder to govern.
   * @param tenantId    The resolved tenant ID from TenantContext.
   * @param alias       The query alias for the root entity (e.g. 'payroll').
   * @param service     Calling service name — for provenance tagging.
   * @param operation   Calling operation name — for provenance tagging.
   * @param correlationId  Request correlation ID — for trace linkage.
   * @returns The same QueryBuilder (fluent) with tenant constraint applied.
   * @throws TenantScopeViolationError if tenantId is absent or empty.
   */
  static enforce<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    tenantId: string | undefined | null,
    alias: string,
    service: string,
    operation: string = 'query',
    correlationId?: string,
  ): SelectQueryBuilder<T> {
    this.assertPresent(tenantId, service, alias, operation, correlationId);

    qb.andWhere(`${alias}.tenant_id = :_governedTenantId`, {
      _governedTenantId: tenantId,
    });

    // Emit provenance tag — callers should forward this to their active span/logger
    const tag = this.buildProvenanceTag(tenantId!, alias, service, operation, correlationId);
    this.emitProvenanceTag(tag);

    return qb;
  }

  /**
   * Assert that a tenantId is present and non-empty.
   * Throws TenantScopeViolationError with full structured context.
   *
   * Use before any raw query, find(), findOne(), or custom operation
   * that cannot use the enforce() QueryBuilder path.
   *
   * @throws TenantScopeViolationError
   */
  static assertPresent(
    tenantId: string | undefined | null,
    service: string,
    entity: string,
    operation: string = 'unknown',
    correlationId?: string,
  ): asserts tenantId is string {
    if (!tenantId || tenantId.trim() === '') {
      throw new TenantScopeViolationError(service, entity, operation, correlationId);
    }
  }

  /**
   * Wrap raw SQL to make it governed.
   *
   * Validates that the raw SQL contains tenant_id in a predicate position.
   * If not, throws TenantScopeViolationError.
   *
   * This is the enforcement point for analytics queries, reporting SQL,
   * migration scripts, and any path that bypasses QueryBuilder.
   *
   * IMPORTANT: This validates the SQL string but does NOT inject tenant_id.
   * The caller is responsible for providing SQL that already contains the
   * tenant_id predicate. This enforces correctness, not convenience.
   *
   * @returns The original SQL (unchanged) for use in EntityManager.query()
   * @throws TenantScopeViolationError if SQL is not governed.
   */
  static wrapRaw(
    sql: string,
    tenantId: string | undefined | null,
    service: string,
    entity: string,
    operation: string = 'raw-query',
    correlationId?: string,
  ): string {
    this.assertPresent(tenantId, service, entity, operation, correlationId);

    // Validate that the raw SQL actually contains tenant_id in predicate position
    QueryIntrospector.assertGoverned(sql, service, entity, operation, correlationId);

    const tag = this.buildProvenanceTag(tenantId!, entity, service, operation, correlationId);
    this.emitProvenanceTag(tag);

    return sql;
  }

  /**
   * Build a QueryProvenanceTag for observability propagation.
   * Forward this to OpenTelemetry spans and structured logger.
   */
  static buildProvenanceTag(
    tenantId: string,
    entity: string,
    service: string,
    operation: string,
    correlationId?: string,
  ): QueryProvenanceTag {
    return {
      tenantId,
      entity,
      service,
      correlationId,
      operation,
      governance: true,
      timestamp: new Date().toISOString(),
    } as const;
  }

  /**
   * Emit provenance tag to structured log output.
   *
   * In production this should forward to the active OpenTelemetry span
   * and the pino/winston structured logger. The console.debug() here is
   * a zero-dependency fallback that is replaced by real observability
   * infrastructure when the observability module is wired in.
   *
   * Span attributes emitted:
   *   governance.scope    = "tenant"
   *   governance.entity   = entity name
   *   governance.enforced = true
   *   correlationId       = request correlation id
   */
  private static emitProvenanceTag(tag: QueryProvenanceTag): void {
    // Structured log output — matches pino/winston JSON format
    // In production: replace console.debug with Logger.debug(tag) from NestJS Logger
    if (process.env['NODE_ENV'] !== 'test') {
      console.debug(
        JSON.stringify({
          level: 'governance',
          governance_scope: 'tenant',
          governance_entity: tag.entity,
          governance_service: tag.service,
          governance_enforced: tag.governance,
          governance_operation: tag.operation,
          correlationId: tag.correlationId,
          timestamp: tag.timestamp,
        }),
      );
    }
  }
}
