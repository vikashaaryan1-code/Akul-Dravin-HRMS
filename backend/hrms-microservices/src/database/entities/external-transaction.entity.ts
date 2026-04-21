import { Column, Entity, Index, RelationId, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { LedgerTransactionEntity } from './ledger-transaction.entity';

export enum ExternalTransactionSource {
  BANK = 'BANK',
  GATEWAY = 'GATEWAY',
  GOV = 'GOV',
}

export enum ExternalTransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum ReconciliationStatus {
  UNMATCHED = 'UNMATCHED',
  MATCHED = 'MATCHED',
  MISMATCH = 'MISMATCH',
  DUPLICATE = 'DUPLICATE',
}

@Entity({ name: 'external_transactions' })
@Index(['tenantId', 'externalReferenceId'], { unique: true })
export class ExternalTransactionEntity extends TenantScopedEntity {
  /**
   * AUTHENTICITY SHIELD
   * Used to verify that the webhook/callback matches the provider's signature.
   */
  @Column({ name: 'hash_signature', type: 'varchar', length: 256, nullable: true })
  hashSignature?: string;

  /**
   * SYSTEM TIMESTAMP
   * The exact moment the claim was received by OMNIX.
   */
  @Column({ name: 'received_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  receivedAt!: Date;

  @Column({
    name: 'reconciliation_status',
    type: 'enum',
    enum: ReconciliationStatus,
    default: ReconciliationStatus.UNMATCHED,
  })
  reconciliationStatus!: ReconciliationStatus;
  /**
   * FORENSIC REFERENCE
   * UTR Number, Gateway Transaction ID, or Govt Receipt Number.
   */
  @Column({ name: 'external_reference_id', type: 'varchar', length: 128 })
  externalReferenceId!: string;

  @Column({
    type: 'enum',
    enum: ExternalTransactionSource,
  })
  source!: ExternalTransactionSource;

  @Column({
    type: 'enum',
    enum: ExternalTransactionStatus,
    default: ExternalTransactionStatus.PENDING,
  })
  status!: ExternalTransactionStatus;

  /**
   * PARITY ANCHOR
   * Every external event must map back to an internal ledger intent.
   */
  @ManyToOne(() => LedgerTransactionEntity)
  @JoinColumn({ name: 'linked_transaction_id' })
  linkedTransaction?: LedgerTransactionEntity;

  @RelationId((et: ExternalTransactionEntity) => et.linkedTransaction)
  linkedTransactionId?: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  eventDate!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;
}
