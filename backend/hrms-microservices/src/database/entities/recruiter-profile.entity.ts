import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'recruiter_profiles' })
export class RecruiterProfileEntity extends TenantScopedEntity {
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'recruiter_type', type: 'varchar', length: 60 })
  recruiterType!: string;

  @Column({ name: 'agency_name', type: 'varchar', length: 180, nullable: true })
  agencyName!: string | null;

  @Column({ name: 'commission_rate', type: 'numeric', precision: 5, scale: 2, default: '15.00' })
  commissionRate!: string;

  @Column({ type: 'numeric', precision: 3, scale: 2, default: '0.00' })
  rating!: string;

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status!: string;
}
