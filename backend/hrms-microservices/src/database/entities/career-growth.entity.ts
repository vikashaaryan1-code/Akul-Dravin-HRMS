import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { EmployeeEntity } from './employee.entity';

export enum CareerEventStatus {
  PROPOSED = 'proposed',
  GATED = 'gated',
  APPROVED = 'approved',
  EXECUTED = 'executed',
  REJECTED = 'rejected',
}

@Entity({ name: 'career_growth_events' })
export class CareerGrowthEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @Column({ type: 'varchar', length: 50 })
  type!: 'promotion' | 'increment';

  @Column({ name: 'old_designation', type: 'varchar', length: 120, nullable: true })
  oldDesignation?: string;

  @Column({ name: 'new_designation', type: 'varchar', length: 120, nullable: true })
  newDesignation?: string;

  @Column({ name: 'old_salary', type: 'numeric', precision: 14, scale: 2, nullable: true })
  oldSalary?: string;

  @Column({ name: 'new_salary', type: 'numeric', precision: 14, scale: 2, nullable: true })
  newSalary?: string;

  @Column({ name: 'trigger_score', type: 'numeric', precision: 5, scale: 2 })
  triggerScore!: number;

  @Column({
    type: 'enum',
    enum: CareerEventStatus,
    default: CareerEventStatus.PROPOSED,
  })
  status!: CareerEventStatus;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate?: string;

  @Column({ name: 'forensic_trace_id', type: 'varchar', length: 100, nullable: true })
  forensicTraceId?: string;
}
