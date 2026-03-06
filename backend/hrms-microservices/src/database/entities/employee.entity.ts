import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'employees' })
export class EmployeeEntity extends TenantScopedEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Index({ unique: true })
  @Column({ name: 'employee_code', type: 'varchar', length: 64 })
  employeeCode!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 190 })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  department!: string;

  @Column({ type: 'varchar', length: 120 })
  designation!: string;

  @Column({ name: 'ctc_monthly', type: 'numeric', precision: 12, scale: 2 })
  ctcMonthly!: string;

  @Column({ type: 'date', name: 'join_date' })
  joinDate!: string;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: string;
}
