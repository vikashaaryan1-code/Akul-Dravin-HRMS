import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_matches')
export class AiMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  candidateId: string;

  @Column()
  jobId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  matchScore: number;

  @Column({ type: 'jsonb', nullable: true })
  matchDetails: {
    skillMatch?: number;
    experienceMatch?: number;
    educationMatch?: number;
    locationMatch?: number;
    salaryMatch?: number;
    matchedSkills?: string[];
    missingSkills?: string[];
    recommendations?: string[];
  };

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
