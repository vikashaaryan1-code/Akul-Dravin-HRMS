import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('payslips')
export class Payslip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'varchar', length: 7 })
  month: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'basic_salary' })
  basicSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  hra: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonus: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'gross_salary' })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pf: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  esi: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tds: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'other_deductions', default: 0 })
  otherDeductions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_deductions' })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_salary' })
  netSalary: number;

  @Column({ type: 'int', name: 'working_days' })
  workingDays: number;

  @Column({ type: 'int', name: 'present_days' })
  presentDays: number;

  @Column({ type: 'int', name: 'leave_days', default: 0 })
  leaveDays: number;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @Column({ type: 'timestamp', name: 'generated_at', nullable: true })
  generatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
