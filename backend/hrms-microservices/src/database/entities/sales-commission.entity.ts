import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'sales_commissions' })
export class SalesCommissionEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @ManyToOne('EmployeeEntity')
  @JoinColumn({ name: 'employee_id' })
  employee?: any;

  @Index()
  @Column({ name: 'sales_target_id', type: 'uuid', nullable: true })
  salesTargetId!: string | null;

  @Index()
  @Column({ name: 'deal_id', type: 'uuid', nullable: true })
  dealId!: string | null;

  @Column({ name: 'commission_model', type: 'varchar', length: 24, default: 'percentage' })
  commissionModel!: string;

  @Column({ name: 'commission_rate', type: 'numeric', precision: 7, scale: 4, default: '0' })
  commissionRate!: string;

  @Column({ name: 'base_amount', type: 'numeric', precision: 14, scale: 2, default: '0' })
  baseAmount!: string;

  @Column({ name: 'calculated_commission', type: 'numeric', precision: 14, scale: 2, default: '0' })
  calculatedCommission!: string;

  @Column({ name: 'bonus_tier', type: 'varchar', length: 8, nullable: true })
  bonusTier!: string | null;

  @Column({ name: 'payout_status', type: 'varchar', length: 24, default: 'planned' })
  payoutStatus!: string;

  @Column({ name: 'payroll_reference_id', type: 'uuid', nullable: true })
  payrollReferenceId!: string | null;

  @Column({ name: 'payout_due_date', type: 'date', nullable: true })
  payoutDueDate!: string | null;

  @Column({ name: 'commission_payload', type: 'jsonb', default: () => "'{}'" })
  commissionPayload!: Record<string, unknown>;
}
