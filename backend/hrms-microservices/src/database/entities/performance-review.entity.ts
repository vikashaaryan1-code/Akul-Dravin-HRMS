import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('performance_reviews')
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'reviewer_id' })
  reviewerId: string;

  @Column({ type: 'varchar', length: 50, name: 'review_period' })
  reviewPeriod: string;

  @Column({ type: 'int', name: 'review_year' })
  reviewYear: number;

  @Column({ type: 'int', name: 'overall_rating' })
  overallRating: number;

  @Column({ type: 'int', name: 'technical_skills', nullable: true })
  technicalSkills: number;

  @Column({ type: 'int', nullable: true })
  communication: number;

  @Column({ type: 'int', nullable: true })
  teamwork: number;

  @Column({ type: 'int', nullable: true })
  leadership: number;

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true })
  improvements: string;

  @Column({ type: 'text', nullable: true })
  goals: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
