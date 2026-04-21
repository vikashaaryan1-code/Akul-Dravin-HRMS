import { Entity, Column, Index } from 'typeorm';
import { TenantScopedEntity } from '../../../database/entities/tenant-scoped.entity';
import { PolicyScope, PolicyRule } from '../types/policy.types';

@Entity({ name: 'policy_definitions' })
@Index(['tenantId', 'scope', 'scopeId'])
export class PolicyDefinitionEntity extends TenantScopedEntity {
  @Column({
    type: 'enum',
    enum: PolicyScope,
    default: PolicyScope.TENANT,
  })
  scope!: PolicyScope;

  @Column({ name: 'scope_id', type: 'uuid', nullable: true })
  scopeId?: string;

  @Column({ type: 'jsonb' })
  rules!: PolicyRule[];

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;
}
