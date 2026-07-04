import { Column, Entity, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { AttendanceEntity } from './attendance.entity';

@Index(['tenantId', 'status'])
@Index(['tenantId', 'departmentId'])
@Index(['tenantId', 'employeeCode'])
@Entity({ name: 'employees' })
export class EmployeeEntity extends TenantScopedEntity {
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId?: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  managerId?: string;

  @Index({ unique: true })
  @Column({ name: 'employee_code', type: 'varchar', length: 50 })
  employeeCode!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 80 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 80, nullable: true })
  lastName?: string;

  @Column({ name: 'work_email', type: 'varchar', length: 255 })
  workEmail!: string;

  @Column({ name: 'personal_email', type: 'varchar', length: 255, nullable: true })
  personalEmail?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ 
    name: 'employment_type', 
    type: 'varchar', 
    length: 20, 
    default: 'full_time' 
  })
  employmentType!: string;

  @Column({ type: 'varchar', length: 120 })
  designation!: string;

  @Column({ type: 'date', name: 'join_date' })
  joinDate!: string;

  @Column({ type: 'date', name: 'exit_date', nullable: true })
  exitDate?: string;

  @Column({ name: 'monthly_ctc', type: 'numeric', precision: 14, scale: 2, nullable: true })
  monthlyCtc!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ 
    name: 'onboarding_status', 
    type: 'varchar', 
    length: 32, 
    default: 'completed' 
  })
  onboardingStatus!: string;

  @Column({ name: 'last_promotion_date', type: 'date', nullable: true })
  lastPromotionDate?: string;

  @Column({ name: 'shift_id', type: 'uuid', nullable: true })
  shiftId?: string;

  /**
   * Link to the auth UserEntity.
   * Nullable: existing rows have no user account until explicitly assigned.
   * Used by GET /payroll/me/payslips to resolve employeeId from JWT sub.
   */
  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @OneToMany(() => AttendanceEntity, (a) => a.employee)
  attendance!: AttendanceEntity[];

  // ── Forensic Provenance ──
  @Column({ name: 'governance_provenance_hash', type: 'varchar', length: 128, nullable: true })
  governanceProvenanceHash?: string;

  @Column({ name: 'epistemic_confidence', type: 'float', nullable: true })
  epistemicConfidence?: number;

  leaveRequests?: import('./leave-request.entity').LeaveRequestEntity[];

  @Column({ type: 'simple-json', nullable: true })
  leaveBalances?: any;
}
