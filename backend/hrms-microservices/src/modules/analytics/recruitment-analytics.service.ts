import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RecruitmentFunnelMetrics {
  period: string;
  totalJobsPosted: number;
  totalApplications: number;
  totalScreened: number;
  totalShortlisted: number;
  totalInterviewed: number;
  totalOffered: number;
  totalHired: number;
  totalRejected: number;
  conversionRates: {
    applicationToScreen: number;
    screenToShortlist: number;
    shortlistToInterview: number;
    interviewToOffer: number;
    offerToHire: number;
    overallConversion: number;
  };
}

export interface TimeToHireMetrics {
  avgDaysToHire: number;
  medianDaysToHire: number;
  p90DaysToHire: number;
  byDepartment: Array<{ departmentId: string; avgDays: number }>;
  byJobLevel: Array<{ level: string; avgDays: number }>;
}

export interface CostPerHireMetrics {
  avgCostPerHire: number;
  totalRecruitmentCost: number;
  hires: number;
}

export interface PipelineVelocity {
  stageBreakdown: Array<{
    stage: string;
    count: number;
    avgDaysInStage: number;
    dropoffRate: number;
  }>;
  bottleneckStage: string;
  avgPipelineCycleTime: number;
}

export interface SourceEffectiveness {
  source: string;
  applications: number;
  hires: number;
  conversionRate: number;
}

export interface RecruitmentKpiSummary {
  funnel: RecruitmentFunnelMetrics;
  timeToHire: TimeToHireMetrics;
  pipeline: PipelineVelocity;
  topSources: SourceEffectiveness[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * RECRUITMENT ANALYTICS SERVICE
 *
 * PRD §9.1 — Recruitment Analytics:
 *   Time-to-hire, cost-per-hire, pipeline velocity — real-time.
 */
@Injectable()
export class RecruitmentAnalyticsService {
  private readonly logger = new Logger(RecruitmentAnalyticsService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  // ── Funnel ────────────────────────────────────────────────────────────────

  async getFunnelMetrics(tenantId: string, periodDays = 90): Promise<RecruitmentFunnelMetrics> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const [jobs, apps] = await Promise.all([
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM recruitment_jobs
         WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, since],
      ),
      this.ds.query<Array<{
        total: string; screened: string; shortlisted: string;
        interviewed: string; offered: string; hired: string; rejected: string;
      }>>(
        `SELECT
           COUNT(*)                                                         AS total,
           COUNT(*) FILTER (WHERE pipeline_stage != 'applied')             AS screened,
           COUNT(*) FILTER (WHERE pipeline_stage IN
             ('shortlisted','interview','offer','hired'))                   AS shortlisted,
           COUNT(*) FILTER (WHERE pipeline_stage IN ('interview','offer','hired')) AS interviewed,
           COUNT(*) FILTER (WHERE pipeline_stage IN ('offer','hired'))     AS offered,
           COUNT(*) FILTER (WHERE pipeline_stage = 'hired')                AS hired,
           COUNT(*) FILTER (WHERE pipeline_stage = 'rejected')             AS rejected
         FROM recruitment_applications
         WHERE tenant_id = $1 AND created_at >= $2`,
        [tenantId, since],
      ),
    ]);

    const a = apps[0] ?? {
      total: '0', screened: '0', shortlisted: '0',
      interviewed: '0', offered: '0', hired: '0', rejected: '0',
    };
    const total       = parseInt(a.total, 10) || 1;
    const screened    = parseInt(a.screened,    10);
    const shortlisted = parseInt(a.shortlisted, 10);
    const interviewed = parseInt(a.interviewed, 10);
    const offered     = parseInt(a.offered,     10);
    const hired       = parseInt(a.hired,       10);

    const pct = (n: number, d: number) =>
      d === 0 ? 0 : parseFloat(((n / d) * 100).toFixed(1));

    return {
      period: `Last ${periodDays} days`,
      totalJobsPosted:    parseInt(jobs[0]?.count ?? '0', 10),
      totalApplications:  parseInt(a.total, 10),
      totalScreened:      screened,
      totalShortlisted:   shortlisted,
      totalInterviewed:   interviewed,
      totalOffered:       offered,
      totalHired:         hired,
      totalRejected:      parseInt(a.rejected, 10),
      conversionRates: {
        applicationToScreen:  pct(screened,    total),
        screenToShortlist:    pct(shortlisted, screened || 1),
        shortlistToInterview: pct(interviewed, shortlisted || 1),
        interviewToOffer:     pct(offered,     interviewed || 1),
        offerToHire:          pct(hired,       offered || 1),
        overallConversion:    pct(hired,       total),
      },
    };
  }

  // ── Time to Hire ─────────────────────────────────────────────────────────

  async getTimeToHireMetrics(tenantId: string, periodDays = 180): Promise<TimeToHireMetrics> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const [stats, byDept] = await Promise.all([
      this.ds.query<Array<{ avg_days: string; median_days: string; p90_days: string }>>(
        `SELECT
           ROUND(AVG(hired_at::date - created_at::date))  AS avg_days,
           PERCENTILE_CONT(0.5) WITHIN GROUP
             (ORDER BY hired_at::date - created_at::date)::numeric::integer AS median_days,
           PERCENTILE_CONT(0.9) WITHIN GROUP
             (ORDER BY hired_at::date - created_at::date)::numeric::integer AS p90_days
         FROM recruitment_applications
         WHERE tenant_id = $1
           AND pipeline_stage = 'hired'
           AND hired_at IS NOT NULL
           AND created_at >= $2`,
        [tenantId, since],
      ),
      this.ds.query<Array<{ department_id: string; avg_days: string }>>(
        `SELECT
           rj.department_id,
           ROUND(AVG(ra.hired_at::date - ra.created_at::date)) AS avg_days
         FROM recruitment_applications ra
         JOIN recruitment_jobs rj ON rj.id = ra.job_id
         WHERE ra.tenant_id = $1
           AND ra.pipeline_stage = 'hired'
           AND ra.hired_at IS NOT NULL
           AND ra.created_at >= $2
           AND rj.department_id IS NOT NULL
         GROUP BY rj.department_id
         ORDER BY avg_days DESC`,
        [tenantId, since],
      ),
    ]);

    return {
      avgDaysToHire:    parseInt(stats[0]?.avg_days    ?? '0', 10),
      medianDaysToHire: parseInt(stats[0]?.median_days ?? '0', 10),
      p90DaysToHire:    parseInt(stats[0]?.p90_days    ?? '0', 10),
      byDepartment: byDept.map((r) => ({
        departmentId: r.department_id,
        avgDays:      parseInt(r.avg_days, 10),
      })),
      byJobLevel: [], // populated when job_level field is present
    };
  }

  // ── Pipeline Velocity ─────────────────────────────────────────────────────

  async getPipelineVelocity(tenantId: string): Promise<PipelineVelocity> {
    const stages = [
      'applied', 'screened', 'shortlisted',
      'interview', 'offer', 'hired', 'rejected',
    ];

    const counts = await this.ds.query<Array<{ stage: string; count: string }>>(
      `SELECT pipeline_stage AS stage, COUNT(*) AS count
       FROM recruitment_applications
       WHERE tenant_id = $1
       GROUP BY pipeline_stage`,
      [tenantId],
    );

    const stageMap = new Map(counts.map((r) => [r.stage, parseInt(r.count, 10)]));
    const total = [...stageMap.values()].reduce((s, n) => s + n, 0) || 1;

    const breakdown = stages.map((stage, i) => {
      const count     = stageMap.get(stage) ?? 0;
      const prevCount = i > 0 ? stageMap.get(stages[i - 1]) ?? 1 : total;
      return {
        stage,
        count,
        avgDaysInStage: 0, // requires stage_entered_at columns (added in ATS migration)
        dropoffRate: parseFloat(((1 - count / Math.max(prevCount, 1)) * 100).toFixed(1)),
      };
    });

    // Bottleneck = stage with highest dropoff rate (excluding final stages)
    const bottleneck = breakdown
      .filter((s) => !['hired', 'rejected'].includes(s.stage))
      .sort((a, b) => b.dropoffRate - a.dropoffRate)[0]?.stage ?? 'unknown';

    return {
      stageBreakdown:         breakdown,
      bottleneckStage:        bottleneck,
      avgPipelineCycleTime:   0, // requires hired_at - applied_at
    };
  }

  // ── KPI Summary ───────────────────────────────────────────────────────────

  async getKpiSummary(tenantId: string): Promise<RecruitmentKpiSummary> {
    const [funnel, timeToHire, pipeline] = await Promise.all([
      this.getFunnelMetrics(tenantId, 90),
      this.getTimeToHireMetrics(tenantId, 180),
      this.getPipelineVelocity(tenantId),
    ]);

    return { funnel, timeToHire, pipeline, topSources: [] };
  }
}
