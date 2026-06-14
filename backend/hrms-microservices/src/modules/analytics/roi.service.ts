import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { PerformanceManagementService } from '../performance-management/performance-management.service';
import { TenantContext } from '../../common/context/tenant-context';

/**
 * ROI Service — measures workforce efficiency by correlating payroll cost
 * against performance scores, grouped by actual department data.
 *
 * ROI formula:
 *   efficiency = avgPerformanceScore / 100
 *   weightedROI = Σ (efficiency_dept × cost_share_dept)
 *
 * "Optimal" threshold = 0.85, "Stable" = 0.60, below = "inefficient"
 */
@Injectable()
export class RoiService {
  private readonly logger = new Logger(RoiService.name);

  constructor(
    @InjectRepository(PayrollItemEntity)
    private readonly payrollItemRepository: Repository<PayrollItemEntity>,
    @InjectRepository(PayrollBatchEntity)
    private readonly payrollBatchRepository: Repository<PayrollBatchEntity>,
    private readonly performanceService: PerformanceManagementService,
  ) {}

  async getDepartmentalROI(period?: string): Promise<Record<string, {
    avgScore: number;
    totalSalary: number;
    headcount: number;
    efficiency: number;
    status: 'optimal' | 'stable' | 'inefficient';
  }>> {
    const tenantId = TenantContext.getRequiredTenantId();
    const currentPeriod = period || new Date().toISOString().substring(0, 7);
    const [periodYear, periodMonth] = currentPeriod.split('-').map(Number);

    // Fetch performance scores for this period
    let scores: Array<{ id: string; performanceScore: number; department?: string }> = [];
    try {
      scores = await this.performanceService.getScores(currentPeriod);
    } catch (err) {
      this.logger.warn(`ROI: getScores failed for period ${currentPeriod} — returning empty: ${err}`);
      return {};
    }

    if (scores.length === 0) return {};

    // Fetch payroll items scoped to tenant + period (join via batch)
    const items = await this.payrollItemRepository
      .createQueryBuilder('pi')
      .innerJoin('pi.batch', 'b', 'b.month = :month AND b.year = :year AND b.tenant_id = :tenantId', {
        month: periodMonth,
        year: periodYear,
        tenantId,
      })
      .where('pi.tenant_id = :tenantId', { tenantId })
      .select(['pi.employeeId', 'pi.netPayable'])
      .getMany();

    // Build employeeId → cost lookup
    const costByEmployee = new Map<string, number>(
      items.map(i => [i.employeeId, parseFloat(i.netPayable ?? '0')]),
    );

    // Group by actual department from the score record
    const stats: Record<string, { totalSalary: number; totalScore: number; count: number }> = {};

    for (const score of scores) {
      // Use the department from the score record; fall back to "Unassigned" only if missing
      const dept = (score as any).department?.trim() || 'Unassigned';

      if (!stats[dept]) {
        stats[dept] = { totalSalary: 0, totalScore: 0, count: 0 };
      }

      // Use actual payroll cost; skip employees with no payroll record
      const cost = costByEmployee.get(score.id);
      if (cost === undefined) continue;

      stats[dept].totalSalary += cost;
      stats[dept].totalScore  += score.performanceScore;
      stats[dept].count       += 1;
    }

    const result: Record<string, {
      avgScore: number;
      totalSalary: number;
      headcount: number;
      efficiency: number;
      status: 'optimal' | 'stable' | 'inefficient';
    }> = {};

    for (const [dept, s] of Object.entries(stats)) {
      if (s.count === 0) continue;
      const avgScore  = s.totalScore / s.count;
      const efficiency = avgScore / 100;

      result[dept] = {
        avgScore:    Math.round(avgScore),
        totalSalary: s.totalSalary,
        headcount:   s.count,
        efficiency,
        status: efficiency > 0.85 ? 'optimal' : efficiency > 0.6 ? 'stable' : 'inefficient',
      };
    }

    return result;
  }

  async getGlobalROI(period?: string): Promise<{
    overallEfficiency: number;
    totalLiability: number;
    departmentCount: number;
    status: 'optimal' | 'stable' | 'inefficient';
    weightedROI: number;
  }> {
    const deptStats = await this.getDepartmentalROI(period);
    const depts = Object.values(deptStats);

    if (depts.length === 0) {
      return { overallEfficiency: 0, totalLiability: 0, departmentCount: 0, status: 'stable', weightedROI: 0 };
    }

    const totalLiability  = depts.reduce((acc, d) => acc + d.totalSalary, 0);
    const totalEfficiency = depts.reduce((acc, d) => acc + d.efficiency, 0);

    // Weighted ROI: each dept contributes proportionally to its cost share
    const weightedROI = totalLiability > 0
      ? depts.reduce((acc, d) => acc + (d.efficiency * (d.totalSalary / totalLiability)), 0)
      : 0;

    return {
      overallEfficiency: totalEfficiency / depts.length,
      totalLiability,
      departmentCount: depts.length,
      status: weightedROI > 0.85 ? 'optimal' : weightedROI > 0.6 ? 'stable' : 'inefficient',
      weightedROI,
    };
  }

  /**
   * Project the impact of an operational directive on the current ROI state.
   * Pure calculation — does not write to any DB table.
   */
  async simulateDirective(
    _directiveId: string,
    currentStats: ReturnType<typeof this.getGlobalROI> extends Promise<infer T> ? T : never,
    directive: { impact: { monthlySavings: number; efficiencyGain: string } },
  ) {
    const projectedLiability = currentStats.totalLiability - directive.impact.monthlySavings;
    const efficiencyGainDecimal = parseFloat(
      directive.impact.efficiencyGain.replace('+', '').replace('%', ''),
    ) / 100;
    const projectedROI = Math.min(
      Number(currentStats.weightedROI) * (1 + efficiencyGainDecimal),
      0.9999,
    );

    return {
      originalState:  currentStats,
      projectedState: {
        ...currentStats,
        totalLiability: projectedLiability,
        weightedROI:    projectedROI,
        status:         projectedROI > 0.85 ? 'optimal' : 'stable',
      },
      netTotalSavings:  directive.impact.monthlySavings,
      efficiencyDelta:  efficiencyGainDecimal,
    };
  }

  /**
   * @deprecated Use simulateDirective() — renamed for clarity.
   */
  async simulateSimulation(
    directiveId: string,
    currentStats: any,
    directive: any,
  ) {
    return this.simulateDirective(directiveId, currentStats, directive);
  }
}
