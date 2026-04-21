import { Column, Entity, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { EmployeeEntity } from './employee.entity';

@Entity({ name: 'projects' })
export class ProjectEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'completion_rate', type: 'numeric', precision: 5, scale: 2, default: 0 })
  completionRate!: number;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId!: string | null;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'owner_id' })
  owner!: EmployeeEntity;
}
