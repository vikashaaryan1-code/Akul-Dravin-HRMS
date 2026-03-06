import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'marketplace_listings' })
export class MarketplaceListingEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'job_id', type: 'uuid' })
  jobId!: string;

  @Column({ name: 'listing_type', type: 'varchar', length: 30, default: 'job' })
  listingType!: string;

  @Column({ name: 'visibility', type: 'varchar', length: 20, default: 'public' })
  visibility!: string;

  @Column({ name: 'source_service', type: 'varchar', length: 60, default: 'job-marketplace' })
  sourceService!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;
}
