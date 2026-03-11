import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('appraisals')
export class Appraisal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column()
  reviewerId: string;

  @Column()
  reviewPeriod: string;

  @Column({ type: 'date' })
  reviewDate: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  overallRating: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  technicalSkills: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  communication: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  teamwork: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  leadership: number;

  @Column({ type: 'text', nullable: true })
  strengths: string;

  @Column({ type: 'text', nullable: true })
  areasOfImprovement: string;

  @Column({ type: 'text', nullable: true })
  goals: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ default: 'draft' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
