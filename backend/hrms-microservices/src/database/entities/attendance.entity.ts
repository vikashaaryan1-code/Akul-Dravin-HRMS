import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { EmployeeEntity } from './employee.entity';

@Entity({ name: 'attendance_records' })
export class AttendanceEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate!: string;

  @Column({ name: 'check_in_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp with time zone', nullable: true })
  checkInAt!: Date | null;

  @Column({ name: 'check_out_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp with time zone', nullable: true })
  checkOutAt!: Date | null;

  @Column({ type: 'varchar', length: 40, default: 'present' })
  status!: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Column({ name: 'geo_location', type: 'varchar', length: 255, nullable: true })
  geoLocation!: string | null;

  @ManyToOne(() => EmployeeEntity, (e) => e.attendance)
  @JoinColumn({ name: 'employee_id' })
  employee!: EmployeeEntity;

  // ── Forensic Provenance ──
  @Column({ name: 'governance_provenance_hash', type: 'varchar', length: 128, nullable: true })
  governanceProvenanceHash?: string;

  @Column({ name: 'epistemic_confidence', type: 'float', nullable: true })
  epistemicConfidence?: number;
}
