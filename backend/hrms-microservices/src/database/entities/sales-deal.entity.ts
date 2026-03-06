import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'sales_deals' })
export class SalesDealEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Index()
  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId!: string | null;

  @Index()
  @Column({ name: 'customer_account_id', type: 'uuid', nullable: true })
  customerAccountId!: string | null;

  @Column({ name: 'deal_name', type: 'varchar', length: 180 })
  dealName!: string;

  @Column({ name: 'deal_value', type: 'numeric', precision: 14, scale: 2 })
  dealValue!: string;

  @Column({ type: 'varchar', length: 30, default: 'new-lead' })
  stage!: string;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate!: string | null;

  @Index()
  @Column({ name: 'sales_representative_id', type: 'uuid', nullable: true })
  salesRepresentativeId!: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: '0' })
  probability!: string;

  @Column({ type: 'varchar', length: 24, default: 'open' })
  status!: string;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'deal_payload', type: 'jsonb', default: () => "'{}'" })
  dealPayload!: Record<string, unknown>;
}
