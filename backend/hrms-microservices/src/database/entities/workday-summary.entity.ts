import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workday_summaries')
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'month'])
export class WorkdaySummaryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'varchar', name: 'employee_name', nullable: true })
  employeeName: string | null;

  /** Month in YYYY-MM format */
  @Column({ length: 7 })
  month: string;

  @Column({ name: 'present_days', type: 'int', default: 0 })
  presentDays: number;

  @Column({ name: 'absent_days', type: 'int', default: 0 })
  absentDays: number;

  @Column({ name: 'paid_leave', type: 'int', default: 0 })
  paidLeave: number;

  @Column({ name: 'unpaid_leave', type: 'int', default: 0 })
  unpaidLeave: number;

  @Column({ name: 'wfh_days', type: 'int', default: 0 })
  wfhDays: number;

  @Column({ name: 'overtime_hours', type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeHours: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
