import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'automation_workflows' })
export class AutomationWorkflowEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Index({ unique: true })
  @Column({ name: 'workflow_code', type: 'varchar', length: 80 })
  workflowCode!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  module!: string;

  @Column({ name: 'trigger_type', type: 'varchar', length: 80 })
  triggerType!: string;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status!: string;

  @Column({ name: 'success_rate', type: 'numeric', precision: 5, scale: 2, default: '0' })
  successRate!: string;

  @Column({ name: 'run_count', type: 'integer', default: 0 })
  runCount!: number;

  @Column({ name: 'workflow_config', type: 'jsonb', default: () => "'{}'" })
  workflowConfig!: Record<string, unknown>;

  @Column({ name: 'last_run_at', type: 'timestamp with time zone', nullable: true })
  lastRunAt!: Date | null;
}
