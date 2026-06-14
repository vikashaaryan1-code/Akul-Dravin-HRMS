import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { EmployeeLifecycleTransitionedEvent } from '../../common/domain-events/employee-lifecycle-transitioned.event';

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle Stage Enum
// ─────────────────────────────────────────────────────────────────────────────

export enum EmployeeLifecycleStage {
  ONBOARDING   = 'ONBOARDING',
  PROBATION    = 'PROBATION',
  CONFIRMED    = 'CONFIRMED',
  PROMOTED     = 'PROMOTED',
  TRANSFERRED  = 'TRANSFERRED',
  NOTICE_PERIOD = 'NOTICE_PERIOD',
  RESIGNED     = 'RESIGNED',
  TERMINATED   = 'TERMINATED',
  ABSCONDED    = 'ABSCONDED',
  SUSPENDED    = 'SUSPENDED',
}

// ─────────────────────────────────────────────────────────────────────────────
// Allowed Transitions — State Machine Definition (PRD §5.1.1)
// ─────────────────────────────────────────────────────────────────────────────
//
//   ONBOARDING   → PROBATION
//   PROBATION    → CONFIRMED | TERMINATED | ABSCONDED
//   CONFIRMED    → PROMOTED | TRANSFERRED | NOTICE_PERIOD | TERMINATED | SUSPENDED | ABSCONDED
//   PROMOTED     → PROMOTED | TRANSFERRED | NOTICE_PERIOD | TERMINATED | SUSPENDED | ABSCONDED
//   TRANSFERRED  → PROMOTED | TRANSFERRED | NOTICE_PERIOD | TERMINATED | SUSPENDED | ABSCONDED
//   SUSPENDED    → CONFIRMED | PROMOTED | TERMINATED | NOTICE_PERIOD
//   NOTICE_PERIOD → RESIGNED | ABSCONDED
//   RESIGNED     → (terminal)
//   TERMINATED   → (terminal)
//   ABSCONDED    → TERMINATED
//

const ALLOWED_TRANSITIONS: Record<EmployeeLifecycleStage, EmployeeLifecycleStage[]> = {
  [EmployeeLifecycleStage.ONBOARDING]:    [EmployeeLifecycleStage.PROBATION],
  [EmployeeLifecycleStage.PROBATION]:     [EmployeeLifecycleStage.CONFIRMED, EmployeeLifecycleStage.TERMINATED, EmployeeLifecycleStage.ABSCONDED],
  [EmployeeLifecycleStage.CONFIRMED]:     [EmployeeLifecycleStage.PROMOTED, EmployeeLifecycleStage.TRANSFERRED, EmployeeLifecycleStage.NOTICE_PERIOD, EmployeeLifecycleStage.TERMINATED, EmployeeLifecycleStage.SUSPENDED, EmployeeLifecycleStage.ABSCONDED],
  [EmployeeLifecycleStage.PROMOTED]:      [EmployeeLifecycleStage.PROMOTED, EmployeeLifecycleStage.TRANSFERRED, EmployeeLifecycleStage.NOTICE_PERIOD, EmployeeLifecycleStage.TERMINATED, EmployeeLifecycleStage.SUSPENDED, EmployeeLifecycleStage.ABSCONDED],
  [EmployeeLifecycleStage.TRANSFERRED]:   [EmployeeLifecycleStage.PROMOTED, EmployeeLifecycleStage.TRANSFERRED, EmployeeLifecycleStage.NOTICE_PERIOD, EmployeeLifecycleStage.TERMINATED, EmployeeLifecycleStage.SUSPENDED, EmployeeLifecycleStage.ABSCONDED],
  [EmployeeLifecycleStage.SUSPENDED]:     [EmployeeLifecycleStage.CONFIRMED, EmployeeLifecycleStage.PROMOTED, EmployeeLifecycleStage.TERMINATED, EmployeeLifecycleStage.NOTICE_PERIOD],
  [EmployeeLifecycleStage.NOTICE_PERIOD]: [EmployeeLifecycleStage.RESIGNED, EmployeeLifecycleStage.ABSCONDED],
  [EmployeeLifecycleStage.RESIGNED]:      [],
  [EmployeeLifecycleStage.TERMINATED]:    [],
  [EmployeeLifecycleStage.ABSCONDED]:     [EmployeeLifecycleStage.TERMINATED],
};

// ─────────────────────────────────────────────────────────────────────────────
// Active stages (employee still occupying headcount)
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVE_STAGES = new Set([
  EmployeeLifecycleStage.ONBOARDING,
  EmployeeLifecycleStage.PROBATION,
  EmployeeLifecycleStage.CONFIRMED,
  EmployeeLifecycleStage.PROMOTED,
  EmployeeLifecycleStage.TRANSFERRED,
  EmployeeLifecycleStage.SUSPENDED,
  EmployeeLifecycleStage.NOTICE_PERIOD,
]);

// ─────────────────────────────────────────────────────────────────────────────
// DTO parameter types
// ─────────────────────────────────────────────────────────────────────────────

export interface OnboardEmployeeParams {
  /** Expected join date — triggers PROBATION when reached. */
  expectedJoinDate: string;  // ISO date
  /** Probation duration in days (default: 90). */
  probationDays?: number;
  /** HR manager executing the onboarding. */
  actorId?: string;
}

export interface StartProbationParams {
  /** Actual date of joining (may differ from offer letter join date). */
  actualJoinDate: string;
  /** Probation end date. If omitted, derived from probationDays on entity. */
  probationEndDate?: string;
  /** Probation period days — used only if probationEndDate is not provided. */
  probationDays?: number;
  actorId?: string;
}

export interface ConfirmEmployeeParams {
  /** Date of confirmation (letter effective date). */
  confirmationDate: string;
  /** Revised monthly CTC after confirmation (optional — carry forward existing if omitted). */
  revisedMonthlyCtc?: number;
  /** Performance rating at end of probation (for audit). */
  performanceRating?: string;
  note?: string;
  actorId?: string;
}

export interface PromoteEmployeeParams {
  /** New designation after promotion. */
  newDesignation: string;
  /** Effective date of promotion. */
  effectiveDate: string;
  /** Revised monthly CTC. */
  revisedMonthlyCtc?: number;
  /** New department (if cross-department promotion). */
  newDepartmentId?: string;
  /** New reporting manager. */
  newManagerId?: string;
  note?: string;
  actorId?: string;
}

export interface TransferEmployeeParams {
  /** New branch. */
  newBranchId?: string;
  /** New department. */
  newDepartmentId?: string;
  /** New reporting manager. */
  newManagerId?: string;
  /** Effective date of transfer. */
  effectiveDate: string;
  reason?: string;
  actorId?: string;
}

export interface InitiateResignationParams {
  /** Date the resignation letter was submitted. */
  resignationDate: string;
  /** Last working day (notice period end). */
  lastWorkingDay: string;
  /** Notice period in days (derived from LWD − resignationDate if not provided). */
  noticePeriodDays?: number;
  reason?: string;
  actorId?: string;
}

export interface TerminateEmployeeParams {
  /** Effective date of termination. */
  effectiveDate: string;
  /** Reason for termination. */
  reason: string;
  /** Type: MISCONDUCT | PERFORMANCE | REDUNDANCY | CONTRACT_END | OTHER */
  terminationType?: string;
  note?: string;
  actorId?: string;
}

export interface SuspendEmployeeParams {
  suspensionDate: string;
  reason: string;
  expectedReturnDate?: string;
  actorId?: string;
}

export interface ReinstateSuspendedParams {
  reinstateDate: string;
  note?: string;
  actorId?: string;
}

export interface ProcessExitParams {
  actualLastDay: string;
  fullFinalAmount?: number;
  note?: string;
  actorId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EMPLOYEE LIFECYCLE SERVICE
 *
 * Implements the state machine from PRD §5.1.1:
 *   Onboarding → Probation → Confirmation → Promotion → Transfer → Exit
 *
 * Each transition:
 *   1. Validates the current lifecycle_stage against ALLOWED_TRANSITIONS
 *   2. Updates the EmployeeEntity with stage-specific fields
 *   3. Writes a lifecycle event to lifecycle_metadata (JSONB audit log)
 *   4. Returns the updated entity (callers may fire domain events or docs)
 *
 * Domain events (offer letter trigger, confirmation letter, etc.) are NOT
 * directly emitted here — callers compose with DocumentEngineService.
 * This service is purely the state machine guard + persistence layer.
 */
@Injectable()
export class EmployeeLifecycleService {
  private readonly logger = new Logger(EmployeeLifecycleService.name);

  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repo: Repository<EmployeeEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── 1. ONBOARDING ─────────────────────────────────────────────────────────

  /**
   * Mark a newly created employee record as ONBOARDING.
   * Called immediately after the offer letter is accepted and the employee
   * record is created — before the join date is reached.
   */
  async initiateOnboarding(
    employeeId: string,
    params: OnboardEmployeeParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);

    // Allow idempotent call: if already ONBOARDING, update metadata only
    if (current !== EmployeeLifecycleStage.ONBOARDING && current !== EmployeeLifecycleStage.PROBATION) {
      this.assertTransition(current, EmployeeLifecycleStage.ONBOARDING);
    }

    this.applyStage(employee, EmployeeLifecycleStage.ONBOARDING, {
      expectedJoinDate: params.expectedJoinDate,
      probationDays:    params.probationDays ?? 90,
      actor:            params.actorId,
      event:            'ONBOARDING_INITIATED',
    });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → ONBOARDING`);
    return this.repo.save(employee);
  }

  // ── 2. PROBATION ──────────────────────────────────────────────────────────

  /**
   * Mark as PROBATION when the employee physically joins.
   * Calculates and stores the probation end date.
   */
  async startProbation(
    employeeId: string,
    params: StartProbationParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.PROBATION);

    // Calculate probation end date
    const joinDate         = new Date(params.actualJoinDate);
    const probationDays    = params.probationDays ?? 90;
    const probationEndDate = params.probationEndDate
      ?? new Date(joinDate.getTime() + probationDays * 86_400_000)
           .toISOString()
           .slice(0, 10);

    // Update entity fields available in current schema
    employee.joinDate    = params.actualJoinDate;
    employee.status      = 'active';

    this.applyStage(employee, EmployeeLifecycleStage.PROBATION, {
      actualJoinDate:  params.actualJoinDate,
      probationEndDate,
      probationDays,
      actor:           params.actorId,
      event:           'PROBATION_STARTED',
    });

    // Store probation end date in metadata (until migration column exists)
    this.mergeMetadata(employee, { probationEndDate });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → PROBATION (ends: ${probationEndDate})`);
    return this.repo.save(employee);
  }

  // ── 3. CONFIRMATION ───────────────────────────────────────────────────────

  /**
   * Confirm employee after successful probation.
   * PRD trigger: generates Confirmation Letter via DocumentEngine.
   */
  async confirm(
    employeeId: string,
    params: ConfirmEmployeeParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.CONFIRMED);

    if (params.revisedMonthlyCtc) {
      employee.monthlyCtc = params.revisedMonthlyCtc.toString();
    }

    this.applyStage(employee, EmployeeLifecycleStage.CONFIRMED, {
      confirmationDate:   params.confirmationDate,
      revisedMonthlyCtc:  params.revisedMonthlyCtc,
      performanceRating:  params.performanceRating,
      note:               params.note,
      actor:              params.actorId,
      event:              'EMPLOYEE_CONFIRMED',
    });

    this.mergeMetadata(employee, { confirmationDate: params.confirmationDate });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → CONFIRMED (date: ${params.confirmationDate})`);
    return this.repo.save(employee);
  }

  // ── 4. PROMOTION ──────────────────────────────────────────────────────────

  /**
   * Promote employee to a new designation/level.
   * PRD trigger: generates Promotion Letter with revised CTC.
   */
  async promote(
    employeeId: string,
    params: PromoteEmployeeParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.PROMOTED);

    const previousDesignation = employee.designation;
    const previousCtc         = employee.monthlyCtc;

    employee.designation = params.newDesignation;
    if (params.revisedMonthlyCtc) {
      employee.monthlyCtc = params.revisedMonthlyCtc.toString();
    }
    if (params.newDepartmentId) employee.departmentId = params.newDepartmentId;
    if (params.newManagerId)    employee.managerId    = params.newManagerId;

    this.applyStage(employee, EmployeeLifecycleStage.PROMOTED, {
      previousDesignation,
      previousCtc,
      newDesignation:    params.newDesignation,
      revisedMonthlyCtc: params.revisedMonthlyCtc,
      effectiveDate:     params.effectiveDate,
      note:              params.note,
      actor:             params.actorId,
      event:             'EMPLOYEE_PROMOTED',
    });

    this.mergeMetadata(employee, {
      lastPromotionDate:       params.effectiveDate,
      lastPromotedDesignation: params.newDesignation,
      prePromotionDesignation: previousDesignation,
      prePromotionCtc:         previousCtc,
    });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → PROMOTED (${previousDesignation} → ${params.newDesignation})`);
    return this.repo.save(employee);
  }

  // ── 5. TRANSFER ───────────────────────────────────────────────────────────

  /**
   * Transfer employee to a new branch/department/manager.
   * PRD trigger: generates Transfer Letter.
   */
  async transfer(
    employeeId: string,
    params: TransferEmployeeParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.TRANSFERRED);

    const preBranchId     = employee.branchId;
    const preDepartmentId = employee.departmentId;
    const preManagerId    = employee.managerId;

    if (params.newBranchId)      employee.branchId      = params.newBranchId;
    if (params.newDepartmentId)  employee.departmentId  = params.newDepartmentId;
    if (params.newManagerId)     employee.managerId     = params.newManagerId;

    this.applyStage(employee, EmployeeLifecycleStage.TRANSFERRED, {
      preBranchId,
      preDepartmentId,
      preManagerId,
      newBranchId:      params.newBranchId,
      newDepartmentId:  params.newDepartmentId,
      newManagerId:     params.newManagerId,
      effectiveDate:    params.effectiveDate,
      reason:           params.reason,
      actor:            params.actorId,
      event:            'EMPLOYEE_TRANSFERRED',
    });

    this.mergeMetadata(employee, {
      lastTransferDate:        params.effectiveDate,
      preTransferBranchId:     preBranchId,
      preTransferDepartmentId: preDepartmentId,
      preTransferManagerId:    preManagerId,
    });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → TRANSFERRED (effective: ${params.effectiveDate})`);
    return this.repo.save(employee);
  }

  // ── 6. RESIGNATION / NOTICE PERIOD ───────────────────────────────────────

  /**
   * Record an employee resignation and begin notice period.
   * PRD trigger: starts payroll notice-period deduction logic.
   */
  async initiateResignation(
    employeeId: string,
    params: InitiateResignationParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.NOTICE_PERIOD);

    const noticePeriodDays = params.noticePeriodDays
      ?? this.daysBetween(params.resignationDate, params.lastWorkingDay);

    this.applyStage(employee, EmployeeLifecycleStage.NOTICE_PERIOD, {
      resignationDate:  params.resignationDate,
      lastWorkingDay:   params.lastWorkingDay,
      noticePeriodDays,
      reason:           params.reason,
      actor:            params.actorId,
      event:            'RESIGNATION_INITIATED',
    });

    this.mergeMetadata(employee, {
      noticeStartDate:  params.resignationDate,
      noticePeriodDays,
      lastWorkingDay:   params.lastWorkingDay,
      exitReason:       params.reason,
      exitType:         'RESIGNATION',
    });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → NOTICE_PERIOD (LWD: ${params.lastWorkingDay})`);
    return this.repo.save(employee);
  }

  // ── 7. PROCESS EXIT (RESIGNED) ────────────────────────────────────────────

  /**
   * Formally complete the exit after last working day.
   * PRD trigger: generates Experience Letter + Relieving Letter.
   */
  async processExit(
    employeeId: string,
    params: ProcessExitParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.RESIGNED);

    employee.exitDate = params.actualLastDay;
    employee.status   = 'inactive';

    this.applyStage(employee, EmployeeLifecycleStage.RESIGNED, {
      actualLastDay:    params.actualLastDay,
      fullFinalAmount:  params.fullFinalAmount,
      note:             params.note,
      actor:            params.actorId,
      event:            'EXIT_PROCESSED',
    });

    this.mergeMetadata(employee, {
      exitDate:        params.actualLastDay,
      fullFinalAmount: params.fullFinalAmount,
      exitType:        'RESIGNATION',
    });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → RESIGNED (last day: ${params.actualLastDay})`);
    return this.repo.save(employee);
  }

  // ── 8. TERMINATION ────────────────────────────────────────────────────────

  /**
   * Terminate employee (company-initiated exit).
   * PRD trigger: generates Termination Letter.
   */
  async terminate(
    employeeId: string,
    params: TerminateEmployeeParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.TERMINATED);

    employee.exitDate = params.effectiveDate;
    employee.status   = 'inactive';

    this.applyStage(employee, EmployeeLifecycleStage.TERMINATED, {
      effectiveDate:    params.effectiveDate,
      reason:           params.reason,
      terminationType:  params.terminationType ?? 'OTHER',
      note:             params.note,
      actor:            params.actorId,
      event:            'EMPLOYEE_TERMINATED',
    });

    this.mergeMetadata(employee, {
      exitDate:        params.effectiveDate,
      exitReason:      params.reason,
      exitType:        params.terminationType ?? 'TERMINATION',
    });

    this.logger.log(`[Lifecycle] Employee ${employeeId} → TERMINATED (${params.terminationType ?? 'OTHER'})`);
    return this.repo.save(employee);
  }

  // ── 9. SUSPENSION ─────────────────────────────────────────────────────────

  async suspend(
    employeeId: string,
    params: SuspendEmployeeParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.SUSPENDED);

    employee.status = 'suspended';

    this.applyStage(employee, EmployeeLifecycleStage.SUSPENDED, {
      suspensionDate:      params.suspensionDate,
      reason:              params.reason,
      expectedReturnDate:  params.expectedReturnDate,
      actor:               params.actorId,
      event:               'EMPLOYEE_SUSPENDED',
    });

    return this.repo.save(employee);
  }

  async reinstate(
    employeeId: string,
    params: ReinstateSuspendedParams,
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    if (current !== EmployeeLifecycleStage.SUSPENDED) {
      throw new BadRequestException(`Employee is not SUSPENDED; current stage is ${current}`);
    }

    employee.status = 'active';

    // Restore to CONFIRMED after suspension
    this.applyStage(employee, EmployeeLifecycleStage.CONFIRMED, {
      reinstateDate: params.reinstateDate,
      note:          params.note,
      actor:         params.actorId,
      event:         'EMPLOYEE_REINSTATED',
    });

    return this.repo.save(employee);
  }

  // ── 10. ABSCONDED ─────────────────────────────────────────────────────────

  async markAbsconded(
    employeeId: string,
    params: { reportedDate: string; actorId?: string },
  ): Promise<EmployeeEntity> {
    const employee = await this.findOrThrow(employeeId);
    const current  = this.getStage(employee);
    this.assertTransition(current, EmployeeLifecycleStage.ABSCONDED);

    this.applyStage(employee, EmployeeLifecycleStage.ABSCONDED, {
      reportedDate: params.reportedDate,
      actor:        params.actorId,
      event:        'EMPLOYEE_ABSCONDED',
    });

    return this.repo.save(employee);
  }

  // ── Read Helpers ──────────────────────────────────────────────────────────

  /** Current lifecycle stage for this employee. */
  getCurrentStage(employee: EmployeeEntity): EmployeeLifecycleStage {
    return this.getStage(employee);
  }

  /** Full lifecycle audit history from lifecycle_metadata JSONB. */
  getLifecycleHistory(employee: EmployeeEntity): unknown[] {
    const meta = (employee as unknown as Record<string, unknown>)['lifecycleMetadata'];
    if (!meta || typeof meta !== 'object') return [];
    const m = meta as Record<string, unknown>;
    return Array.isArray(m['history']) ? m['history'] as unknown[] : [];
  }

  /** Returns true if the employee is in an active (headcount-occupying) stage. */
  isActive(employee: EmployeeEntity): boolean {
    return ACTIVE_STAGES.has(this.getStage(employee));
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async findOrThrow(id: string): Promise<EmployeeEntity> {
    const emp = await this.repo.findOne({ where: { id } });
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return emp;
  }

  private getStage(employee: EmployeeEntity): EmployeeLifecycleStage {
    const raw = (employee as unknown as Record<string, unknown>)['lifecycleStage'];
    if (raw && Object.values(EmployeeLifecycleStage).includes(raw as EmployeeLifecycleStage)) {
      return raw as EmployeeLifecycleStage;
    }
    // Fallback: derive from status for pre-migration rows
    return employee.status === 'inactive'
      ? EmployeeLifecycleStage.RESIGNED
      : EmployeeLifecycleStage.CONFIRMED;
  }

  private assertTransition(from: EmployeeLifecycleStage, to: EmployeeLifecycleStage): void {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid lifecycle transition: ${from} → ${to}. ` +
        `Allowed from ${from}: [${allowed.join(', ')}]`,
      );
    }
  }

  private applyStage(
    employee: EmployeeEntity,
    stage: EmployeeLifecycleStage,
    eventData: Record<string, unknown>,
  ): void {
    const emp          = employee as unknown as Record<string, unknown>;
    const previousStage = (emp['lifecycleStage'] as string) ?? 'UNKNOWN';

    // Set the lifecycle_stage column (added by migration)
    emp['lifecycleStage'] = stage;

    // Append event to JSONB history array
    const currentMeta = (emp['lifecycleMetadata'] as Record<string, unknown>) ?? {};
    const history = Array.isArray(currentMeta['history'])
      ? currentMeta['history'] as unknown[]
      : [];

    history.push({
      ...eventData,
      toStage:   stage,
      timestamp: new Date().toISOString(),
    });

    emp['lifecycleMetadata'] = { ...currentMeta, history, currentStage: stage };

    // Emit domain event asynchronously — subscribers handle docs, payroll, notifications
    const domainEvent = EmployeeLifecycleTransitionedEvent.create({
      employeeId:    employee.id,
      tenantId:      employee.tenantId ?? '',
      previousState: previousStage,
      nextState:     stage,
      actorId:       eventData['actor'] as string | undefined,
      reason:        eventData['note'] as string | undefined,
      metadata:      eventData,
    });

    // Fire-and-forget: emit after current tick so DB save completes first
    setImmediate(() => {
      this.eventEmitter.emit('employee.lifecycle.transitioned', domainEvent);
    });
  }

  private mergeMetadata(
    employee: EmployeeEntity,
    patch: Record<string, unknown>,
  ): void {
    const emp         = employee as unknown as Record<string, unknown>;
    const currentMeta = (emp['lifecycleMetadata'] as Record<string, unknown>) ?? {};
    emp['lifecycleMetadata'] = { ...currentMeta, ...patch };
  }

  private daysBetween(from: string, to: string): number {
    const diff = new Date(to).getTime() - new Date(from).getTime();
    return Math.round(diff / 86_400_000);
  }
}
