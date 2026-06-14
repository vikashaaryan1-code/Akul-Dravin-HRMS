import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { PayrollBatchEntity } from './payroll-batch.entity';
import { LedgerTransactionEntity } from './ledger-transaction.entity';

export enum PayrollItemExecutionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

@Entity({ name: 'payroll_items' })
export class PayrollItemEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => PayrollBatchEntity, (batch) => batch.items)
  @JoinColumn({ name: 'batch_id' })
  batch!: PayrollBatchEntity;

  @Column({ name: 'batch_id', type: 'uuid' })
  batchId!: string;

  /**
   * CALCULATION SNAPSHOT (Intent)
   */
  @Column({ name: 'gross_salary', type: 'numeric', precision: 19, scale: 4 })
  grossSalary!: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  deductions!: string;

  @Column({ name: 'net_payable', type: 'numeric', precision: 19, scale: 4 })
  netPayable!: string;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ name: 'calculation_status', type: 'varchar', length: 30, default: 'draft' })
  calculationStatus!: string;

  @Column({
    name: 'execution_status',
    type: 'enum',
    enum: PayrollItemExecutionStatus,
    default: PayrollItemExecutionStatus.PENDING,
  })
  executionStatus!: PayrollItemExecutionStatus;

  @Column({ name: 'error_log', type: 'text', nullable: true })
  errorLog?: string;

  @Index()
  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, nullable: true })
  idempotencyKey?: string;

  /**
   * FINANCIAL TRUTH ANCHOR
   * Link to the unique transaction in the Truth Layer.
   */
  @ManyToOne(() => LedgerTransactionEntity)
  @JoinColumn({ name: 'linked_transaction_id' })
  linkedTransaction?: LedgerTransactionEntity;

  @Column({ name: 'linked_transaction_id', type: 'uuid', nullable: true })
  linkedTransactionId?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: any;
}
