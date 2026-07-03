import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'sales_targets' })
export class SalesTargetEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId!: string | null;

  @ManyToOne('EmployeeEntity')
  @JoinColumn({ name: 'employee_id' })
  employee?: any;

  @Column({ name: 'target_period', type: 'varchar', length: 24, default: 'monthly' })
  targetPeriod!: string;

  @Column({ name: 'period_key', type: 'varchar', length: 20 })
  periodKey!: string;

  @Column({ name: 'target_value', type: 'numeric', precision: 14, scale: 2 })
  targetValue!: string;

  @Column({ name: 'achieved_value', type: 'numeric', precision: 14, scale: 2, default: '0' })
  achievedValue!: string;

  @Column({ name: 'is_team_target', type: 'boolean', default: false })
  isTeamTarget!: boolean;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status!: string;

  @Column({ name: 'target_payload', type: 'jsonb', default: () => "'{}'" })
  targetPayload!: Record<string, unknown>;
}
