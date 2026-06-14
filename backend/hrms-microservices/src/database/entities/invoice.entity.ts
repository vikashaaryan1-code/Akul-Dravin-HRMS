import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'invoices' })
export class InvoiceEntity extends TenantScopedEntity {
  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId!: string | null;

  @Index({ unique: true })
  @Column({ name: 'invoice_number', type: 'varchar', length: 60 })
  invoiceNumber!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'date', name: 'due_date' })
  dueDate!: string;

  @Column({ type: 'varchar', length: 40, default: 'pending' })
  status!: string;
}
