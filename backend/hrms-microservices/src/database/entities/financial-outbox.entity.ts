import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export enum FinancialOutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity({ name: 'financial_outbox' })
export class FinancialOutboxEntity extends TenantScopedEntity {
  @Column({ name: 'aggregate_id', type: 'uuid' })
  @Index()
  aggregateId!: string; // e.g., PayrollItemID

  @Column({ name: 'command_type', type: 'varchar', length: 100 })
  commandType!: string;

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128 })
  @Index()
  idempotencyKey!: string;

  @Column({
    type: 'enum',
    enum: FinancialOutboxStatus,
    default: FinancialOutboxStatus.PENDING,
  })
  status!: FinancialOutboxStatus;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount!: number;

  @Column({ name: 'error_log', type: 'text', nullable: true })
  errorLog?: string;

  @Column({ name: 'processed_at', type: 'timestamp with time zone', nullable: true })
  processedAt?: Date;
}
