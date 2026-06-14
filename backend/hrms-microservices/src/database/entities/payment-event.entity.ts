import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * PaymentEventEntity — immutable Stripe webhook event log.
 *
 * Rules:
 *  - Never UPDATE or DELETE rows. Append-only.
 *  - stripe_event_id has UNIQUE constraint → idempotency guard.
 */
@Entity('payment_events')
@Index(['tenantId', 'eventType', 'createdAt'])
@Index(['subscriptionId'])
export class PaymentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64, nullable: true })
  tenantId!: string | null;

  /** Stripe event ID (evt_...) — unique constraint prevents double-processing */
  @Column({ name: 'stripe_event_id', type: 'varchar', length: 128, unique: true })
  stripeEventId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType!: string;

  @Column({ name: 'company_id', type: 'varchar', length: 64, nullable: true })
  companyId!: string | null;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId!: string | null;

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 128, nullable: true })
  stripeCustomerId!: string | null;

  /** Amount in smallest currency unit (paise for INR, cents for USD) */
  @Column({ name: 'amount_cents', type: 'integer', nullable: true })
  amountCents!: number | null;

  @Column({ type: 'varchar', length: 8, default: 'inr' })
  currency!: string;

  @Column({ type: 'varchar', length: 32, default: 'processed' })
  status!: string;

  /** Full raw Stripe event payload — for replay and reconciliation */
  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
