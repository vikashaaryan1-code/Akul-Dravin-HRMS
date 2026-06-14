import { Column, Entity } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity('loans')
export class LoanEntity extends TenantScopedEntity {
  @Column()
  employeeId!: string;

  @Column({ name: 'employee_code', type: 'varchar', length: 50 })
  employeeCode!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'text' })
  purpose!: string;

  @Column({ type: 'integer' })
  tenure!: number;

  @Column({ default: 'PENDING' })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';

  @Column({ default: 'LOW' })
  riskScore!: 'VERY LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({ name: 'applied_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  appliedAt!: Date;

  // ── Forensic Provenance ──
  @Column({ name: 'governance_provenance_hash', type: 'varchar', length: 128, nullable: true })
  governanceProvenanceHash?: string;

  @Column({ name: 'epistemic_confidence', type: 'float', nullable: true })
  epistemicConfidence?: number;
}
