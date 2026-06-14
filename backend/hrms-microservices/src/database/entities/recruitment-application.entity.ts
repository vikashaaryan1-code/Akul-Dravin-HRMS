import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'recruitment_applications' })
export class RecruitmentApplicationEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'job_id', type: 'uuid' })
  jobId!: string;

  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId!: string;

  @Column({ type: 'varchar', length: 60, default: 'applied' })
  stage!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score!: string | null;

  @Column({ type: 'varchar', length: 60, default: 'portal' })
  source!: string;

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status!: string;

  @Column({ name: 'assigned_recruiter_id', type: 'uuid', nullable: true })
  assignedRecruiterId!: string | null;

  job?: any;
  candidate?: any;
}
