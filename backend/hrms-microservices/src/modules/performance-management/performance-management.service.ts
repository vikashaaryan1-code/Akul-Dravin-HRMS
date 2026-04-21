import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { TaskEntity } from '../../database/entities/task.entity';
import { PerformanceEntity } from '../../database/entities/performance.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { ExecutionGatekeeperService } from '../policy-engine/gatekeeper/execution-gatekeeper.service';
import { CareerGrowthService } from '../career-growth/career-growth.service';
import { CareerEventStatus } from '../../database/entities/career-growth.entity';

@Injectable()
export class PerformanceManagementService {
  constructor(
    private readonly gatekeeper: ExecutionGatekeeperService,
    private readonly careerGrowthService: CareerGrowthService,
  ) {}

  private get employeeRepo() {
    return TenantContext.getRepository(EmployeeEntity);
  }

  private get attendanceRepo() {
    return TenantContext.getRepository(AttendanceEntity);
  }

  private get taskRepo() {
    return TenantContext.getRepository(TaskEntity);
  }

  private get performanceRepo() {
    return TenantContext.getRepository(PerformanceEntity);
  }

  async getScores(period?: string) {
    const currentPeriod = period || new Date().toISOString().substring(0, 7);
    const employees = await this.employeeRepo.find();
    const scores = [];

    for (const emp of employees) {
      const stats = await this.calculateEmployeeStats(emp.id, 30);
      const tasksDelivered = await this.taskRepo.count({
        where: { assigneeId: emp.id, status: 'completed' }
      });

      const taskScore = Math.min(100, (tasksDelivered / 10) * 100);
      const objectiveScore = Math.round(stats.score * 0.5 + taskScore * 0.5);
      
      const review = await this.performanceRepo.findOne({
        where: { employeeId: emp.id, reviewPeriod: currentPeriod }
      });

      const subjectiveScore = review ? Number(review.subjectiveScore) : 80;
      const finalScore = Math.round(objectiveScore * 0.7 + subjectiveScore * 0.3);

      // --- PDE Integration: Trigger Promotion Check ---
      if (finalScore >= 85) {
        await this.triggerPromotionCheck(emp, finalScore, context.metadata?.traceId);
      }

      scores.push({
        id: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        performanceScore: finalScore,
        objectiveScore,
        subjectiveScore,
        targetAchievement: stats.attendanceRate,
        tasksDelivered,
        status: finalScore > 85 ? 'healthy' : finalScore > 75 ? 'warning' : 'critical'
      });
    }

    return scores.sort((a, b) => b.performanceScore - a.performanceScore);
  }

  private async triggerPromotionCheck(employee: EmployeeEntity, score: number, traceId?: string) {
    const tenantId = TenantContext.getRequiredTenantId();
    
    // 1. Create Promotion Recommendation (Proposed State)
    const recommendation = await this.careerGrowthService.createEvent({
      employeeId: employee.id,
      type: 'promotion',
      oldDesignation: employee.designation,
      triggerScore: score,
      status: CareerEventStatus.PROPOSED,
      forensicTraceId: traceId,
    });

    // 2. Gate via Policy Decision Engine (PDE)
    const pdeResult = await this.gatekeeper.validateDecision({
      tenantId,
      departmentId: employee.departmentId,
      targetField: 'performance.score',
      proposedValue: score,
      metadata: {
        employeeId: employee.id,
        recommendationId: recommendation.id,
        traceId,
      },
    });

    // 3. Update Recommendation Status based on PDE Decision
    if (!pdeResult.allowed || pdeResult.mode === 'BLOCK') {
      await this.careerGrowthService.updateStatus(recommendation.id, CareerEventStatus.REJECTED);
    } else if (pdeResult.mode === 'REVIEW') {
      await this.careerGrowthService.updateStatus(recommendation.id, CareerEventStatus.GATED);
    } else if (pdeResult.mode === 'ALLOW') {
      await this.careerGrowthService.updateStatus(recommendation.id, CareerEventStatus.APPROVED);
      
      // 🚀 EXECUTION LAYER: Apply the promotion to the live employee record
      if (recommendation.newDesignation) {
        await this.employeeRepo.update(employee.id, {
          designation: recommendation.newDesignation
        });
        this.logger.log(`AUTO-PROMOTED: ${employee.firstName} ${employee.lastName} to ${recommendation.newDesignation}`);
      }
      
      await this.careerGrowthService.updateStatus(recommendation.id, CareerEventStatus.EXECUTED);
    }
  }

  async createReview(dto: CreatePerformanceReviewDto) {
    const tenantId = TenantContext.getRequiredTenantId();
    const finalScore = Math.round(dto.objectiveScore * 0.7 + dto.subjectiveScore * 0.3);
    
    const review = this.performanceRepo.create({
      ...dto,
      tenantId,
      finalScore,
      status: 'submitted'
    });

    return this.performanceRepo.save(review);
  }

  private async calculateEmployeeStats(employeeId: string, days: number) {
    const records = await this.attendanceRepo.find({
      where: { employeeId }
    });

    const total = records.length || 1;
    const present = records.filter(r => r.status === 'present').length;
    const attendanceRate = (present / total) * 100;

    return { 
      attendanceRate: Math.round(attendanceRate), 
      score: Math.round(attendanceRate), // Simplified for brevity
      consistency: 100 
    };
  }

  async getLeaderboard(days: number = 30) {
    const scores = await this.getScores();
    return scores.slice(0, 10);
  }

  async getTopEmployees(limit: number = 5) {
    const scores = await this.getScores();
    return scores.slice(0, limit);
  }

  async getTopEmployee() {
    const scores = await this.getScores();
    return scores[0] || null;
  }
}
