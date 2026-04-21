import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { LedgerTransactionEntity } from './ledger-transaction.entity';
import { LedgerAccountEntity } from './ledger-account.entity';

@Entity({ name: 'ledger_entries' })
export class LedgerEntryEntity extends TenantScopedEntity {
  @Column({ name: 'transaction_id', type: 'uuid' })
  @Index()
  transactionId!: string;

  @ManyToOne(() => LedgerTransactionEntity)
  @JoinColumn({ name: 'transaction_id' })
  transaction!: LedgerTransactionEntity;

  /**
   * BALANCED PAIR
   * Each entry row reflects a balanced double-entry leg.
   */
  @Column({ name: 'debit_account_id', type: 'uuid' })
  debitAccountId!: string;

  @ManyToOne(() => LedgerAccountEntity)
  @JoinColumn({ name: 'debit_account_id' })
  debitAccount!: LedgerAccountEntity;

  @Column({ name: 'credit_account_id', type: 'uuid' })
  creditAccountId!: string;

  @ManyToOne(() => LedgerAccountEntity)
  @JoinColumn({ name: 'credit_account_id' })
  creditAccount!: LedgerAccountEntity;

  /**
   * FIXED-POINT AMOUNT
   */
  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount!: string;

  /**
   * LINKED FORENSIC HASH (SHA-256)
   * hash(entryData + previousEntryHash)
   */
  @Column({ name: 'entry_hash', type: 'varchar', length: 64 })
  entryHash!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;
}
