import {
  Injectable, Logger, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CycleType = 'quarterly' | 'half_yearly' | 'annual' | 'custom';
export type ReviewType = '360' | 'self' | 'manager' | 'peer' | 'okr' | 'kpi';
export type CycleStatus = 'draft' | 'active' | 'review_in_progress' | 'completed' | 'archived';

export interface CreateCycleDto {
  name: string;
  cycleType: CycleType;
  reviewType: ReviewType;
  periodStart: string;   // ISO date
  periodEnd: string;
  eligibleRoles?: string[];
  settings?: {
    ratingScale?: number;        // default 5
    allowSelfRating?: boolean;
    gracePeriodDays?: number;    // days after period_end before cycle auto-closes
    weights?: Record<string, number>; // { execution: 0.4, collaboration: 0.3, innovation: 0.3 }
  };
}

export interface SubmitFeedbackDto {
  revieweeId: string;
  reviewerId: string;
  reviewerType: 'self' | 'manager' | 'peer' | 'skip_level' | 'subordinate';
  ratings: Record<string, number>;
  comments?: string;
  overallRating?: number;
}

export interface GoalDto {
  employeeId: string;
  title: string;
  description?: string;
  goalType?: 'okr' | 'kpi' | 'development' | 'stretch';
  targetValue?: number;
  unit?: string;
  weight?: number;
  dueDate?: string;
}

export interface ReviewCycleSummary {
  id: string;
  name: string;
  cycleType: CycleType;
  reviewType: ReviewType;
  periodStart: string;
  periodEnd: string;
  status: CycleStatus;
  totalReviewees: number;
  submittedFeedback: number;
  pendingFeedback: number;
  completionRate: number;
  avgOverallRating: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PERFORMANCE REVIEW CYCLE SERVICE
 *
 * PRD §9.2 — Performance Management:
 *   360° review cycles, OKR/KPI goals, appraisal workflows, compensation linkage.
 *
 * Integrates naturally with AiWorkforcePlanningService for promotion recommendations.
 */
@Injectable()
export class PerformanceReviewCycleService {
  private readonly logger = new Logger(PerformanceReviewCycleService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Cycle Management ──────────────────────────────────────────────────────

  async createCycle(tenantId: string, dto: CreateCycleDto, createdById: string): Promise<any> {
    if (new Date(dto.periodEnd) <= new Date(dto.periodStart)) {
      throw new BadRequestException('period_end must be after period_start.');
    }

    const [result] = await this.ds.query<Array<{ id: string }>>(
      `INSERT INTO performance_review_cycles
         (tenant_id, name, cycle_type, review_type, period_start, period_end,
          status, eligible_roles, settings, created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9)
       RETURNING id`,
      [
        tenantId, dto.name, dto.cycleType, dto.reviewType,
        dto.periodStart, dto.periodEnd,
        JSON.stringify(dto.eligibleRoles ?? []),
        JSON.stringify(dto.settings ?? { ratingScale: 5, allowSelfRating: true, gracePeriodDays: 7 }),
        createdById,
      ],
    );

    this.logger.log(`CYCLE_CREATED: id=${result.id} tenant=${tenantId} type=${dto.reviewType}`);
    return this.getCycle(result.id, tenantId);
  }

  async getCycle(cycleId: string, tenantId: string): Promise<any> {
    const rows = await this.ds.query(
      `SELECT * FROM performance_review_cycles WHERE id = $1 AND tenant_id = $2`,
      [cycleId, tenantId],
    );
    if (!rows[0]) throw new NotFoundException(`Review cycle ${cycleId} not found.`);
    return rows[0];
  }

  async listCycles(tenantId: string, status?: CycleStatus): Promise<any[]> {
    const args: unknown[] = [tenantId];
    const statusFilter = status ? `AND status = $2` : '';
    if (status) args.push(status);

    return this.ds.query(
      `SELECT * FROM performance_review_cycles
       WHERE tenant_id = $1 ${statusFilter}
       ORDER BY period_end DESC`,
      args,
    );
  }

  async activateCycle(cycleId: string, tenantId: string): Promise<any> {
    await this.ds.query(
      `UPDATE performance_review_cycles SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND status = 'draft'`,
      [cycleId, tenantId],
    );
    this.logger.log(`CYCLE_ACTIVATED: id=${cycleId}`);
    return this.getCycle(cycleId, tenantId);
  }

  async closeCycle(cycleId: string, tenantId: string): Promise<any> {
    await this.ds.query(
      `UPDATE performance_review_cycles
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
         AND status IN ('active','review_in_progress')`,
      [cycleId, tenantId],
    );
    this.logger.log(`CYCLE_CLOSED: id=${cycleId}`);
    return this.getCycle(cycleId, tenantId);
  }

  // ── Cycle Summary (dashboard) ─────────────────────────────────────────────

  async getCycleSummary(cycleId: string, tenantId: string): Promise<ReviewCycleSummary> {
    const [cycle, feedbackStats] = await Promise.all([
      this.getCycle(cycleId, tenantId),
      this.ds.query<Array<{
        total: string; submitted: string; avg_rating: string;
      }>>(
        `SELECT
           COUNT(*)                                              AS total,
           COUNT(*) FILTER (WHERE is_submitted = TRUE)          AS submitted,
           ROUND(AVG(overall_rating) FILTER (WHERE is_submitted), 2) AS avg_rating
         FROM performance_feedback
         WHERE cycle_id = $1 AND tenant_id = $2`,
        [cycleId, tenantId],
      ),
    ]);

    const total     = parseInt(feedbackStats[0]?.total     ?? '0', 10);
    const submitted = parseInt(feedbackStats[0]?.submitted ?? '0', 10);

    return {
      id:           cycle.id,
      name:         cycle.name,
      cycleType:    cycle.cycle_type,
      reviewType:   cycle.review_type,
      periodStart:  cycle.period_start,
      periodEnd:    cycle.period_end,
      status:       cycle.status,
      totalReviewees:   total,
      submittedFeedback: submitted,
      pendingFeedback:  total - submitted,
      completionRate:   total === 0 ? 0 : parseFloat(((submitted / total) * 100).toFixed(1)),
      avgOverallRating: feedbackStats[0]?.avg_rating ? parseFloat(feedbackStats[0].avg_rating) : null,
    };
  }

  // ── Feedback Submission ───────────────────────────────────────────────────

  async submitFeedback(
    cycleId: string,
    tenantId: string,
    dto: SubmitFeedbackDto,
  ): Promise<any> {
    // Idempotency: one feedback per reviewer-reviewee pair per cycle
    const existing = await this.ds.query(
      `SELECT id, is_submitted FROM performance_feedback
       WHERE cycle_id = $1 AND reviewee_id = $2 AND reviewer_id = $3`,
      [cycleId, dto.revieweeId, dto.reviewerId],
    );

    if (existing[0]?.is_submitted) {
      throw new ConflictException('Feedback already submitted for this reviewer-reviewee pair.');
    }

    if (existing[0]) {
      // Update draft
      const [updated] = await this.ds.query(
        `UPDATE performance_feedback
         SET ratings = $1, comments = $2, overall_rating = $3,
             is_submitted = TRUE, submitted_at = NOW(), updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [
          JSON.stringify(dto.ratings),
          dto.comments ?? null,
          dto.overallRating ?? null,
          existing[0].id,
        ],
      );
      return updated;
    }

    // Insert new
    const [inserted] = await this.ds.query(
      `INSERT INTO performance_feedback
         (tenant_id, cycle_id, reviewee_id, reviewer_id, reviewer_type,
          ratings, comments, overall_rating, is_submitted, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,NOW())
       RETURNING *`,
      [
        tenantId, cycleId, dto.revieweeId, dto.reviewerId, dto.reviewerType,
        JSON.stringify(dto.ratings), dto.comments ?? null, dto.overallRating ?? null,
      ],
    );

    this.logger.log(
      `FEEDBACK_SUBMITTED: cycle=${cycleId} reviewee=${dto.revieweeId} reviewer=${dto.reviewerId}`,
    );

    // Transition cycle status to review_in_progress on first submission
    await this.ds.query(
      `UPDATE performance_review_cycles
       SET status = 'review_in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'active'`,
      [cycleId],
    );

    return inserted;
  }

  async getEmployeeFeedbackSummary(
    cycleId: string,
    employeeId: string,
    tenantId: string,
  ): Promise<any> {
    const feedbacks = await this.ds.query(
      `SELECT reviewer_type, ratings, comments, overall_rating, submitted_at
       FROM performance_feedback
       WHERE cycle_id = $1 AND reviewee_id = $2 AND tenant_id = $3 AND is_submitted = TRUE
       ORDER BY submitted_at`,
      [cycleId, employeeId, tenantId],
    );

    if (feedbacks.length === 0) return { employeeId, cycleId, feedbacks: [], avgRating: null };

    const avgRating = parseFloat(
      (feedbacks.reduce((s: number, f: any) => s + parseFloat(f.overall_rating ?? '0'), 0) / feedbacks.length).toFixed(2),
    );

    return { employeeId, cycleId, feedbacks, avgRating };
  }

  // ── Goal Management ───────────────────────────────────────────────────────

  async createGoal(cycleId: string | null, tenantId: string, dto: GoalDto): Promise<any> {
    const [result] = await this.ds.query(
      `INSERT INTO performance_goals
         (tenant_id, cycle_id, employee_id, title, description,
          goal_type, target_value, unit, weight, due_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active')
       RETURNING *`,
      [
        tenantId, cycleId, dto.employeeId, dto.title, dto.description ?? null,
        dto.goalType ?? 'kpi', dto.targetValue ?? null, dto.unit ?? null,
        dto.weight ?? 1.0, dto.dueDate ?? null,
      ],
    );
    this.logger.log(`GOAL_CREATED: id=${result.id} employee=${dto.employeeId}`);
    return result;
  }

  async updateGoalProgress(
    goalId: string,
    tenantId: string,
    currentValue: number,
  ): Promise<any> {
    const [result] = await this.ds.query(
      `UPDATE performance_goals
       SET current_value = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [currentValue, goalId, tenantId],
    );
    if (!result) throw new NotFoundException(`Goal ${goalId} not found.`);
    return result;
  }

  async getEmployeeGoals(employeeId: string, tenantId: string, cycleId?: string): Promise<any[]> {
    const args: unknown[] = [tenantId, employeeId];
    const cycleFilter = cycleId ? `AND cycle_id = $3` : '';
    if (cycleId) args.push(cycleId);

    return this.ds.query(
      `SELECT * FROM performance_goals
       WHERE tenant_id = $1 AND employee_id = $2 ${cycleFilter}
       ORDER BY created_at DESC`,
      args,
    );
  }

  // ── Appraisal Score (final consolidated score for payroll/promotion) ───────

  async computeFinalAppraisalScore(
    cycleId: string,
    employeeId: string,
    tenantId: string,
  ): Promise<{
    employeeId: string;
    cycleId: string;
    objectiveScore: number;   // from goals
    subjectiveScore: number;  // from 360° feedback
    finalScore: number;       // 70% objective + 30% subjective
    eligibleForPromotion: boolean;
    compensationBand: 'TOP' | 'HIGH' | 'AVERAGE' | 'BELOW_AVERAGE';
  }> {
    const [goalsData, feedbackData] = await Promise.all([
      this.ds.query<Array<{ avg_completion: string }>>(
        `SELECT ROUND(AVG(completion_pct)) AS avg_completion
         FROM performance_goals
         WHERE tenant_id = $1 AND employee_id = $2 AND cycle_id = $3`,
        [tenantId, employeeId, cycleId],
      ),
      this.ds.query<Array<{ avg_rating: string }>>(
        `SELECT ROUND(AVG(overall_rating) * 20) AS avg_rating
         FROM performance_feedback
         WHERE tenant_id = $1 AND reviewee_id = $2 AND cycle_id = $3 AND is_submitted = TRUE`,
        [tenantId, employeeId, cycleId],
      ),
    ]);

    const objectiveScore  = parseInt(goalsData[0]?.avg_completion  ?? '75', 10);
    const subjectiveScore = parseInt(feedbackData[0]?.avg_rating    ?? '75', 10);
    const finalScore      = Math.round(objectiveScore * 0.7 + subjectiveScore * 0.3);

    const compensationBand: 'TOP' | 'HIGH' | 'AVERAGE' | 'BELOW_AVERAGE' =
      finalScore >= 90 ? 'TOP'           :
      finalScore >= 75 ? 'HIGH'          :
      finalScore >= 60 ? 'AVERAGE'       : 'BELOW_AVERAGE';

    const eligibleForPromotion = finalScore >= 85;

    this.logger.log(
      `APPRAISAL: employee=${employeeId} cycle=${cycleId} final=${finalScore} band=${compensationBand}`,
    );

    return {
      employeeId, cycleId, objectiveScore, subjectiveScore, finalScore,
      eligibleForPromotion, compensationBand,
    };
  }
}
