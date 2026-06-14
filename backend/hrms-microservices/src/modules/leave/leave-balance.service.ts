import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LeaveBalanceEntity } from '../../database/entities/leave-balance.entity';
import { LeaveTypeEntity } from '../../database/entities/leave-type.entity';
import { EmployeeEntity } from '../../database/entities/employee.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────────────────────

export interface LeaveBalanceSummary {
  leaveTypeId:      string;
  leaveCode:        string;
  leaveName:        string;
  year:             number;
  openingBalance:   number;
  credited:         number;
  carryForwardDays: number;
  utilized:         number;
  encashedDays:     number;
  closingBalance:   number;
  encashable:       boolean;
}

export interface CarryForwardResult {
  processedCount:  number;
  skippedCount:    number;
  totalDaysCarried: number;
  details:         Array<{
    employeeId:    string;
    leaveTypeId:   string;
    carriedDays:   number;
    cappedAt:      number;
  }>;
}

export interface EncashmentResult {
  employeeId:      string;
  leaveTypeId:     string;
  encashableDays:  number;
  encashmentRate:  number;  // % of daily salary
  estimatedAmount: number;
  monthlySalary:   number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LEAVE BALANCE SERVICE
 *
 * Implements PRD §5.5 leave balance rules:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Leave Type   │ Days/yr │ Carry Forward │ Encashable       │
 *   │──────────────│─────────│───────────────│──────────────────│
 *   │ Casual       │   12    │ No            │ No               │
 *   │ Sick         │   12    │ Yes (max 30)  │ No               │
 *   │ Earned/PL    │   15    │ Yes (max 45)  │ Yes              │
 *   │ Maternity    │  182    │ N/A           │ No               │
 *   │ Paternity    │   15    │ No            │ No               │
 *   │ Compensatory │ earned  │ No (30 days)  │ No               │
 *   │ Loss of Pay  │ unlim.  │ N/A           │ N/A              │
 *   │ Bereavement  │    5    │ No            │ No               │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Key operations:
 *   initializeBalances   — seed leave_balances rows at year start / employee join
 *   deductLeave          — reduce closing_balance on approval
 *   creditLeave          — add credited days (accruals, manual adjustments)
 *   processCarryForward  — year-end batch job: carry eligible days to next year
 *   calculateEncashment  — compute encashable amount for an employee + leave type
 *   processEncashment    — record an encashment transaction
 *   getBalanceSummary    — dashboard view per employee
 */
@Injectable()
export class LeaveBalanceService {
  private readonly logger = new Logger(LeaveBalanceService.name);

  constructor(
    @InjectRepository(LeaveBalanceEntity)
    private readonly balanceRepo: Repository<LeaveBalanceEntity>,
    @InjectRepository(LeaveTypeEntity)
    private readonly leaveTypeRepo: Repository<LeaveTypeEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ── 1. Initialize Balances ────────────────────────────────────────────────

  /**
   * Seed leave_balances rows for an employee for a given year.
   * Called at year start (batch) or when a new employee joins mid-year
   * (with pro-rated openingBalance based on join month).
   *
   * @param employeeId  UUID of the employee
   * @param year        4-digit year (default: current year)
   * @param tenantId    UUID of the tenant
   * @param proRate     If true, pro-rate days based on join date
   */
  async initializeBalances(
    employeeId: string,
    tenantId: string,
    year?: number,
    proRate = false,
  ): Promise<LeaveBalanceEntity[]> {
    const targetYear = year ?? new Date().getFullYear();

    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, tenantId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const leaveTypes = await this.leaveTypeRepo.find({
      where: { tenantId, isActive: true },
    });

    const results: LeaveBalanceEntity[] = [];

    for (const lt of leaveTypes) {
      // Skip if already initialized
      const existing = await this.balanceRepo.findOne({
        where: { tenantId, employeeId, leaveTypeId: lt.id, year: targetYear },
      });
      if (existing) {
        this.logger.debug(
          `Balance already exists for emp=${employeeId} type=${lt.leaveCode} year=${targetYear}`,
        );
        results.push(existing);
        continue;
      }

      // Pro-rate logic: if employee joins mid-year, credit only remaining months
      let daysEntitled = parseFloat(lt.daysPerYear as string) || 0;
      if (proRate && employee.joinDate) {
        const joinDate  = new Date(employee.joinDate);
        const joinYear  = joinDate.getFullYear();
        if (joinYear === targetYear) {
          const joinMonth    = joinDate.getMonth();      // 0-indexed
          const monthsLeft   = 12 - joinMonth;
          daysEntitled       = Math.round((daysEntitled * monthsLeft) / 12 * 2) / 2; // round to 0.5
        }
      }

      const balance = this.balanceRepo.create({
        tenantId,
        employeeId,
        leaveTypeId:    lt.id,
        year:           targetYear,
        openingBalance: daysEntitled.toFixed(2),
        credited:       '0.00',
        utilized:       '0.00',
        carryForwardDays: '0.00',
        encashedDays:   '0.00',
        closingBalance: daysEntitled.toFixed(2),
        lastComputedAt: new Date(),
      });

      results.push(await this.balanceRepo.save(balance));
      this.logger.log(
        `[LeaveBalance] Initialized emp=${employeeId} type=${lt.leaveCode} year=${targetYear} days=${daysEntitled}`,
      );
    }

    return results;
  }

  // ── 2. Deduct Leave ───────────────────────────────────────────────────────

  /**
   * Deduct approved leave days from the employee's balance.
   * Must be called transactionally with the leave request approval.
   * Throws if insufficient balance.
   */
  async deductLeave(
    employeeId: string,
    leaveTypeId: string,
    tenantId: string,
    days: number,
    year?: number,
  ): Promise<LeaveBalanceEntity> {
    const targetYear = year ?? new Date().getFullYear();

    return this.dataSource.transaction(async (em) => {
      const balance = await em.findOne(LeaveBalanceEntity, {
        where: { tenantId, employeeId, leaveTypeId, year: targetYear },
        lock: { mode: 'pessimistic_write' },
      });

      if (!balance) {
        throw new NotFoundException(
          `No leave balance found for employee ${employeeId} / type ${leaveTypeId} / year ${targetYear}. ` +
          `Run initializeBalances first.`,
        );
      }

      const current = parseFloat(balance.closingBalance);
      if (current < days) {
        throw new BadRequestException(
          `Insufficient leave balance. Available: ${current} days, Requested: ${days} days.`,
        );
      }

      balance.utilized       = (parseFloat(balance.utilized) + days).toFixed(2);
      balance.closingBalance = this.recalcClosing(balance);
      balance.lastComputedAt = new Date();

      return em.save(LeaveBalanceEntity, balance);
    });
  }

  // ── 3. Reverse Deduction (cancel / reject) ────────────────────────────────

  /**
   * Reverse a deduction when a leave request is cancelled or rejected after approval.
   */
  async reverseDeduction(
    employeeId: string,
    leaveTypeId: string,
    tenantId: string,
    days: number,
    year?: number,
  ): Promise<LeaveBalanceEntity> {
    const targetYear = year ?? new Date().getFullYear();

    return this.dataSource.transaction(async (em) => {
      const balance = await em.findOne(LeaveBalanceEntity, {
        where: { tenantId, employeeId, leaveTypeId, year: targetYear },
        lock: { mode: 'pessimistic_write' },
      });

      if (!balance) {
        throw new NotFoundException(`No leave balance for reversal.`);
      }

      balance.utilized       = Math.max(0, parseFloat(balance.utilized) - days).toFixed(2);
      balance.closingBalance = this.recalcClosing(balance);
      balance.lastComputedAt = new Date();

      return em.save(LeaveBalanceEntity, balance);
    });
  }

  // ── 4. Credit Leave (Manual Adjustment) ──────────────────────────────────

  async creditLeave(
    employeeId: string,
    leaveTypeId: string,
    tenantId: string,
    days: number,
    year?: number,
    reason?: string,
  ): Promise<LeaveBalanceEntity> {
    const targetYear = year ?? new Date().getFullYear();

    const balance = await this.balanceRepo.findOne({
      where: { tenantId, employeeId, leaveTypeId, year: targetYear },
    });

    if (!balance) {
      throw new NotFoundException(`No leave balance found. Initialize first.`);
    }

    balance.credited       = (parseFloat(balance.credited) + days).toFixed(2);
    balance.closingBalance = this.recalcClosing(balance);
    balance.lastComputedAt = new Date();

    this.logger.log(
      `[LeaveBalance] Credit emp=${employeeId} type=${leaveTypeId} +${days} days` +
      (reason ? ` reason="${reason}"` : ''),
    );

    return this.balanceRepo.save(balance);
  }

  // ── 5. Year-End Carry-Forward Batch ───────────────────────────────────────

  /**
   * PRD §5.5: Carry eligible leave balances to the next year.
   *
   * Rules:
   *   - Sick Leave: carry up to max 30 days
   *   - Earned/Privilege: carry up to max 45 days
   *   - Casual / others with carryForwardLimit = 0: no carry
   *
   * Run this as a scheduled job at 00:01 on Jan 1st each year.
   *
   * @param fromYear   The year being closed (e.g. 2024)
   * @param tenantId   Tenant scope
   */
  async processCarryForward(
    fromYear: number,
    tenantId: string,
  ): Promise<CarryForwardResult> {
    const toYear = fromYear + 1;

    this.logger.log(`[LeaveBalance] Processing carry-forward ${fromYear} → ${toYear} tenant=${tenantId}`);

    const closingBalances = await this.balanceRepo.find({
      where: { tenantId, year: fromYear },
    });

    const leaveTypeMap = new Map<string, LeaveTypeEntity>();
    const leaveTypes   = await this.leaveTypeRepo.find({ where: { tenantId } });
    leaveTypes.forEach(lt => leaveTypeMap.set(lt.id, lt));

    const result: CarryForwardResult = {
      processedCount:  0,
      skippedCount:    0,
      totalDaysCarried: 0,
      details:         [],
    };

    for (const balance of closingBalances) {
      const lt = leaveTypeMap.get(balance.leaveTypeId);
      if (!lt) { result.skippedCount++; continue; }

      const cfLimit = parseFloat((lt as unknown as Record<string,string>)['maxCarryForward'] ?? lt.carryForwardLimit ?? '0');
      if (cfLimit <= 0) { result.skippedCount++; continue; }

      const closing   = parseFloat(balance.closingBalance);
      const carriedDays = Math.min(closing, cfLimit);

      if (carriedDays <= 0) { result.skippedCount++; continue; }

      // Ensure next-year balance row exists (initialize if not)
      let nextBalance = await this.balanceRepo.findOne({
        where: {
          tenantId,
          employeeId:  balance.employeeId,
          leaveTypeId: balance.leaveTypeId,
          year:        toYear,
        },
      });

      if (!nextBalance) {
        // Create next-year row
        await this.initializeBalances(balance.employeeId, tenantId, toYear, false);
        nextBalance = await this.balanceRepo.findOne({
          where: { tenantId, employeeId: balance.employeeId, leaveTypeId: balance.leaveTypeId, year: toYear },
        });
      }

      if (!nextBalance) { result.skippedCount++; continue; }

      nextBalance.carryForwardDays = (parseFloat(nextBalance.carryForwardDays) + carriedDays).toFixed(2);
      nextBalance.closingBalance   = this.recalcClosing(nextBalance);
      nextBalance.lastComputedAt   = new Date();
      await this.balanceRepo.save(nextBalance);

      result.processedCount++;
      result.totalDaysCarried += carriedDays;
      result.details.push({
        employeeId:  balance.employeeId,
        leaveTypeId: balance.leaveTypeId,
        carriedDays,
        cappedAt:    cfLimit,
      });

      this.logger.debug(
        `[CF] emp=${balance.employeeId} type=${lt.leaveCode} carried=${carriedDays} (cap=${cfLimit})`,
      );
    }

    this.logger.log(
      `[LeaveBalance] Carry-forward done. processed=${result.processedCount} ` +
      `skipped=${result.skippedCount} totalDays=${result.totalDaysCarried}`,
    );

    return result;
  }

  // ── 6. Encashment ─────────────────────────────────────────────────────────

  /**
   * Calculate encashable amount for an employee's leave balance.
   *
   * Formula (PRD-aligned):
   *   encashable_days = closing_balance (capped by LeaveType.encash_rate_pct config)
   *   daily_rate      = monthly_salary / 26   (26 working days/month standard)
   *   amount          = encashable_days × daily_rate × (encash_rate_pct / 100)
   */
  async calculateEncashment(
    employeeId: string,
    leaveTypeId: string,
    tenantId: string,
    year?: number,
  ): Promise<EncashmentResult> {
    const targetYear = year ?? new Date().getFullYear();

    const balance = await this.balanceRepo.findOne({
      where: { tenantId, employeeId, leaveTypeId, year: targetYear },
    });
    if (!balance) {
      throw new NotFoundException(`No balance found for encashment calculation.`);
    }

    const lt = await this.leaveTypeRepo.findOne({ where: { id: leaveTypeId, tenantId } });
    if (!lt) throw new NotFoundException(`Leave type ${leaveTypeId} not found.`);
    if (!lt.encashable) {
      throw new BadRequestException(`Leave type ${lt.leaveName} is not encashable.`);
    }

    const employee = await this.employeeRepo.findOne({ where: { id: employeeId, tenantId } });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found.`);

    const monthlySalary  = parseFloat(employee.monthlyCtc ?? '0');
    const dailyRate      = monthlySalary / 26;
    const encashRatePct  = parseFloat((lt as unknown as Record<string,string>)['encashRatePct'] ?? '100');
    const encashableDays = parseFloat(balance.closingBalance);
    const estimatedAmount = encashableDays * dailyRate * (encashRatePct / 100);

    return {
      employeeId,
      leaveTypeId,
      encashableDays,
      encashmentRate: encashRatePct,
      estimatedAmount: Math.round(estimatedAmount * 100) / 100,
      monthlySalary,
    };
  }

  /**
   * Process actual encashment: deduct days and record transaction.
   */
  async processEncashment(
    employeeId: string,
    leaveTypeId: string,
    tenantId: string,
    days: number,
    year?: number,
  ): Promise<LeaveBalanceEntity> {
    const targetYear = year ?? new Date().getFullYear();

    return this.dataSource.transaction(async (em) => {
      const balance = await em.findOne(LeaveBalanceEntity, {
        where: { tenantId, employeeId, leaveTypeId, year: targetYear },
        lock: { mode: 'pessimistic_write' },
      });
      if (!balance) throw new NotFoundException(`No balance for encashment.`);

      const lt = await this.leaveTypeRepo.findOne({ where: { id: leaveTypeId } });
      if (!lt?.encashable) throw new BadRequestException(`Leave type is not encashable.`);

      const available = parseFloat(balance.closingBalance);
      if (days > available) {
        throw new BadRequestException(
          `Cannot encash ${days} days; only ${available} days available.`,
        );
      }

      balance.encashedDays   = (parseFloat(balance.encashedDays) + days).toFixed(2);
      balance.closingBalance = this.recalcClosing(balance);
      balance.lastComputedAt = new Date();

      this.logger.log(
        `[LeaveBalance] Encashment emp=${employeeId} type=${leaveTypeId} days=${days}`,
      );
      return em.save(LeaveBalanceEntity, balance);
    });
  }

  // ── 7. Balance Summary ────────────────────────────────────────────────────

  /**
   * Get full balance summary for an employee for a given year.
   * Used by the ESS dashboard and HR overview.
   */
  async getBalanceSummary(
    employeeId: string,
    tenantId: string,
    year?: number,
  ): Promise<LeaveBalanceSummary[]> {
    const targetYear = year ?? new Date().getFullYear();

    const balances = await this.balanceRepo.find({
      where: { tenantId, employeeId, year: targetYear },
    });

    const leaveTypes = await this.leaveTypeRepo.find({ where: { tenantId } });
    const ltMap = new Map(leaveTypes.map(lt => [lt.id, lt]));

    return balances.map((b) => {
      const lt = ltMap.get(b.leaveTypeId);
      return {
        leaveTypeId:      b.leaveTypeId,
        leaveCode:        lt?.leaveCode     ?? 'UNKNOWN',
        leaveName:        lt?.leaveName     ?? 'Unknown Leave',
        year:             b.year,
        openingBalance:   parseFloat(b.openingBalance),
        credited:         parseFloat(b.credited),
        carryForwardDays: parseFloat(b.carryForwardDays),
        utilized:         parseFloat(b.utilized),
        encashedDays:     parseFloat(b.encashedDays),
        closingBalance:   parseFloat(b.closingBalance),
        encashable:       lt?.encashable    ?? false,
      };
    });
  }

  /**
   * Get single leave type balance (used before leave approval validation).
   */
  async getBalance(
    employeeId: string,
    leaveTypeId: string,
    tenantId: string,
    year?: number,
  ): Promise<number> {
    const targetYear = year ?? new Date().getFullYear();
    const balance    = await this.balanceRepo.findOne({
      where: { tenantId, employeeId, leaveTypeId, year: targetYear },
    });
    return balance ? parseFloat(balance.closingBalance) : 0;
  }

  // ── 8. Batch Initialize All Employees ────────────────────────────────────

  /**
   * Initialize leave balances for ALL active employees for a given year.
   * Run this at year start via the scheduler.
   */
  async initializeAllEmployeesForYear(
    tenantId: string,
    year: number,
  ): Promise<{ success: number; failed: number }> {
    const employees = await this.employeeRepo.find({
      where: { tenantId, status: 'active' },
      select: ['id', 'joinDate'],
    });

    let success = 0;
    let failed  = 0;

    for (const emp of employees) {
      try {
        const joinYear = emp.joinDate ? new Date(emp.joinDate).getFullYear() : year - 1;
        await this.initializeBalances(emp.id, tenantId, year, joinYear === year);
        success++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[LeaveBalance] Init failed for emp=${emp.id}: ${msg}`);
      }
    }

    this.logger.log(
      `[LeaveBalance] Year init done year=${year} success=${success} failed=${failed}`,
    );
    return { success, failed };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Recompute closing_balance from all ledger components.
   *   closing = opening + credited + carryForward - utilized - encashed
   */
  private recalcClosing(balance: LeaveBalanceEntity): string {
    const result =
      parseFloat(balance.openingBalance)    +
      parseFloat(balance.credited)          +
      parseFloat(balance.carryForwardDays)  -
      parseFloat(balance.utilized)          -
      parseFloat(balance.encashedDays);
    return Math.max(0, result).toFixed(2);
  }
}
