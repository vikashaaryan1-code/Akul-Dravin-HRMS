import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AttritionRiskFactor {
  factor: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface AttritionPrediction {
  employeeId: string;
  tenantId: string;
  attritionRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;           // 0–100
  topRiskFactors: AttritionRiskFactor[];
  retentionRecommendations: string[];
  predictedExitMonths: number | null; // null = unlikely to leave soon
}

export interface SkillGap {
  departmentId: string;
  missingSkills: Array<{
    skill: string;
    demand: number;
    supplyInDept: number;
    gapSize: 'CRITICAL' | 'SIGNIFICANT' | 'MINOR';
  }>;
  coveragePercentage: number;
}

export interface WorkforceForecast {
  periodMonths: number;
  projectedHeadcount: number;
  projectedAttritions: number;
  hiringNeed: number;
  growthRate: number;
  budgetImpact: number;
}

export interface TeamCompositionInsight {
  tenantId: string;
  tenureBalance: 'HEALTHY' | 'AT_RISK' | 'CRITICAL'; // ratio of <90d employees
  seniorityBalance: 'HEALTHY' | 'TOP_HEAVY' | 'BOTTOM_HEAVY';
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI WORKFORCE PLANNING SERVICE
 *
 * PRD §3.2 — AI Workforce Intelligence Layer:
 *   Attrition prediction, skill gap detection, workforce forecasting.
 *
 * Design: deterministic rule-based scoring with explainable logic.
 * Future ML models will replace the risk-scoring function.
 */
@Injectable()
export class AiWorkforcePlanningService {
  private readonly logger = new Logger(AiWorkforcePlanningService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  // ── Attrition Risk Scoring ─────────────────────────────────────────────────

  private computeRiskScore(profile: {
    tenureDays: number;
    monthsWithoutPromotion: number;
    pendingLeaveRequests: number;
    helpDeskTicketsLast30Days: number;
    payrollDisputes: number;
    lateMarksLast30Days: number;
  }): { score: number; factors: AttritionRiskFactor[] } {
    let score = 0;
    const factors: AttritionRiskFactor[] = [];

    // Factor 1: Short tenure (probation = high risk of early exit)
    if (profile.tenureDays < 90) {
      score += 35;
      factors.push({
        factor: 'SHORT_TENURE',
        impact: 'HIGH',
        description: 'Employee is in probation period — highest attrition window.',
      });
    } else if (profile.tenureDays < 365) {
      score += 15;
      factors.push({ factor: 'JUNIOR_TENURE', impact: 'MEDIUM', description: 'Under 1 year tenure.' });
    }

    // Factor 2: Stagnant career (no promotion in 24+ months)
    if (profile.monthsWithoutPromotion > 36) {
      score += 30;
      factors.push({
        factor: 'PROMOTION_STAGNATION',
        impact: 'HIGH',
        description: `No promotion in ${profile.monthsWithoutPromotion} months — career ceiling risk.`,
      });
    } else if (profile.monthsWithoutPromotion > 24) {
      score += 15;
      factors.push({ factor: 'PROMOTION_DELAYED', impact: 'MEDIUM', description: 'No promotion in 2+ years.' });
    }

    // Factor 3: High pending leave (burnout indicator)
    if (profile.pendingLeaveRequests >= 3) {
      score += 20;
      factors.push({
        factor: 'LEAVE_ACCUMULATION',
        impact: 'HIGH',
        description: 'Multiple pending leave requests — possible disengagement signal.',
      });
    }

    // Factor 4: High helpdesk tickets (frustration indicator)
    if (profile.helpDeskTicketsLast30Days >= 5) {
      score += 10;
      factors.push({ factor: 'HIGH_SUPPORT_REQUESTS', impact: 'MEDIUM', description: 'High helpdesk activity.' });
    }

    // Factor 5: Payroll disputes (dissatisfaction indicator)
    if (profile.payrollDisputes > 0) {
      score += 15;
      factors.push({ factor: 'PAYROLL_DISPUTE', impact: 'HIGH', description: 'Active payroll dispute.' });
    }

    // Factor 6: Late marks (disengagement indicator)
    if (profile.lateMarksLast30Days >= 10) {
      score += 10;
      factors.push({ factor: 'ATTENDANCE_DECLINE', impact: 'MEDIUM', description: 'Declining attendance punctuality.' });
    }

    return { score: Math.min(100, score), factors };
  }

  // ── Predict Attrition for Employee ─────────────────────────────────────────

  async predictAttritionRisk(
    employeeId: string,
    tenantId: string,
  ): Promise<AttritionPrediction> {
    const today = new Date().toISOString().split('T')[0];
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [empRows, leaveRows, ticketRows, disputeRows, attendanceRows, promotionRows] =
      await Promise.all([
        this.ds.query<Array<{ id: string; join_date: string }>>(
          `SELECT id, join_date FROM employees WHERE id = $1 AND tenant_id = $2`,
          [employeeId, tenantId],
        ),
        this.ds.query<Array<{ count: string }>>(
          `SELECT COUNT(*) AS count FROM leave_requests
           WHERE employee_id = $1 AND status = 'pending'`,
          [employeeId],
        ),
        this.ds.query<Array<{ count: string }>>(
          `SELECT COUNT(*) AS count FROM helpdesk_tickets
           WHERE employee_id = $1 AND created_at >= $2`,
          [employeeId, last30],
        ),
        this.ds.query<Array<{ count: string }>>(
          `SELECT COUNT(*) AS count FROM payroll_items
           WHERE employee_id = $1 AND status = 'dispute'`,
          [employeeId],
        ),
        this.ds.query<Array<{ count: string }>>(
          `SELECT COUNT(*) AS count FROM attendances
           WHERE employee_id = $1 AND status = 'late' AND date >= $2`,
          [employeeId, last30],
        ),
        this.ds.query<Array<{ last_promoted_at: string | null }>>(
          `SELECT last_promoted_at FROM employees WHERE id = $1`,
          [employeeId],
        ),
      ]);

    if (!empRows[0]) {
      return {
        employeeId, tenantId, attritionRisk: 'LOW', riskScore: 0,
        topRiskFactors: [], retentionRecommendations: [],
        predictedExitMonths: null,
      };
    }

    const emp = empRows[0];
    const joinDate = new Date(emp.join_date);
    const tenureDays = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

    const lastPromoDate  = promotionRows[0]?.last_promoted_at
      ? new Date(promotionRows[0].last_promoted_at)
      : joinDate;
    const monthsWithoutPromotion = Math.floor(
      (Date.now() - lastPromoDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );

    const { score, factors } = this.computeRiskScore({
      tenureDays,
      monthsWithoutPromotion,
      pendingLeaveRequests:         parseInt(leaveRows[0]?.count   ?? '0', 10),
      helpDeskTicketsLast30Days:    parseInt(ticketRows[0]?.count  ?? '0', 10),
      payrollDisputes:              parseInt(disputeRows[0]?.count ?? '0', 10),
      lateMarksLast30Days:          parseInt(attendanceRows[0]?.count ?? '0', 10),
    });

    const attritionRisk: AttritionPrediction['attritionRisk'] =
      score >= 75 ? 'CRITICAL' :
      score >= 55 ? 'HIGH'     :
      score >= 35 ? 'MEDIUM'   : 'LOW';

    const recommendations: string[] = [];
    if (attritionRisk === 'CRITICAL' || attritionRisk === 'HIGH') {
      if (factors.some((f) => f.factor === 'PROMOTION_STAGNATION')) {
        recommendations.push('Schedule career advancement conversation — consider role expansion or promotion.');
      }
      if (factors.some((f) => f.factor === 'LEAVE_ACCUMULATION')) {
        recommendations.push('Proactively approve pending leaves — prevent burnout.');
      }
      if (factors.some((f) => f.factor === 'PAYROLL_DISPUTE')) {
        recommendations.push('Resolve payroll dispute within 48 hours to prevent escalation.');
      }
      if (factors.some((f) => f.factor === 'SHORT_TENURE')) {
        recommendations.push('Assign a buddy/mentor — probation period retention requires active support.');
      }
    }

    const predictedExitMonths =
      attritionRisk === 'CRITICAL' ? 2  :
      attritionRisk === 'HIGH'     ? 6  :
      attritionRisk === 'MEDIUM'   ? 18 : null;

    this.logger.log(`ATTRITION_PREDICT: emp=${employeeId} risk=${attritionRisk} score=${score}`);

    return {
      employeeId, tenantId, attritionRisk, riskScore: score,
      topRiskFactors: factors, retentionRecommendations: recommendations,
      predictedExitMonths,
    };
  }

  // ── Bulk Attrition Scan ───────────────────────────────────────────────────

  async bulkAttritionScan(
    tenantId: string,
    threshold: 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH',
  ): Promise<AttritionPrediction[]> {
    const employees = await this.ds.query<Array<{ id: string }>>(
      `SELECT id FROM employees WHERE tenant_id = $1 AND exit_date IS NULL AND status = 'active' LIMIT 500`,
      [tenantId],
    );

    const predictions = await Promise.all(
      employees.map((e) => this.predictAttritionRisk(e.id, tenantId)),
    );

    const ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const thresholdOrder = ORDER[threshold];

    return predictions
      .filter((p) => ORDER[p.attritionRisk] <= thresholdOrder)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  // ── Skill Gap Detection ────────────────────────────────────────────────────

  async detectSkillGaps(tenantId: string): Promise<SkillGap[]> {
    // Get demanded skills from published jobs
    const demandRows = await this.ds.query<Array<{ skill: string; demand: string; department_id: string }>>(
      `SELECT
         unnest(required_skills) AS skill,
         COUNT(*)                AS demand,
         department_id
       FROM recruitment_jobs
       WHERE tenant_id = $1 AND status = 'published'
       GROUP BY skill, department_id`,
      [tenantId],
    );

    // Get supplied skills from employees in departments
    const supplyRows = await this.ds.query<Array<{ skill: string; supply: string; department_id: string }>>(
      `SELECT
         unnest(e.skills)  AS skill,
         COUNT(*)          AS supply,
         e.department_id
       FROM employees e
       WHERE e.tenant_id = $1 AND e.exit_date IS NULL AND e.status = 'active'
         AND e.department_id IS NOT NULL
       GROUP BY skill, e.department_id`,
      [tenantId],
    );

    const supplyMap = new Map(
      supplyRows.map((r) => [`${r.department_id}:${r.skill}`, parseInt(r.supply, 10)]),
    );

    const deptMap = new Map<string, SkillGap['missingSkills']>();
    for (const row of demandRows) {
      const demand = parseInt(row.demand, 10);
      const supply = supplyMap.get(`${row.department_id}:${row.skill}`) ?? 0;
      if (supply < demand) {
        const missing = deptMap.get(row.department_id) ?? [];
        missing.push({
          skill: row.skill,
          demand,
          supplyInDept: supply,
          gapSize: supply === 0 ? 'CRITICAL' : demand - supply > 2 ? 'SIGNIFICANT' : 'MINOR',
        });
        deptMap.set(row.department_id, missing);
      }
    }

    return [...deptMap.entries()].map(([departmentId, missingSkills]) => {
      const totalDemand = missingSkills.reduce((s, x) => s + x.demand, 0);
      const totalSupply = missingSkills.reduce((s, x) => s + x.supplyInDept, 0);
      return {
        departmentId,
        missingSkills,
        coveragePercentage: totalDemand === 0 ? 100 :
          parseFloat(((totalSupply / totalDemand) * 100).toFixed(1)),
      };
    });
  }

  // ── Workforce Forecast ────────────────────────────────────────────────────

  async getWorkforceForecast(tenantId: string, months = 12): Promise<WorkforceForecast> {
    const [headcountRow, attritionRow, avgSalaryRow] = await Promise.all([
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM employees WHERE tenant_id = $1 AND exit_date IS NULL AND status = 'active'`,
        [tenantId],
      ),
      this.ds.query<Array<{ exits: string }>>(
        `SELECT COUNT(*) AS exits FROM employees
         WHERE tenant_id = $1 AND exit_date >= NOW() - INTERVAL '12 months'`,
        [tenantId],
      ),
      this.ds.query<Array<{ avg: string }>>(
        `SELECT ROUND(AVG(monthly_ctc::numeric)) AS avg FROM employees
         WHERE tenant_id = $1 AND exit_date IS NULL AND status = 'active'`,
        [tenantId],
      ),
    ]);

    const current       = parseInt(headcountRow[0]?.count ?? '0', 10);
    const annualExits   = parseInt(attritionRow[0]?.exits ?? '0', 10);
    const monthlyRate   = current > 0 ? annualExits / current / 12 : 0;
    const avgSalary     = parseFloat(avgSalaryRow[0]?.avg ?? '0');

    // Assume 5% growth target per year (configurable via plan-catalog in future)
    const growthRate          = 0.05;
    const targetHeadcount     = Math.ceil(current * (1 + growthRate * months / 12));
    const projectedAttritions = Math.ceil(current * monthlyRate * months);
    const hiringNeed          = targetHeadcount - current + projectedAttritions;

    return {
      periodMonths:          months,
      projectedHeadcount:    targetHeadcount,
      projectedAttritions,
      hiringNeed:            Math.max(0, hiringNeed),
      growthRate:            growthRate * 100,
      budgetImpact:          Math.round(hiringNeed * avgSalary),
    };
  }

  // ── Team Composition Insight ───────────────────────────────────────────────

  async getTeamCompositionInsight(tenantId: string): Promise<TeamCompositionInsight> {
    const today = new Date().toISOString().split('T')[0];

    const [total, probation, senior] = await Promise.all([
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM employees WHERE tenant_id = $1 AND exit_date IS NULL AND status = 'active'`,
        [tenantId],
      ),
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM employees
         WHERE tenant_id = $1 AND exit_date IS NULL AND status = 'active'
           AND ($2::date - join_date::date) < 90`,
        [tenantId, today],
      ),
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM employees
         WHERE tenant_id = $1 AND exit_date IS NULL AND status = 'active'
           AND ($2::date - join_date::date) > 1825`,  // 5+ years
        [tenantId, today],
      ),
    ]);

    const totalCount    = parseInt(total[0]?.count    ?? '0', 10) || 1;
    const probationPct  = (parseInt(probation[0]?.count ?? '0', 10) / totalCount) * 100;
    const seniorPct     = (parseInt(senior[0]?.count   ?? '0', 10) / totalCount) * 100;

    const tenureBalance: TeamCompositionInsight['tenureBalance'] =
      probationPct > 40 ? 'CRITICAL' :
      probationPct > 25 ? 'AT_RISK'  : 'HEALTHY';

    const seniorityBalance: TeamCompositionInsight['seniorityBalance'] =
      seniorPct > 60 ? 'TOP_HEAVY'    :
      seniorPct < 10 ? 'BOTTOM_HEAVY' : 'HEALTHY';

    const recommendations: string[] = [];
    if (tenureBalance === 'CRITICAL') {
      recommendations.push('CRITICAL: >40% staff in probation — prioritize mentoring and early retention programs.');
    }
    if (seniorityBalance === 'TOP_HEAVY') {
      recommendations.push('Top-heavy team — diversify with junior hires to improve cost and succession pipeline.');
    }
    if (seniorityBalance === 'BOTTOM_HEAVY') {
      recommendations.push('Bottom-heavy team — accelerate promotions or hire seniors for knowledge transfer.');
    }

    return { tenantId, tenureBalance, seniorityBalance, recommendations };
  }
}
