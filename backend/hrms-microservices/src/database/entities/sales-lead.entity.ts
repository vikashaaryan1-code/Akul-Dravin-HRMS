import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'sales_leads' })
export class SalesLeadEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ type: 'varchar', length: 80 })
  source!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 80, nullable: true })
  lastName!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 140 })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  organization!: string | null;

  @Index()
  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo!: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: '0' })
  score!: string;

  @Column({ type: 'varchar', length: 30, default: 'new-lead' })
  status!: string;

  @Column({ name: 'pipeline_stage', type: 'varchar', length: 30, default: 'new-lead' })
  pipelineStage!: string;

  @Column({ name: 'nurturing_status', type: 'varchar', length: 30, default: 'active' })
  nurturingStatus!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'lead_payload', type: 'jsonb', default: () => "'{}'" })
  leadPayload!: Record<string, unknown>;
}
