import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('performance_rewards')
export class PerformanceReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column({ type: 'enum', enum: ['tour', 'bonus', 'gift', 'certificate', 'promotion', 'leave', 'other'] })
  rewardType: string;

  @Column()
  rewardTitle: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  monetaryValue: number;

  @Column({ type: 'int' })
  performanceScore: number;

  @Column({ type: 'int' })
  tasksCompleted: number;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'redeemed'], default: 'pending' })
  status: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'date', nullable: true })
  redeemedDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
