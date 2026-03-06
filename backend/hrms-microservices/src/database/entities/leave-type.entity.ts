import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'leave_types' })
export class LeaveTypeEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'leave_code', type: 'varchar', length: 40 })
  leaveCode!: string;

  @Column({ name: 'leave_name', type: 'varchar', length: 140 })
  leaveName!: string;

  @Column({ name: 'days_per_year', type: 'numeric', precision: 6, scale: 2, default: '0.00' })
  daysPerYear!: string;

  @Column({ name: 'carry_forward_limit', type: 'numeric', precision: 6, scale: 2, default: '0.00' })
  carryForwardLimit!: string;

  @Column({ name: 'encashable', type: 'boolean', default: false })
  encashable!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
