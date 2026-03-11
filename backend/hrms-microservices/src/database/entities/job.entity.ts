import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @Column({ name: 'designation_id', nullable: true })
  designationId: string;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'varchar', length: 50, name: 'employment_type' })
  employmentType: string;

  @Column({ type: 'varchar', length: 50, name: 'experience_level' })
  experienceLevel: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'salary_min', nullable: true })
  salaryMin: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'salary_max', nullable: true })
  salaryMax: number;

  @Column({ type: 'text', nullable: true })
  skills: string;

  @Column({ type: 'int', default: 1 })
  openings: number;

  @Column({ type: 'date', name: 'posted_date' })
  postedDate: Date;

  @Column({ type: 'date', name: 'closing_date', nullable: true })
  closingDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'open' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
