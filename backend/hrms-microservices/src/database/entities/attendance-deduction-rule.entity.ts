import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('attendance_deduction_rules')
export class AttendanceDeductionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  ruleName: string;

  @Column({ type: 'enum', enum: ['half_day', 'full_day', 'late_arrival', 'early_departure'] })
  deductionType: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  deductionPercentage: number;

  @Column({ type: 'int', nullable: true })
  graceMinutes: number;

  @Column({ type: 'int', nullable: true })
  minHoursForFullDay: number;

  @Column({ type: 'int', nullable: true })
  minHoursForHalfDay: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
