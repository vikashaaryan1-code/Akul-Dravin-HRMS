import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export enum AnomalyType {
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  MISSING_CONFIRMATION = 'MISSING_CONFIRMATION',
  DUPLICATE_EXECUTION = 'DUPLICATE_EXECUTION',
  DELAYED_SETTLEMENT = 'DELAYED_SETTLEMENT',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
}

export enum ForensicResolution {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  ADJUSTED = 'ADJUSTED',
  DISMISSED = 'DISMISSED',
}

@Entity({ name: 'forensic_audits' })
export class ForensicAuditEntity extends TenantScopedEntity {
  @Column({
    type: 'enum',
    enum: AnomalyType,
  })
  anomalyType!: AnomalyType;

  @Column({ name: 'target_id', type: 'varchar', length: 128 })
  @Index()
  targetId!: string; // LedgerTransactionId or ExternalTransactionId

  /**
   * FORENSIC SNAPSHOT
   * Full state capture at the moment of anomaly detection.
   * Includes Ledger Entry details, metadata, and active settings.
   */
  @Column({ name: 'evidence_snapshot', type: 'jsonb' })
  evidenceSnapshot!: any;

  @Column({
    type: 'enum',
    enum: ForensicResolution,
    default: ForensicResolution.OPEN,
  })
  @Index()
  resolution!: ForensicResolution;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes?: string;

  @Column({ name: 'resolved_by', type: 'varchar', length: 128, nullable: true })
  resolvedBy?: string;

  @Column({ name: 'resolved_at', type: 'timestamp with time zone', nullable: true })
  resolvedAt?: Date;
}
