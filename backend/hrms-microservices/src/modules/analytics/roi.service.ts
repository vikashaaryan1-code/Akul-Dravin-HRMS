import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollEntity } from '../../database/entities/payroll.entity';
import { PerformanceManagementService } from '../performance-management/performance-management.service';

@Injectable()
export class RoiService {
  constructor(
    @InjectRepository(PayrollItemEntity)
    private readonly payrollItemRepository: Repository<PayrollItemEntity>,
    @InjectRepository(PayrollBatchEntity)
    private readonly payrollBatchRepository: Repository<PayrollBatchEntity>,
    private readonly performanceService: PerformanceManagementService,
  ) {}

  async getDepartmentalROI(period?: string) {
    const currentPeriod = period || new Date().toISOString().substring(0, 7);
    const scores = await this.performanceService.getScores(currentPeriod);
    
    // Group metrics by department
    // In this simplified version, we aggregate from the scores which include department data
    // Usually, we'd join with Employee/Department entities for more precision
    
    const stats: Record<string, any> = {};
    
    // Fetch all payroll items for this period by joining with batches
    const items = await this.payrollItemRepository.find({
      where: {
        batch: {
          month: parseInt(currentPeriod.split('-')[1]),
          year: parseInt(currentPeriod.split('-')[0])
        }
      },
      relations: ['batch']
    });

    for (const score of scores) {
      // In a real scenario, we'd have a departmentId on the employee/score
      // For now, we'll simulate the departmental grouping if not present
      const dept = "Operations"; // Fallback for demo
      
      if (!stats[dept]) {
        stats[dept] = {
          totalSalary: 0,
          totalScore: 0,
          count: 0
        };
      }

      const item = items.find(p => p.employeeId === score.id);
      const cost = item ? parseFloat(item.netPayable) : 50000; // Fallback for demo

      stats[dept].totalSalary += cost;
      stats[dept].totalScore += score.performanceScore;
      stats[dept].count += 1;
    }

    const result: Record<string, any> = {};
    for (const dept in stats) {
      const avgScore = stats[dept].totalScore / stats[dept].count;
      // Efficiency calculation: Score normalized (0-1) / Cost normalized
      // Here we use a simpler ROI: (Performance Score / 100)
      const efficiency = avgScore / 100;

      result[dept] = {
        avgScore: Math.round(avgScore),
        totalSalary: stats[dept].totalSalary,
        efficiency,
        status: efficiency > 0.85 ? 'optimal' : efficiency > 0.6 ? 'stable' : 'inefficient'
      };
    }

    return result;
  }

  async getGlobalROI(period?: string) {
    const deptStats = await this.getDepartmentalROI(period);
    const depts = Object.values(deptStats);
    
    if (depts.length === 0) return { overallEfficiency: 0, totalLiability: 0, status: 'stable', weightedROI: 0 };

    const totalLiability = depts.reduce((acc, d: any) => acc + d.totalSalary, 0);
    const totalEfficiency = depts.reduce((acc, d: any) => acc + d.efficiency, 0);
    
    const weightedROI = depts.reduce((acc, d: any) => 
      acc + (d.efficiency * (d.totalSalary / totalLiability)), 0
    );

    return {
      overallEfficiency: totalEfficiency / depts.length,
      totalLiability,
      departmentCount: depts.length,
      status: weightedROI > 0.85 ? 'optimal' : weightedROI > 0.6 ? 'stable' : 'inefficient',
      weightedROI
    };
  }

  async simulateSimulation(directiveId: string, currentStats: any, directive: any) {
    // Project Projected State
    const projectedLiability = currentStats.totalLiability - directive.impact.monthlySavings;
    const efficiencyGainDecimal = parseFloat(directive.impact.efficiencyGain.replace('+', '').replace('%', '')) / 100;
    const projectedROI = Math.min(Number(currentStats.weightedROI) * (1 + efficiencyGainDecimal), 0.9999);

    return {
       originalState: currentStats,
       projectedState: {
          ...currentStats,
          totalLiability: projectedLiability,
          weightedROI: projectedROI,
          status: projectedROI > 0.85 ? 'optimal' : 'stable'
       },
       netTotalSavings: directive.impact.monthlySavings,
       efficiencyDelta: efficiencyGainDecimal
    };
  }
}
