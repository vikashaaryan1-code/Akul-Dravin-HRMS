import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../../database/entities/employee.entity';
import { AttendanceEntity } from '../../database/entities/attendance.entity';
import { TaskEntity } from '../../database/entities/task.entity';
import { PerformanceEntity } from '../../database/entities/performance.entity';
import { TenantContext } from '../../common/context/tenant-context';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';
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

  async getScores(period?: string) {
    const currentPeriod = period || new Date().toISOString().substring(0, 7);
    const tenantId = TenantContext.getRequiredTenantId();

    // ⚡ Bolt Optimization: Consolidate 3N + 1 database queries into a single SQL query
    // using subqueries in select and a left join, reducing database round-trips from O(N) to O(1).
    const qb = this.employeeRepo.createQueryBuilder('emp');
    TenantQueryPolicy.enforce(qb, tenantId, 'emp', 'PerformanceManagementService', 'getScores');

    qb.select('emp.id', 'id')
      .addSelect('emp.firstName', 'firstName')
      .addSelect('emp.lastName', 'lastName')
      .addSelect('emp.designation', 'designation')
      .addSelect('emp.departmentId', 'departmentId')
      .addSelect((sub) => {
        return sub
          .select('COUNT(*)')
          .from(AttendanceEntity, 'att')
          .where('att.employeeId = emp.id')
          .andWhere('att.tenantId = :tenantId', { tenantId });
      }, 'totalAttendance')
      .addSelect((sub) => {
        return sub
          .select("COUNT(CASE WHEN att_p.status = 'present' THEN 1 END)")
          .from(AttendanceEntity, 'att_p')
          .where('att_p.employeeId = emp.id')
          .andWhere('att_p.tenantId = :tenantId', { tenantId });
      }, 'presentAttendance')
      .addSelect((sub) => {
        return sub
          .select('COUNT(*)')
          .from(TaskEntity, 't')
          .where('t.assigneeId = emp.id')
          .andWhere("t.status = 'completed'")
          .andWhere('t.tenantId = :tenantId', { tenantId });
      }, 'tasksDelivered')
      .leftJoin(
        PerformanceEntity,
        'perf',
        'perf.employeeId = emp.id AND perf.reviewPeriod = :currentPeriod AND perf.tenantId = :tenantId',
        { currentPeriod, tenantId },
      )
      .addSelect('perf.subjectiveScore', 'subjectiveScore');

    const rawResults = await qb.getRawMany();
    const scores = [];

    for (const row of rawResults) {
      const totalAttendance = parseInt(row.totalAttendance, 10) || 0;
      const presentAttendance = parseInt(row.presentAttendance, 10) || 0;
      const tasksDelivered = parseInt(row.tasksDelivered, 10) || 0;
      const subjectiveScore = row.subjectiveScore !== null && row.subjectiveScore !== undefined
        ? Math.round(parseFloat(row.subjectiveScore))
        : 80;

      const total = totalAttendance || 1;
      const attendanceRate = Math.round((presentAttendance / total) * 100);
      const statsScore = attendanceRate;

      const taskScore = Math.min(100, (tasksDelivered / 10) * 100);
      const objectiveScore = Math.round(statsScore * 0.5 + taskScore * 0.5);
      const finalScore = Math.round(objectiveScore * 0.7 + subjectiveScore * 0.3);

      const emp = this.employeeRepo.create({
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        designation: row.designation,
        departmentId: row.departmentId,
      });

      // --- PDE Integration: Trigger Promotion Check ---
      if (finalScore >= 85) {
        await this.triggerPromotionCheck(emp, finalScore, undefined);
      }

      scores.push({
        id: row.id,
        employeeName: `${row.firstName} ${row.lastName || ''}`.trim(),
        performanceScore: finalScore,
        objectiveScore,
        subjectiveScore,
        targetAchievement: attendanceRate,
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
