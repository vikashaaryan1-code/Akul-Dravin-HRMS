import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Job } from './job.entity';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'candidate_name', type: 'varchar', length: 200 })
  candidateName: string;

  @Column({ type: 'varchar', length: 200 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  resume: string;

  @Column({ type: 'int', name: 'experience_years', default: 0 })
  experienceYears: number;

  @Column({ type: 'text', nullable: true })
  skills: string;

  @Column({ type: 'varchar', length: 100, name: 'current_company', nullable: true })
  currentCompany: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'current_salary', nullable: true })
  currentSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'expected_salary', nullable: true })
  expectedSalary: number;

  @Column({ type: 'varchar', length: 50, default: 'applied' })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
