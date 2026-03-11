import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('salary_structures')
export class SalaryStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basicSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  conveyance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  medicalAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  specialAllowance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherAllowances: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pfDeduction: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  esiDeduction: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tdsDeduction: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  otherDeductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grossSalary: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netSalary: number;

  @Column({ type: 'date' })
  effectiveFrom: Date;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
