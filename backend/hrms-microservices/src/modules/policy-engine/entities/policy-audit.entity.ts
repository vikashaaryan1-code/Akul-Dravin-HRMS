import { Entity, Column, Index } from 'typeorm';
import { TenantScopedEntity } from '../../../database/entities/tenant-scoped.entity';
import { ExecutionMode } from '../types/policy.types';

@Entity({ name: 'policy_audit_logs' })
export class PolicyAuditEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'policy_id', type: 'uuid' })
  policyId!: string;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId?: string;

  @Column({ name: 'target_field', type: 'varchar', length: 100 })
  targetField!: string;

  @Column({ name: 'recommendation_id', type: 'uuid', nullable: true })
  recommendationId?: string;

  @Column({ type: 'jsonb' })
  policy_snapshot!: any;

  @Column({ type: 'jsonb' })
  evaluation_result!: any;

  @Column({
    type: 'enum',
    enum: ExecutionMode,
  })
  final_mode!: ExecutionMode;

  @Column({ name: 'trace_id', type: 'varchar', length: 100, nullable: true })
  traceId?: string;

  @Column({ name: 'decision_metadata', type: 'jsonb', nullable: true })
  decisionMetadata?: any;
}
