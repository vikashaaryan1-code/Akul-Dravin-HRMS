import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { CompanyEntity } from './company.entity';
import { DepartmentEntity } from './department.entity';

@Entity({ name: 'designations' })
export class DesignationEntity extends TenantScopedEntity {
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

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToOne(() => DepartmentEntity)
  @JoinColumn({ name: 'department_id' })
  department?: DepartmentEntity;

  @Column({ type: 'varchar', length: 50 })
  level!: string; // C-Suite, VP/Director, Senior Manager, Manager, Lead/Senior, Associate/Executive, Intern/Trainee

  @Column({ name: 'salary_min', type: 'decimal', precision: 15, scale: 2, nullable: true })
  salaryMin?: number;

  @Column({ name: 'salary_max', type: 'decimal', precision: 15, scale: 2, nullable: true })
  salaryMax?: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ name: 'reports_to_designation_id', type: 'uuid', nullable: true })
  reportsToDesignationId?: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
