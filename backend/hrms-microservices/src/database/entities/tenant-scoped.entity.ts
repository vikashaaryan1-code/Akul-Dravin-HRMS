import { Column } from 'typeorm';
import { BaseEntityWithTimestamps } from './base.entity';

export abstract class TenantScopedEntity extends BaseEntityWithTimestamps {
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;
}
