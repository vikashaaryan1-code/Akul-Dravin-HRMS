import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('video_interviews')
export class VideoInterview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  interviewId: string;

  @Column()
  candidateId: string;

  @Column()
  candidateName: string;

  @Column()
  interviewerName: string;

  @Column()
  position: string;

  @Column()
  scheduledAt: Date;

  @Column({ nullable: true })
  roomId: string;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ type: 'enum', enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' })
  status: string;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'jsonb', nullable: true })
  aiAnalysis: any;

  @Column({ type: 'jsonb', nullable: true })
  scorecard: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'int', nullable: true })
  overallScore: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
