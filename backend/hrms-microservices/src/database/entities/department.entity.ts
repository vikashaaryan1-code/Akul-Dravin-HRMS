import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { CompanyEntity } from './company.entity';

@Entity({ name: 'departments' })
export class DepartmentEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'head_employee_id', type: 'uuid', nullable: true })
  headEmployeeId?: string;

  @Column({ name: 'team_size', type: 'int', default: 0 })
  teamSize!: number;

  @Column({ name: 'budget_allocated', type: 'decimal', precision: 15, scale: 2, nullable: true })
  budgetAllocated?: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
