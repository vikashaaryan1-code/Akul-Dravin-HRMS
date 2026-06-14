import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * AuditLogEntity — immutable append-only audit trail.
 *
 * Rules:
 *  - Never UPDATE rows in this table. Insert only.
 *  - Never DELETE rows. Use a retention policy at DB level.
 *  - actorId / actorEmail may be null for system-generated events.
 */
@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  actorId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actorEmail!: string | null;

  /** e.g. 'AUTH_LOGIN', 'PAYROLL_BATCH_ENQUEUED', 'LEAVE_APPROVED' */
  @Column({ type: 'varchar', length: 64 })
  action!: string;

  /** e.g. 'payroll_batch', 'leave_request', 'user' */
  @Column({ type: 'varchar', length: 64, nullable: true })
  resourceType!: string | null;

  /** ID of the affected record */
  @Column({ type: 'varchar', length: 64, nullable: true })
  resourceId!: string | null;

  /** Free-form context: IP, jobId, month, etc. */
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
