import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';
export type TenantPlan = 'starter' | 'growth' | 'enterprise' | 'custom';

@Entity('tenants')
@Index(['status'])
@Index(['plan'])
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'owner_email', unique: true })
  ownerEmail: string;

  @Column({ name: 'owner_name', type: 'varchar', nullable: true })
  ownerName: string | null;

  @Column({ default: 'trial' })
  status: TenantStatus;

  @Column({ default: 'starter' })
  plan: TenantPlan;

  @Column({ name: 'seat_limit', type: 'int', default: 10 })
  seatLimit: number;

  @Column({ name: 'seat_used', type: 'int', default: 0 })
  seatUsed: number;

  @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true })
  stripeCustomerId: string | null;

  @Column({ name: 'stripe_subscription_id', type: 'varchar', nullable: true })
  stripeSubscriptionId: string | null;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt: Date | null;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt: Date | null;

  @Column({ name: 'suspended_reason', type: 'text', nullable: true })
  suspendedReason: string | null;

  @Column({ name: 'feature_flags', type: 'jsonb', default: '{}' })
  featureFlags: Record<string, boolean>;

  @Column({ name: 'custom_domain', type: 'varchar', nullable: true })
  customDomain: string | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
