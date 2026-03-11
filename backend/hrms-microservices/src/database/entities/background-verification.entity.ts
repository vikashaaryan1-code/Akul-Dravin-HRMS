import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('background_verifications')
export class BackgroundVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  candidateId: string;

  @Column()
  candidateName: string;

  @Column()
  candidateEmail: string;

  @Column()
  candidatePhone: string;

  @Column({ type: 'enum', enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  educationVerification: any;

  @Column({ type: 'jsonb', nullable: true })
  employmentVerification: any;

  @Column({ type: 'jsonb', nullable: true })
  criminalRecordCheck: any;

  @Column({ type: 'jsonb', nullable: true })
  addressVerification: any;

  @Column({ type: 'jsonb', nullable: true })
  referenceChecks: any;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
