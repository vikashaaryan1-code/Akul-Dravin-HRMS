import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { ProjectEntity } from './project.entity';

@Entity({ name: 'timesheet_entries' })
export class TimesheetEntryEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  hours!: number;

  @Column({ type: 'varchar', length: 40, default: 'Draft' })
  status!: string;
}
