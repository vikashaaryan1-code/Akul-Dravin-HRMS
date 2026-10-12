import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RevenueSnapshot {
  mrr: number;                // Monthly Recurring Revenue
  arr: number;                // Annual Recurring Revenue
  arpu: number;               // Average Revenue Per Unit (tenant)
  totalActiveSubscriptions: number;
  totalPaidTenants: number;
  trialTenants: number;
}

export interface PlanDistribution {
  planName: string;
  count: number;
  mrr: number;
  percentage: number;
}

export interface ChurnMetrics {
  periodDays: number;
  churned: number;
  startBase: number;
  churnRate: number;           // percentage
  revenueChurn: number;        // lost MRR
  netRevenueRetentionRate: number;
}

export interface RevenueGrowth {
  month: string;
  newMrr: number;
  churnedMrr: number;
  netMrr: number;
  cumulativeMrr: number;
}

export interface RevenueKpiSummary {
  snapshot: RevenueSnapshot;
  planDistribution: PlanDistribution[];
  churn: ChurnMetrics;
  growthTrend: RevenueGrowth[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * REVENUE ANALYTICS SERVICE
 *
 * PRD §9.1 — Revenue Analytics:
 *   Subscriptions, commission, ARPU, churn — real-time.
 *
 * Queries against the subscriptions table.
 * All monetary values are in INR unless otherwise noted.
 */
@Injectable()
export class RevenueAnalyticsService {
  private readonly logger = new Logger(RevenueAnalyticsService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  // ── Snapshot ──────────────────────────────────────────────────────────────

  /**
   * OPTIMIZATION (⚡ Bolt):
   * Consolidated 3 separate SQL queries into a single database call using conditional
   * aggregation (`COUNT(*) FILTER ...`, `SUM(CASE WHEN status = 'active' THEN ... END)`).
   * Reduces database round-trips for revenue snapshots from 3 to 1.
   */
  async getRevenueSnapshot(): Promise<RevenueSnapshot> {
    const res = await this.ds.query<Array<{
      total: string;
      paid: string;
      trial_count: string;
      mrr: string;
      tenant_count: string;
    }>>(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('active', 'trialing')) AS total,
         COUNT(*) FILTER (WHERE status = 'active') AS paid,
         COUNT(*) FILTER (WHERE status = 'trialing') AS trial_count,
         SUM(
           CASE WHEN status = 'active' THEN
             CASE billing_cycle
               WHEN 'annual'  THEN price::numeric / 12
               WHEN 'monthly' THEN price::numeric
               ELSE price::numeric
             END
           END
         ) AS mrr,
         COUNT(DISTINCT CASE WHEN status = 'active' THEN tenant_id END) AS tenant_count
       FROM subscriptions
       WHERE status IN ('active', 'trialing')`,
    );

    const row         = res[0];
    const mrrValue    = parseFloat(row?.mrr ?? '0');
    const totalActive = parseInt(row?.total ?? '0', 10);
    const paidCount   = parseInt(row?.paid  ?? '0', 10);
    const trialCount  = parseInt(row?.trial_count ?? '0', 10);

    return {
      mrr:                      Math.round(mrrValue),
      arr:                      Math.round(mrrValue * 12),
      arpu:                     paidCount === 0 ? 0 : Math.round(mrrValue / paidCount),
      totalActiveSubscriptions: totalActive,
      totalPaidTenants:         paidCount,
      trialTenants:             trialCount,
    };
  }

  // ── Plan Distribution ─────────────────────────────────────────────────────

  async getPlanDistribution(): Promise<PlanDistribution[]> {
    const rows = await this.ds.query<Array<{
      plan_name: string; count: string; total_mrr: string;
    }>>(
      `SELECT
         plan_name,
         COUNT(*)  AS count,
         SUM(
           CASE billing_cycle
             WHEN 'annual'  THEN price::numeric / 12
             WHEN 'monthly' THEN price::numeric
             ELSE price::numeric
           END
         ) AS total_mrr
       FROM subscriptions
       WHERE status = 'active'
       GROUP BY plan_name
       ORDER BY total_mrr DESC`,
    );

    const totalMrr = rows.reduce((s, r) => s + parseFloat(r.total_mrr ?? '0'), 0) || 1;
    const totalSub = rows.reduce((s, r) => s + parseInt(r.count, 10), 0) || 1;

    return rows.map((r) => ({
      planName:   r.plan_name,
      count:      parseInt(r.count, 10),
      mrr:        Math.round(parseFloat(r.total_mrr ?? '0')),
      percentage: parseFloat(((parseInt(r.count, 10) / totalSub) * 100).toFixed(1)),
    }));
  }

  // ── Churn ─────────────────────────────────────────────────────────────────

  /**
   * OPTIMIZATION (⚡ Bolt):
   * Consolidated 2 separate churn queries into a single database call using conditional aggregations.
   * Reduces churn database queries from 2 to 1.
   */
  async getChurnMetrics(periodDays = 30): Promise<ChurnMetrics> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const res = await this.ds.query<Array<{
      churned_count: string;
      lost_mrr: string;
      start_count: string;
    }>>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'cancelled' AND updated_at >= $1) AS churned_count,
         SUM(
           CASE WHEN status = 'cancelled' AND updated_at >= $1 THEN
             CASE billing_cycle
               WHEN 'annual'  THEN price::numeric / 12
               WHEN 'monthly' THEN price::numeric
               ELSE price::numeric
             END
           END
         ) AS lost_mrr,
         COUNT(*) FILTER (WHERE created_at < $1) AS start_count
       FROM subscriptions
       WHERE (status = 'cancelled' AND updated_at >= $1) OR created_at < $1`,
      [since],
    );

    const row          = res[0];
    const churnedCount = parseInt(row?.churned_count ?? '0', 10);
    const startCount   = Math.max(parseInt(row?.start_count ?? '1', 10), 1);
    const churnRate    = parseFloat(((churnedCount / startCount) * 100).toFixed(2));

    return {
      periodDays,
      churned:        churnedCount,
      startBase:      startCount,
      churnRate,
      revenueChurn:   Math.round(parseFloat(row?.lost_mrr ?? '0')),
      netRevenueRetentionRate: Math.max(0, 100 - churnRate),
    };
  }

  // ── Monthly Growth Trend ─────────────────────────────────────────────────

  async getGrowthTrend(months = 12): Promise<RevenueGrowth[]> {
    const rows = await this.ds.query<Array<{
      month: string; new_mrr: string; churned_mrr: string;
    }>>(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
         SUM(
           CASE WHEN status != 'cancelled'
             THEN CASE billing_cycle
               WHEN 'annual'  THEN price::numeric / 12
               WHEN 'monthly' THEN price::numeric
               ELSE price::numeric
             END
           END
         ) AS new_mrr,
         SUM(
           CASE WHEN status = 'cancelled'
             THEN CASE billing_cycle
               WHEN 'annual'  THEN price::numeric / 12
               WHEN 'monthly' THEN price::numeric
               ELSE price::numeric
             END
           END
         ) AS churned_mrr
       FROM subscriptions
       WHERE created_at >= NOW() - INTERVAL '${months} months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`,
    );

    let cumulative = 0;
    return rows.map((r) => {
      const newMrr     = Math.round(parseFloat(r.new_mrr     ?? '0'));
      const churnedMrr = Math.round(parseFloat(r.churned_mrr ?? '0'));
      const net        = newMrr - churnedMrr;
      cumulative += net;
      return {
        month:         r.month,
        newMrr,
        churnedMrr,
        netMrr:        net,
        cumulativeMrr: cumulative,
      };
    });
  }

  // ── KPI Summary ───────────────────────────────────────────────────────────

  async getKpiSummary(): Promise<RevenueKpiSummary> {
    const [snapshot, planDistribution, churn, growthTrend] = await Promise.all([
      this.getRevenueSnapshot(),
      this.getPlanDistribution(),
      this.getChurnMetrics(30),
      this.getGrowthTrend(12),
    ]);

    return { snapshot, planDistribution, churn, growthTrend };
  }
}
