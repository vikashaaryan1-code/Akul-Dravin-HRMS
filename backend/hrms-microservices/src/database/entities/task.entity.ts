import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { EmployeeEntity } from './employee.entity';
import { ProjectEntity } from './project.entity';

export type TaskStatus = 'pending' | 'in_progress' | 'in_review' | 'completed' | 'cancelled' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * TaskEntity — a work item assigned to an employee within a project.
 *
 * Lifecycle: pending → in_progress → in_review → completed
 * Can branch to: blocked (awaiting dependency) | cancelled (dropped)
 *
 * Tenant isolation: all queries must scope by tenantId via TenantScopedEntity.
 */
@Entity({ name: 'tasks' })
export class TaskEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /**
   * Task lifecycle status. Typed as TaskStatus to prevent invalid values at the TypeScript layer.
   * DB stores as varchar for index flexibility.
   */
  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pending' satisfies TaskStatus })
  status!: TaskStatus;

  @Column({ type: 'varchar', length: 10, default: 'medium' satisfies TaskPriority })
  priority!: TaskPriority;

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate!: string | null;

  /** Estimated effort in hours. Used for sprint planning and workload analytics. */
  @Column({ type: 'decimal', precision: 5, scale: 1, name: 'estimated_hours', nullable: true })
  estimatedHours!: number | null;

  /** Actual time spent, recorded by the assignee on completion. */
  @Column({ type: 'decimal', precision: 5, scale: 1, name: 'actual_hours', nullable: true })
  actualHours!: number | null;

  @Index()
  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @Index()
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee!: EmployeeEntity;

  @ManyToOne(() => ProjectEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'completed_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp with time zone', nullable: true })
  completedAt!: Date | null;

  // ── Forensic Provenance ──
  @Column({ name: 'governance_provenance_hash', type: 'varchar', length: 128, nullable: true })
  governanceProvenanceHash?: string;

  @Column({ name: 'epistemic_confidence', type: 'float', nullable: true })
  epistemicConfidence?: number;
}
