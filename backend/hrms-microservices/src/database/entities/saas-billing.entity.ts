import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  TRIALING = 'TRIALING',
}

@Entity('saas_plans')
export class SaaSPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g., "PROFESSIONAL HR + PAYROLL"

  @Column('text')
  description: string;

  @Column({ unique: true })
  slug: string; // e.g., "pro-hr-payroll"

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  perEmployeePrice: number;

  @Column('simple-json')
  features: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('tenant_subscriptions')
export class TenantSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => SaaSPlanEntity)
  @JoinColumn({ name: 'planId' })
  plan: SaaSPlanEntity;

  @Column()
  planId: string;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.TRIALING })
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: BillingInterval, default: BillingInterval.MONTHLY })
  interval: BillingInterval;

  @Column('int', { default: 0 })
  seatCount: number;

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ nullable: true })
  externalSubscriptionId: string; // Stripe/Razorpay ID

  @Column({ nullable: true })
  externalCustomerId: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
