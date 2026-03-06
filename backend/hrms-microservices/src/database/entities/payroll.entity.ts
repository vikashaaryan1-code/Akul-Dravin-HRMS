import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'payroll_records' })
export class PayrollEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'payroll_month', type: 'varchar', length: 7 })
  payrollMonth!: string;

  @Column({ name: 'gross_pay', type: 'numeric', precision: 12, scale: 2 })
  grossPay!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  deductions!: string;

  @Column({ name: 'net_pay', type: 'numeric', precision: 12, scale: 2 })
  netPay!: string;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status!: string;

  @Column({ name: 'generated_at', type: 'timestamp with time zone', nullable: true })
  generatedAt!: Date | null;
}
