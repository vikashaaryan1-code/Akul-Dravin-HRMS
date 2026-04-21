import { Column, Entity, Index, Unique } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export enum LedgerTransactionStatus {
  CREATED = 'CREATED',
  COMMITTED = 'COMMITTED',
  SETTLEMENT_PENDING = 'SETTLEMENT_PENDING',
  SETTLED = 'SETTLED',
  RECONCILED = 'RECONCILED',
  FAILED = 'FAILED',
  ANOMALY = 'ANOMALY',
  REVERSED = 'REVERSED',
}

export enum ForensicAuditStatus {
  CLEAR = 'CLEAR',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
}

@Entity({ name: 'ledger_transactions' })
@Unique(['tenantId', 'idempotencyKey'])
export class LedgerTransactionEntity extends TenantScopedEntity {
  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  @Index()
  batchId?: string;

  @Column({ name: 'reversal_of_transaction_id', type: 'uuid', nullable: true })
  @Index()
  reversalOfTransactionId?: string;

  /**
   * MANDATORY IDEMPOTENCY
   * Prevents double-execution of the same financial command.
   */
  @Column({ name: 'idempotency_key', type: 'varchar', length: 128 })
  @Index()
  idempotencyKey!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate!: Date;

  @Column({
    type: 'enum',
    enum: LedgerTransactionStatus,
    default: LedgerTransactionStatus.CREATED,
  })
  status!: LedgerTransactionStatus;

  @Column({ name: 'settled_at', type: 'timestamp with time zone', nullable: true })
  settledAt?: Date;

  @Column({ name: 'reconciled_at', type: 'timestamp with time zone', nullable: true })
  reconciledAt?: Date;

  @Column({
    name: 'audit_status',
    type: 'enum',
    enum: ForensicAuditStatus,
    default: ForensicAuditStatus.CLEAR,
  })
  @Index()
  auditStatus!: ForensicAuditStatus;

  @Column({ type: 'varchar', length: 50, default: 'GENERAL' })
  type!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * FORENSIC AGGREGATE SEAL (SHA-256)
   * hash(allEntryHashes + metadata + settingsSnapshot)
   */
  @Column({ name: 'transaction_hash', type: 'varchar', length: 64, nullable: true })
  transactionHash?: string;

  /**
   * DETERMINISTIC POLICY SNAPSHOT
   * Captures the OrganizationSettings active at execution time.
   */
  @Column({ name: 'policy_snapshot', type: 'jsonb' })
  policySnapshot!: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  /**
   * STATE MACHINE GUARD
   */
  canTransitionTo(target: LedgerTransactionStatus): boolean {
    const transitions: Record<LedgerTransactionStatus, LedgerTransactionStatus[]> = {
      [LedgerTransactionStatus.CREATED]: [LedgerTransactionStatus.COMMITTED, LedgerTransactionStatus.FAILED],
      [LedgerTransactionStatus.COMMITTED]: [LedgerTransactionStatus.SETTLEMENT_PENDING, LedgerTransactionStatus.SETTLED, LedgerTransactionStatus.FAILED, LedgerTransactionStatus.ANOMALY],
      [LedgerTransactionStatus.SETTLEMENT_PENDING]: [LedgerTransactionStatus.SETTLED, LedgerTransactionStatus.FAILED, LedgerTransactionStatus.ANOMALY],
      [LedgerTransactionStatus.SETTLED]: [LedgerTransactionStatus.RECONCILED, LedgerTransactionStatus.ANOMALY, LedgerTransactionStatus.FAILED],
      [LedgerTransactionStatus.RECONCILED]: [LedgerTransactionStatus.REVERSED, LedgerTransactionStatus.ANOMALY],
      [LedgerTransactionStatus.FAILED]: [LedgerTransactionStatus.REVERSED], // For forensic adjustments
      [LedgerTransactionStatus.ANOMALY]: [LedgerTransactionStatus.RECONCILED, LedgerTransactionStatus.FAILED], // Requires manual intervention/correction
      [LedgerTransactionStatus.REVERSED]: [],
    };

    return transitions[this.status]?.includes(target) || false;
  }
}
