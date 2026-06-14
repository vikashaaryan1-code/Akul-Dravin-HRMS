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

  async getRevenueSnapshot(): Promise<RevenueSnapshot> {
    const [active, trial, mrr] = await Promise.all([
      this.ds.query<Array<{ total: string; paid: string }>>(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'active') AS paid
         FROM subscriptions
         WHERE status IN ('active','trialing')`,
      ),
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'trialing'`,
      ),
      this.ds.query<Array<{ mrr: string; tenant_count: string }>>(
        `SELECT
           SUM(
             CASE billing_cycle
               WHEN 'annual'  THEN price::numeric / 12
               WHEN 'monthly' THEN price::numeric
               ELSE price::numeric
             END
           ) AS mrr,
           COUNT(DISTINCT tenant_id) AS tenant_count
         FROM subscriptions
         WHERE status = 'active'`,
      ),
    ]);

    const mrrValue    = parseFloat(mrr[0]?.mrr ?? '0');
    const totalActive = parseInt(active[0]?.total ?? '0', 10);
    const paidCount   = parseInt(active[0]?.paid  ?? '0', 10);
    const tenantCount = parseInt(mrr[0]?.tenant_count ?? '1', 10) || 1;

    return {
      mrr:                      Math.round(mrrValue),
      arr:                      Math.round(mrrValue * 12),
      arpu:                     paidCount === 0 ? 0 : Math.round(mrrValue / paidCount),
      totalActiveSubscriptions: totalActive,
      totalPaidTenants:         paidCount,
      trialTenants:             parseInt(trial[0]?.count ?? '0', 10),
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

  async getChurnMetrics(periodDays = 30): Promise<ChurnMetrics> {
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const [churned, startBase] = await Promise.all([
      this.ds.query<Array<{ count: string; lost_mrr: string }>>(
        `SELECT
           COUNT(*) AS count,
           SUM(
             CASE billing_cycle
               WHEN 'annual'  THEN price::numeric / 12
               WHEN 'monthly' THEN price::numeric
               ELSE price::numeric
             END
           ) AS lost_mrr
         FROM subscriptions
         WHERE status = 'cancelled' AND updated_at >= $1`,
        [since],
      ),
      this.ds.query<Array<{ count: string }>>(
        `SELECT COUNT(*) AS count FROM subscriptions WHERE created_at < $1`,
        [since],
      ),
    ]);

    const churnedCount = parseInt(churned[0]?.count ?? '0', 10);
    const startCount   = Math.max(parseInt(startBase[0]?.count ?? '1', 10), 1);
    const churnRate    = parseFloat(((churnedCount / startCount) * 100).toFixed(2));

    return {
      periodDays,
      churned:        churnedCount,
      startBase:      startCount,
      churnRate,
      revenueChurn:   Math.round(parseFloat(churned[0]?.lost_mrr ?? '0')),
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
