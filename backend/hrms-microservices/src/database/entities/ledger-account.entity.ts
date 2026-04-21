import { Column, Entity, Index, Unique } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export enum LedgerAccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

@Entity({ name: 'ledger_accounts' })
@Unique(['tenantId', 'code'])
export class LedgerAccountEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /**
   * UNIQUE CODE per tenant (e.g., 'CASH-MAIN', 'WLT-USR123')
   */
  @Column({ type: 'varchar', length: 50 })
  @Index()
  code!: string;

  @Column({
    type: 'enum',
    enum: LedgerAccountType,
  })
  type!: LedgerAccountType;

  /**
   * HIGH PRECISION BALANCE (numeric(19,4))
   * Stored as string to prevent floating-point inaccuracies.
   */
  @Column({ type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  balance!: string;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;
}
