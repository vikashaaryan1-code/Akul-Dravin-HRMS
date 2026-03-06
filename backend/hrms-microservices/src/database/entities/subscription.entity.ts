import { Column, Entity } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity extends TenantScopedEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'plan_name', type: 'varchar', length: 120 })
  planName!: string;

  @Column({ name: 'billing_cycle', type: 'varchar', length: 30, default: 'monthly' })
  billingCycle!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  features!: Record<string, unknown>;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status!: string;
}
