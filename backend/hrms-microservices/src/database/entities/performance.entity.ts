import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { EmployeeEntity } from './employee.entity';

@Entity({ name: 'performance_reviews' })
export class PerformanceEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  @Column({ name: 'review_period', type: 'varchar', length: 7 }) // e.g., "2026-04"
  reviewPeriod!: string;

  @Column({ name: 'objective_score', type: 'numeric', precision: 5, scale: 2 }) // 70% weight
  objectiveScore!: number;

  @Column({ name: 'subjective_score', type: 'numeric', precision: 5, scale: 2 }) // 30% weight
  subjectiveScore!: number;

  @Column({ name: 'final_score', type: 'numeric', precision: 5, scale: 2 })
  finalScore!: number;

  @Column({ type: 'text', nullable: true })
  managerComments?: string;

  @Column({ type: 'jsonb', nullable: true })
  metricsSnapshot?: any; // Snapshot of attendance, task completion at time of review

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy?: string;
}
