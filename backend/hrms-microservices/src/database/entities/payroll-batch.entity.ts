import { Column, Entity, Index, OneToMany } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { PayrollItemEntity } from './payroll-item.entity';

/**
 * Re-export the canonical PayrollBatchStatus from the governance module.
 * The governance module is the SINGLE SOURCE OF TRUTH for this enum.
 * Existing imports of PayrollBatchStatus from this file continue to work.
 */
import { PayrollBatchStatus } from '../../common/governance/transitions/payroll-batch-status';
export { PayrollBatchStatus };

@Entity({ name: 'payroll_batches' })
export class PayrollBatchEntity extends TenantScopedEntity {
  @Column({ type: 'integer' })
  year!: number;

  @Column({ type: 'integer' })
  month!: number;

  @Column({
    type: 'enum',
    enum: PayrollBatchStatus,
    default: PayrollBatchStatus.DRAFT,
  })
  status!: PayrollBatchStatus;

  @Column({ name: 'total_gross', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  totalGross!: string;

  @Column({ name: 'total_deductions', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  totalDeductions!: string;

  @Column({ name: 'total_net', type: 'numeric', precision: 19, scale: 4, default: '0.0000' })
  totalNet!: string;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @OneToMany(() => PayrollItemEntity, (item) => item.batch)
  items!: PayrollItemEntity[];

  @Column({ name: 'locked_at', type: 'timestamp with time zone', nullable: true })
  lockedAt?: Date;

  @Column({ name: 'period_start', type: 'timestamp with time zone', nullable: true })
  @Index()
  periodStart?: Date;

  @Column({ name: 'period_end', type: 'timestamp with time zone', nullable: true })
  @Index()
  periodEnd?: Date;

  @Column({ name: 'cutoff_at', type: 'timestamp with time zone', nullable: true })
  cutoffAt?: Date;

  @Column({ name: 'timezone', type: 'varchar', length: 50, default: 'UTC' })
  timezone!: string;

  @Column({ name: 'executed_at', type: 'timestamp with time zone', nullable: true })
  executedAt?: Date;

  @Column({ name: 'batch_seal', type: 'varchar', length: 64, nullable: true })
  batchSeal?: string;
}
