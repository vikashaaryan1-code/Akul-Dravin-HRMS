import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('recruiters')
export class Recruiter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  company: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 50, name: 'plan_type', default: 'starter' })
  planType: string;

  @Column({ type: 'int', name: 'job_posts_limit', default: 10 })
  jobPostsLimit: number;

  @Column({ type: 'int', name: 'job_posts_used', default: 0 })
  jobPostsUsed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'commission_rate', default: 15 })
  commissionRate: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
