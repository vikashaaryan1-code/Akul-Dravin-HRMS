import { Column, Index } from 'typeorm';
import { BaseEntityWithTimestamps } from './base.entity';

/**
 * TENANT SCOPED ENTITY — GOVERNANCE BOUNDARY BASE
 *
 * All entities that store tenant-specific data MUST extend this class.
 * This is a compile-time and runtime contract.
 *
 * Governance properties:
 *  - IS_TENANT_SCOPED: static marker for runtime introspection by governance
 *    scanners, migration analyzers, and repository enforcement checks.
 *  - tenantId: non-nullable — a null tenantId is a data integrity violation,
 *    not an acceptable state. Queries without a tenantId filter are illegal.
 *
 * Enforcement surfaces:
 *  - TenantQueryPolicy: enforces WHERE tenant_id at query boundary.
 *  - QueryIntrospector: validates predicate participation in emitted SQL.
 *  - Fitness function: CI asserts all tenant-scoped modules use this base.
 */
export abstract class TenantScopedEntity extends BaseEntityWithTimestamps {
  /**
   * Runtime introspection marker.
   * Allows governance tooling to detect tenant participation:
   *   if (entity.IS_TENANT_SCOPED) → enforce tenant scope assertions.
   */
  static readonly IS_TENANT_SCOPED = true as const;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid', nullable: false })
  tenantId!: string;
}

