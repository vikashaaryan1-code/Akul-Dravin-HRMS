import { Column, Entity } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'marketplace_jobs' })
export class MarketplaceJobEntity extends TenantScopedEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 120 })
  location!: string;

  @Column({ name: 'job_type', type: 'varchar', length: 60 })
  jobType!: string;

  @Column({ name: 'salary_range', type: 'varchar', length: 80, nullable: true })
  salaryRange!: string | null;

  @Column({ type: 'varchar', length: 40, default: 'published' })
  status!: string;
}
