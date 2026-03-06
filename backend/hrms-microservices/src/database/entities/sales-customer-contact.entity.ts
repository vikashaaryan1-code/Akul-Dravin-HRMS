import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'sales_customer_contacts' })
export class SalesCustomerContactEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'customer_account_id', type: 'uuid' })
  customerAccountId!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 80, nullable: true })
  lastName!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 140 })
  email!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  designation!: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'last_interaction_at', type: 'timestamp with time zone', nullable: true })
  lastInteractionAt!: Date | null;

  @Column({ name: 'interaction_history', type: 'jsonb', default: () => "'[]'" })
  interactionHistory!: unknown[];

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
