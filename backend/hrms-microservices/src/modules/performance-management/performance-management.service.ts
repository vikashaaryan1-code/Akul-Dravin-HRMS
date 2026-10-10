import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { TaskEntity } from '../../database/entities/task.entity';
import { PerformanceEntity } from '../../database/entities/performance.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { ExecutionGatekeeperService } from '../policy-engine/gatekeeper/execution-gatekeeper.service';
import { CareerGrowthService } from '../career-growth/career-growth.service';
import { CareerEventStatus } from '../../database/entities/career-growth.entity';
import { ExecutionMode } from '../policy-engine/types/policy.types';

@Injectable()
export class PerformanceManagementService {
  private readonly logger = new Logger(PerformanceManagementService.name);

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

  /**
   * OPTIMIZED: Replaced N-loop queries (3N+1 total queries) with batch database queries
   * (attendance aggregation, task count aggregation, review score lookup) scoped via TenantQueryPolicy.
   * Reduces database round-trips from O(N) to O(1) constant 4 queries.
   */
  async getScores(period?: string) {
    const currentPeriod = period || new Date().toISOString().substring(0, 7);
    const tenantId = TenantContext.getRequiredTenantId();
    const employees = await this.employeeRepo.find();
    if (employees.length === 0) {
      return [];
    }

    // 1. Fetch attendance stats across all employees in a single query
    const attendanceQb = this.attendanceRepo.createQueryBuilder('att')
      .select('att.employeeId', 'employeeId')
      .addSelect('COUNT(*)', 'total')
      .addSelect("COUNT(CASE WHEN att.status = 'present' THEN 1 END)", 'present');
    TenantQueryPolicy.enforce(attendanceQb, tenantId, 'att', 'PerformanceManagementService', 'getScores.attendance');
    const attendanceRaw = await attendanceQb.groupBy('att.employeeId').getRawMany();

    const attendanceMap = new Map<string, { total: number; present: number }>();
    for (const row of attendanceRaw) {
      const empId = row.employeeId || row.employeeid;
      if (empId) {
        attendanceMap.set(empId, {
          total: parseInt(row.total, 10) || 0,
          present: parseInt(row.present, 10) || 0,
        });
      }
    }

    // 2. Fetch completed tasks count across all employees in a single query
    const taskQb = this.taskRepo.createQueryBuilder('task')
      .select('task.assigneeId', 'assigneeId')
      .addSelect('COUNT(*)', 'tasksDelivered');
    TenantQueryPolicy.enforce(taskQb, tenantId, 'task', 'PerformanceManagementService', 'getScores.tasks');
    const taskRaw = await taskQb
      .andWhere("task.status = 'completed'")
      .groupBy('task.assigneeId')
      .getRawMany();

    const taskMap = new Map<string, number>();
    for (const row of taskRaw) {
      const assigneeId = row.assigneeId || row.assigneeid;
      if (assigneeId) {
        taskMap.set(assigneeId, parseInt(row.tasksDelivered, 10) || 0);
      }
    }

    // 3. Fetch performance reviews for currentPeriod in a single query
    const reviewQb = this.performanceRepo.createQueryBuilder('review')
      .select('review.employeeId', 'employeeId')
      .addSelect('review.subjectiveScore', 'subjectiveScore');
    TenantQueryPolicy.enforce(reviewQb, tenantId, 'review', 'PerformanceManagementService', 'getScores.reviews');
    const reviewRaw = await reviewQb
      .andWhere('review.reviewPeriod = :currentPeriod', { currentPeriod })
      .getRawMany();

    const reviewMap = new Map<string, number>();
    for (const row of reviewRaw) {
      const empId = row.employeeId || row.employeeid;
      const scoreVal = row.subjectiveScore ?? row.subjectivescore;
      if (empId) {
        reviewMap.set(empId, Number(scoreVal));
      }
    }

    const scores = [];

    for (const emp of employees) {
      const attStats = attendanceMap.get(emp.id);
      const total = attStats?.total || 1;
      const present = attStats?.present || 0;
      const attendanceRate = Math.round((present / total) * 100);

      const tasksDelivered = taskMap.get(emp.id) || 0;
      const taskScore = Math.min(100, (tasksDelivered / 10) * 100);
      const objectiveScore = Math.round(attendanceRate * 0.5 + taskScore * 0.5);

      const subjectiveScore = reviewMap.has(emp.id) ? (reviewMap.get(emp.id) ?? 80) : 80;
      const finalScore = Math.round(objectiveScore * 0.7 + subjectiveScore * 0.3);

      // --- PDE Integration: Trigger Promotion Check ---
      if (finalScore >= 85) {
        await this.triggerPromotionCheck(emp, finalScore, undefined);
      }

      scores.push({
        id: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        performanceScore: finalScore,
        objectiveScore,
        subjectiveScore,
        targetAchievement: attendanceRate,
        tasksDelivered,
        status: finalScore > 85 ? 'healthy' : finalScore > 75 ? 'warning' : 'critical',
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
    if (!pdeResult.allowed || pdeResult.mode === ExecutionMode.REQUIRES_APPROVAL) {
      await this.careerGrowthService.updateStatus(recommendation.id, CareerEventStatus.REJECTED);
    } else if (pdeResult.mode === ExecutionMode.ALLOW_WITH_LIMIT) {
      await this.careerGrowthService.updateStatus(recommendation.id, CareerEventStatus.GATED);
    } else if (pdeResult.mode === ExecutionMode.ALLOW_AUTO) {
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
