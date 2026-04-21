import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'financial_transactions' })
export class TransactionEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'wallet_id', type: 'uuid' })
  walletId!: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: 'CREDIT' | 'DEBIT';

  @Column({ type: 'varchar', length: 50, default: 'GENERAL' })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;
}
