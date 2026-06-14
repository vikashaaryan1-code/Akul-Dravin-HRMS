import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'candidate_profiles' })
export class CandidateProfileEntity extends TenantScopedEntity {
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ type: 'varchar', length: 190 })
  email!: string;

  @Column({ type: 'varchar', length: 25 })
  phone!: string;

  @Column({ name: 'total_experience_years', type: 'numeric', precision: 5, scale: 2, default: '0.00' })
  totalExperienceYears!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  skills!: string[];

  @Column({ name: 'current_ctc', type: 'numeric', precision: 12, scale: 2, nullable: true })
  currentCtc!: string | null;

  @Column({ name: 'expected_ctc', type: 'numeric', precision: 12, scale: 2, nullable: true })
  expectedCtc!: string | null;

  @Column({ type: 'varchar', length: 120 })
  location!: string;

  @Column({ name: 'resume_url', type: 'varchar', length: 255, nullable: true })
  resumeUrl!: string | null;

  @Column({ name: 'education', type: 'jsonb', default: [] })
  education!: any[];

  @Column({ name: 'experience_highlights', type: 'jsonb', default: [] })
  experienceHighlights!: string[];

  @Column({ name: 'ai_score', type: 'numeric', precision: 5, scale: 2, default: '0.00' })
  aiScore!: string;

  @Column({ name: 'is_blue_collar', type: 'boolean', default: false })
  isBlueCollar!: boolean;

  @Column({ name: 'verified_skills', type: 'jsonb', default: [] })
  verifiedSkills!: string[];

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  resumeText?: string;
}
