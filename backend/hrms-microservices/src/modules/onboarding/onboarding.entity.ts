import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('onboardings')
export class Onboarding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ default: 'in_progress' })
  status: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ nullable: true })
  buddy: string;

  @Column({ type: 'simple-array', nullable: true })
  completedTasks: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
