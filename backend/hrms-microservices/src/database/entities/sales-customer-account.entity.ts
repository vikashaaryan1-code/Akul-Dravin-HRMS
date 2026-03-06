import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'sales_customer_accounts' })
export class SalesCustomerAccountEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ name: 'account_name', type: 'varchar', length: 180 })
  accountName!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  industry!: string | null;

  @Column({ type: 'varchar', length: 220, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  address!: string | null;

  @Index()
  @Column({ name: 'owner_employee_id', type: 'uuid', nullable: true })
  ownerEmployeeId!: string | null;

  @Column({ name: 'account_status', type: 'varchar', length: 24, default: 'active' })
  accountStatus!: string;

  @Column({ name: 'annual_recurring_value', type: 'numeric', precision: 14, scale: 2, default: '0' })
  annualRecurringValue!: string;

  @Column({ name: 'account_payload', type: 'jsonb', default: () => "'{}'" })
  accountPayload!: Record<string, unknown>;
}
