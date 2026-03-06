import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollEntity } from '../../database/entities/payroll.entity';
import { CalculateTargetBasedSalaryDto } from './dto/calculate-target-based-salary.dto';
import { CalculateDaysWiseSalaryDto } from './dto/calculate-days-wise-salary.dto';
import { CalculateBonusSlaDto } from './dto/calculate-bonus-sla.dto';
import { PayrollDeductionItemDto } from './dto/payroll-deduction-item.dto';

type TargetTierCode = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
type BonusTierCode = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6';

interface TargetTierBreakdown {
  code: TargetTierCode;
  label: string;
  multiplier: number;
  variablePayout: number;
  overflowPayout: number;
}

interface TargetForecastBreakdown {
  forecastAchievedValue: number;
  forecastAchievementPercent: number;
  projectedTier: TargetTierCode;
  projectedGrossPayout: number;
}

interface TargetBasedSalaryResult {
  algorithmVersion: string;
  tier: TargetTierCode;
  status: string;
  achievementPercent: number;
  multiplier: number;
  baseSalary: number;
  variableSalary: number;
  variablePayout: number;
  overflowPayout: number;
  spiffBonus: number;
  grossPayout: number;
  currency: string;
  forecast: TargetForecastBreakdown | null;
}

interface DaysWiseSalaryResult {
  algorithmVersion: string;
  monthlyBaseSalary: number;
  workingDaysInMonth: number;
  dailyRate: number;
  payableDayUnits: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  targetBonus: number;
  finalMonthlyPayment: number;
  currency: string;
  deductionBreakdown: PayrollDeductionItemDto[];
}

interface BonusTierBreakdown {
  code: BonusTierCode;
  label: string;
  multiplier: number;
  payoutSlaDays: number;
}

interface BonusSlaResult {
  algorithmVersion: string;
  tier: BonusTierCode;
  tierLabel: string;
  achievementPercent: number;
  baseVariableBonus: number;
  multiplier: number;
  qualityFactor: number;
  attendanceFactor: number;
  compliancePenaltyFactor: number;
  finalBonus: number;
  payoutSlaDays: number;
  payoutEta: string;
  slaStatus: 'within-sla' | 'at-risk' | 'breached';
  currency: string;
}

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @InjectRepository(PayrollEntity)
    private readonly payrollRepository: Repository<PayrollEntity>,
  ) {}

  findAll(): Promise<PayrollEntity[]> {
    return this.payrollRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<PayrollEntity | null> {
    return this.payrollRepository.findOne({ where: { id } });
  }

  create(payload: Partial<PayrollEntity>): Promise<PayrollEntity> {
    const entity = this.payrollRepository.create(payload);
    return this.payrollRepository.save(entity);
  }

  async update(id: string, payload: Partial<PayrollEntity>): Promise<PayrollEntity | null> {
    await this.payrollRepository.update(id, payload);
    return this.findOne(id);
  }

  calculateTargetBasedSalary(dto: CalculateTargetBasedSalaryDto): TargetBasedSalaryResult {
    if (dto.achievedValue < 0) {
      throw new BadRequestException('achievedValue cannot be negative');
    }

    if (dto.totalDaysInMonth !== undefined && dto.elapsedDaysInMonth === undefined) {
      throw new BadRequestException('elapsedDaysInMonth is required when totalDaysInMonth is provided');
    }

    if (dto.elapsedDaysInMonth !== undefined && dto.totalDaysInMonth === undefined) {
      throw new BadRequestException('totalDaysInMonth is required when elapsedDaysInMonth is provided');
    }

    if (
      dto.elapsedDaysInMonth !== undefined
      && dto.totalDaysInMonth !== undefined
      && dto.elapsedDaysInMonth > dto.totalDaysInMonth
    ) {
      throw new BadRequestException('elapsedDaysInMonth must be less than or equal to totalDaysInMonth');
    }

    const spiffBonus = dto.spiffBonus ?? 0;
    const achievementPercent = (dto.achievedValue / dto.targetValue) * 100;
    const tier = this.resolveTargetTier(achievementPercent, dto.variableSalary, spiffBonus);
    const grossPayout = dto.baseSalary + tier.variablePayout;

    let forecast: TargetForecastBreakdown | null = null;
    if (dto.elapsedDaysInMonth !== undefined && dto.totalDaysInMonth !== undefined && dto.elapsedDaysInMonth > 0) {
      const forecastAchievedValue = (dto.achievedValue / dto.elapsedDaysInMonth) * dto.totalDaysInMonth;
      const forecastAchievementPercent = (forecastAchievedValue / dto.targetValue) * 100;
      const projectedTier = this.resolveTargetTier(forecastAchievementPercent, dto.variableSalary, spiffBonus);

      forecast = {
        forecastAchievedValue: this.round(forecastAchievedValue),
        forecastAchievementPercent: this.round(forecastAchievementPercent, 3),
        projectedTier: projectedTier.code,
        projectedGrossPayout: this.round(dto.baseSalary + projectedTier.variablePayout),
      };
    }

    this.logger.log(`Calculated target salary tier=${tier.code} achievement=${this.round(achievementPercent, 3)}%`);

    return {
      algorithmVersion: 'v1000.0-target-tier',
      tier: tier.code,
      status: tier.label,
      achievementPercent: this.round(achievementPercent, 3),
      multiplier: tier.multiplier,
      baseSalary: this.round(dto.baseSalary),
      variableSalary: this.round(dto.variableSalary),
      variablePayout: this.round(tier.variablePayout),
      overflowPayout: this.round(tier.overflowPayout),
      spiffBonus: this.round(spiffBonus),
      grossPayout: this.round(grossPayout),
      currency: dto.currency ?? 'INR',
      forecast,
    };
  }

  calculateSixTierBonusSla(dto: CalculateBonusSlaDto): BonusSlaResult {
    if (dto.baseVariableBonus < 0) {
      throw new BadRequestException('baseVariableBonus cannot be negative');
    }

    const qualityScore = dto.qualityScore ?? 100;
    const attendanceScore = dto.attendanceScore ?? 100;
    const breachCount = dto.breachCount ?? 0;

    const tier = this.resolveBonusSlaTier(dto.achievementPercent);
    const qualityFactor = this.round(Math.max(0.7, Math.min(1.15, qualityScore / 100)), 4);
    const attendanceFactor = this.round(Math.max(0.75, Math.min(1.05, attendanceScore / 100)), 4);
    const compliancePenaltyFactor = this.round(Math.min(0.2, breachCount * 0.02), 4);

    const effectiveMultiplier = tier.multiplier * qualityFactor * attendanceFactor * (1 - compliancePenaltyFactor);
    const finalBonus = dto.baseVariableBonus * Math.max(0, effectiveMultiplier);

    const payoutEtaDate = new Date();
    payoutEtaDate.setDate(payoutEtaDate.getDate() + tier.payoutSlaDays);

    const slaStatus: BonusSlaResult['slaStatus'] = breachCount > 2
      ? 'breached'
      : breachCount > 0
        ? 'at-risk'
        : 'within-sla';

    this.logger.log(
      `Calculated bonus SLA tier=${tier.code} achievement=${this.round(dto.achievementPercent, 3)}% finalBonus=${this.round(finalBonus)}`,
    );

    return {
      algorithmVersion: 'v1000.0-bonus-sla',
      tier: tier.code,
      tierLabel: tier.label,
      achievementPercent: this.round(dto.achievementPercent, 3),
      baseVariableBonus: this.round(dto.baseVariableBonus),
      multiplier: this.round(effectiveMultiplier, 4),
      qualityFactor,
      attendanceFactor,
      compliancePenaltyFactor,
      finalBonus: this.round(finalBonus),
      payoutSlaDays: tier.payoutSlaDays,
      payoutEta: payoutEtaDate.toISOString(),
      slaStatus,
      currency: dto.currency ?? 'INR',
    };
  }

  calculateDaysWiseSalary(dto: CalculateDaysWiseSalaryDto): DaysWiseSalaryResult {
    const onDutyDays = dto.onDutyDays ?? 0;
    const wfhDays = dto.wfhDays ?? 0;
    const deductions = dto.deductions ?? [];

    const equivalentDayUnits = dto.unpaidLeaveDays + dto.paidLeaveDays + (dto.halfDays * 0.5) + onDutyDays + wfhDays;
    if (equivalentDayUnits > dto.workingDaysInMonth + 0.0001) {
      throw new BadRequestException('Total day units cannot exceed workingDaysInMonth');
    }

    const dailyRate = dto.monthlyBaseSalary / dto.workingDaysInMonth;
    const grossSalary = dto.monthlyBaseSalary
      - (dto.unpaidLeaveDays * dailyRate)
      - (dto.halfDays * 0.5 * dailyRate)
      + (dto.paidLeaveDays * dailyRate)
      + (onDutyDays * dailyRate)
      + (wfhDays * dailyRate);

    const totalDeductions = this.sumDeductions(deductions);
    const netSalary = grossSalary - totalDeductions;
    const targetBonus = dto.targetBonus ?? 0;
    const finalMonthlyPayment = netSalary + targetBonus;
    const payableDayUnits = dto.workingDaysInMonth - dto.unpaidLeaveDays - (dto.halfDays * 0.5) + dto.paidLeaveDays + onDutyDays + wfhDays;

    this.logger.log(`Calculated days-wise salary dailyRate=${this.round(dailyRate, 4)} finalPayment=${this.round(finalMonthlyPayment)}`);

    return {
      algorithmVersion: 'v1000.0-days-wise',
      monthlyBaseSalary: this.round(dto.monthlyBaseSalary),
      workingDaysInMonth: dto.workingDaysInMonth,
      dailyRate: this.round(dailyRate, 4),
      payableDayUnits: this.round(payableDayUnits, 3),
      grossSalary: this.round(grossSalary),
      totalDeductions: this.round(totalDeductions),
      netSalary: this.round(netSalary),
      targetBonus: this.round(targetBonus),
      finalMonthlyPayment: this.round(finalMonthlyPayment),
      currency: dto.currency ?? 'INR',
      deductionBreakdown: deductions,
    };
  }

  private sumDeductions(deductions: PayrollDeductionItemDto[]): number {
    return deductions.reduce((total, deduction) => total + deduction.amount, 0);
  }

  private resolveTargetTier(
    achievementPercent: number,
    variableSalary: number,
    spiffBonus: number,
  ): TargetTierBreakdown {
    if (achievementPercent < 50) {
      return {
        code: 'T1',
        label: 'Below Target',
        multiplier: 0,
        variablePayout: 0,
        overflowPayout: 0,
      };
    }

    if (achievementPercent < 75) {
      return {
        code: 'T2',
        label: 'Partial Achievement',
        multiplier: 0.25,
        variablePayout: variableSalary * 0.25,
        overflowPayout: 0,
      };
    }

    if (achievementPercent < 90) {
      return {
        code: 'T3',
        label: 'Good Progress',
        multiplier: 0.5,
        variablePayout: variableSalary * 0.5,
        overflowPayout: 0,
      };
    }

    if (achievementPercent < 100) {
      return {
        code: 'T4',
        label: 'Excellent',
        multiplier: 0.75,
        variablePayout: variableSalary * 0.75,
        overflowPayout: 0,
      };
    }

    if (achievementPercent < 120) {
      const overflowPercent = Math.min(Math.max(achievementPercent - 100, 0), 20);
      const overflowAmount = variableSalary * (overflowPercent / 100);
      const overflowPayout = overflowAmount * 0.5;

      return {
        code: 'T5',
        label: 'Exceeded Target',
        multiplier: 1.0,
        variablePayout: variableSalary + overflowPayout,
        overflowPayout,
      };
    }

    return {
      code: 'T6',
      label: 'Outstanding',
      multiplier: 1.5,
      variablePayout: (variableSalary * 1.5) + spiffBonus,
      overflowPayout: 0,
    };
  }

  private resolveBonusSlaTier(achievementPercent: number): BonusTierBreakdown {
    if (achievementPercent < 50) {
      return { code: 'B1', label: 'Threshold Miss', multiplier: 0, payoutSlaDays: 10 };
    }

    if (achievementPercent < 75) {
      return { code: 'B2', label: 'Starter Bonus', multiplier: 0.25, payoutSlaDays: 8 };
    }

    if (achievementPercent < 90) {
      return { code: 'B3', label: 'Growth Bonus', multiplier: 0.5, payoutSlaDays: 7 };
    }

    if (achievementPercent < 100) {
      return { code: 'B4', label: 'Strong Bonus', multiplier: 0.8, payoutSlaDays: 5 };
    }

    if (achievementPercent < 120) {
      return { code: 'B5', label: 'Exceeds Target Bonus', multiplier: 1.1, payoutSlaDays: 4 };
    }

    return { code: 'B6', label: 'Elite Bonus', multiplier: 1.6, payoutSlaDays: 2 };
  }

  private round(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
