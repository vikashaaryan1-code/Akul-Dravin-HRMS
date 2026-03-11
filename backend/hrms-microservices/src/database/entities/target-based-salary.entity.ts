import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('target_based_salary')
export class TargetBasedSalary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  fixedSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  incentivePercentage: number;

  @Column({ type: 'enum', enum: ['monthly', 'quarterly', 'yearly'] })
  targetPeriod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  achievedAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  earnedIncentive: number;

  @Column({ type: 'date' })
  periodStartDate: Date;

  @Column({ type: 'date' })
  periodEndDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
