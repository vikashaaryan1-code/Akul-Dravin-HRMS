import { Column, Entity, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { EmployeeEntity } from './employee.entity';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'tasks' })
export class TaskEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @Column({ type: 'varchar', length: 50, default: 'medium' })
  priority!: string;

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate!: string | null;

  @Index()
  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId!: string | null;

  @Index()
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'assignee_id' })
  assignee!: EmployeeEntity;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt!: Date | null;
}
