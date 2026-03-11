import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { CompanyEntity } from './company.entity';

@Entity({ name: 'leave_types' })
export class LeaveTypeEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'days_per_year', type: 'int', default: 0 })
  daysPerYear!: number;

  @Column({ name: 'carry_forward', type: 'boolean', default: false })
  carryForward!: boolean;

  @Column({ name: 'max_carry_forward', type: 'int', nullable: true })
  maxCarryForward?: number;

  @Column({ name: 'encashment_allowed', type: 'boolean', default: false })
  encashmentAllowed!: boolean;

  @Column({ name: 'requires_approval', type: 'boolean', default: true })
  requiresApproval!: boolean;

  @Column({ name: 'is_paid', type: 'boolean', default: true })
  isPaid!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

export { LeaveTypeEntity as LeaveType };
