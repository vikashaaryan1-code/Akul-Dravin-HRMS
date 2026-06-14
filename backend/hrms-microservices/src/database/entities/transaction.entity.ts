import { Column, Entity, Index, CreateDateColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

/**
 * Financial transaction record — immutable ledger entry.
 *
 * Linked to WalletEntity via walletId.
 * Each row represents one atomic financial event:
 *   - Salary credit
 *   - PF/TDS deduction
 *   - Expense reimbursement
 *   - Loan EMI recovery
 *   - Performance bonus
 *
 * Immutability note: never UPDATE a transaction row.
 * Corrections are handled by a reversal DEBIT + new CREDIT pair.
 */
@Entity({ name: 'financial_transactions' })
export class TransactionEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'wallet_id', type: 'uuid' })
  walletId!: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: 'CREDIT' | 'DEBIT';

  /**
   * Category codes — standardized across the platform:
   * SALARY, PERFORMANCE_BONUS, PROJECT_ALLOWANCE, REIMBURSEMENT,
   * TDS_DEDUCTION, PF_DEDUCTION, ESIC_DEDUCTION, LOAN_EMI,
   * EQUIPMENT_PURCHASE, ADVANCE_RECOVERY, GENERAL
   */
  @Column({ type: 'varchar', length: 60, default: 'GENERAL' })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Optional external reference — bank UTR, cheque no., payment gateway ID.
   */
  @Column({ type: 'varchar', length: 120, nullable: true })
  reference?: string;

  /**
   * Processing status:
   *   pending    — queued for bank transfer
   *   processed  — bank transfer confirmed
   *   failed     — transfer failed (retry or manual)
   *   reversed   — reversal completed
   */
  @Column({ type: 'varchar', length: 20, default: 'processed' })
  status!: 'pending' | 'processed' | 'failed' | 'reversed';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  /**
   * Override base createdAt so seed can set historical dates.
   * All other writes use NOW() by default.
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
