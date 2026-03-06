import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'recruitment_jobs' })
export class RecruitmentJobEntity extends TenantScopedEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Index({ unique: true })
  @Column({ name: 'requisition_code', type: 'varchar', length: 80 })
  requisitionCode!: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 120 })
  location!: string;

  @Column({ name: 'employment_type', type: 'varchar', length: 60 })
  employmentType!: string;

  @Column({ name: 'salary_min', type: 'numeric', precision: 12, scale: 2, nullable: true })
  salaryMin!: string | null;

  @Column({ name: 'salary_max', type: 'numeric', precision: 12, scale: 2, nullable: true })
  salaryMax!: string | null;

  @Column({ name: 'posted_by', type: 'uuid' })
  postedBy!: string;

  @Column({ type: 'varchar', length: 40, default: 'open' })
  status!: string;
}
