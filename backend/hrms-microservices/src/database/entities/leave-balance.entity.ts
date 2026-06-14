import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

/**
 * LEAVE BALANCE ENTITY
 *
 * Tracks per-employee, per-leave-type, per-year leave balance.
 *
 * The balance lifecycle for a calendar year:
 *
 *   opening_balance
 *     + credited           (days_per_year from LeaveType + carry-forward from previous year)
 *     - utilized           (days approved from leave_requests)
 *     = closing_balance    (computed; stored for fast read)
 *
 * carry_forward_days is populated by the annual carry-forward job.
 * encashed_days tracks how many days were encashed (for audit).
 *
 * Unique constraint: one row per (tenant, employee, leave_type, year).
 */
@Entity({ name: 'leave_balances' })
@Index('idx_lb_employee_type_year', ['tenantId', 'employeeId', 'leaveTypeId', 'year'], { unique: true })
export class LeaveBalanceEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Index()
  @Column({ name: 'leave_type_id', type: 'uuid' })
  leaveTypeId!: string;

  /** Calendar or fiscal year this balance covers (e.g. 2025). */
  @Column({ name: 'year', type: 'smallint' })
  year!: number;

  /** Days credited at the start of the year (base entitlement). */
  @Column({ name: 'opening_balance', type: 'numeric', precision: 8, scale: 2, default: '0.00' })
  openingBalance!: string;

  /** Additional days credited mid-year (adjustments, accrual). */
  @Column({ name: 'credited', type: 'numeric', precision: 8, scale: 2, default: '0.00' })
  credited!: string;

  /** Total days deducted via approved leave requests. */
  @Column({ name: 'utilized', type: 'numeric', precision: 8, scale: 2, default: '0.00' })
  utilized!: string;

  /** Days carried forward FROM the previous year (added to opening). */
  @Column({ name: 'carry_forward_days', type: 'numeric', precision: 8, scale: 2, default: '0.00' })
  carryForwardDays!: string;

  /** Days encashed (deducted from balance without leave). */
  @Column({ name: 'encashed_days', type: 'numeric', precision: 8, scale: 2, default: '0.00' })
  encashedDays!: string;

  /**
   * Closing balance = opening + credited + carry_forward - utilized - encashed.
   * Kept denormalised for fast dashboard reads; must be kept in sync by service.
   */
  @Column({ name: 'closing_balance', type: 'numeric', precision: 8, scale: 2, default: '0.00' })
  closingBalance!: string;

  /** Audit: when was this balance last recalculated. */
  @Column({ name: 'last_computed_at', type: 'timestamp with time zone', nullable: true })
  lastComputedAt!: Date | null;
}
