/**
 * GOVERNANCE SLO SERVICE — Commit 11
 *
 * Computes Service Level Objectives for the governance platform.
 * SLOs convert raw violation data into operational commitments.
 *
 * WHY SLOs FOR GOVERNANCE?
 *
 * Without SLOs, the governance layer produces data but not accountability.
 * With SLOs, it becomes possible to ask:
 *   - "Are we resolving critical violations within 24h?"
 *   - "Is the violation rate trending up?"
 *   - "Which rules have chronic violations?"
 *
 * That converts governance from "audit tool" into "operational commitment."
 *
 * SLO DEFINITIONS (v1):
 *
 *   SLO-1  CRITICAL_VIOLATION_RESOLUTION
 *     Target: 100% of critical violations resolved within 24h.
 *     Measurement: ViolationLogEntity rows where severity=CRITICAL
 *                  and (resolvedAt - firstSeenAt) > 24h.
 *
 *   SLO-2  HIGH_VIOLATION_RESOLUTION
 *     Target: 95% of high violations resolved within 72h.
 *     Measurement: Rows where severity=HIGH, unresolved after 72h.
 *
 *   SLO-3  VIOLATION_RATE_STABILITY
 *     Target: Total violations per scan ≤ baseline ± 10%.
 *     Measurement: Last 7 scan results vs trailing 30-day average.
 *
 *   SLO-4  SCAN_FREQUENCY
 *     Target: governance:scan must run at least once per 24h.
 *     Measurement: max(ViolationLogEntity.lastSeenAt) recency.
 *
 *   SLO-5  HANDLER_MUTATION_COMPLIANCE
 *     Target: Zero HANDLER_ENTITY_INJECTION violations at any time.
 *     This SLO has no tolerance — any violation immediately fails.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import {
  ViolationLogEntity,
  ViolationType,
  ViolationSeverity,
} from '../../../database/entities/violation-log.entity';
import { GovernanceRuleId } from '../scanner/governance-rule-id.enum';

// ─────────────────────────────────────────────────────────────────────────────
// SLO Types
// ─────────────────────────────────────────────────────────────────────────────

export type SloStatus = 'COMPLIANT' | 'BREACHED' | 'AT_RISK' | 'UNKNOWN';

export interface SloResult {
  id:           string;
  name:         string;
  target:       string;
  status:       SloStatus;
  /** 0.0–1.0 compliance rate (1.0 = fully compliant). */
  compliance:   number;
  /** Human-readable explanation of current status. */
  detail:       string;
  /** Timestamp of this measurement. */
  measuredAt:   string;
}

export interface GovernanceSloReport {
  reportedAt:    string;
  tenantId:      string | null;
  overallStatus: SloStatus;
  slos:          SloResult[];
  /** Trend summary: violations per scan over the last 7 runs. */
  violationTrend: number[];
  /** Chronic violations: fingerprints seen in > 3 consecutive scan cycles. */
  chronicViolations: Array<{
    fingerprint:    string;
    ruleId:         string;
    filePath:       string;
    occurrenceCount: number;
    firstSeenAt:    Date | null;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GovernanceSloService {
  private readonly logger = new Logger(GovernanceSloService.name);

  /** Critical violations must be resolved within this window. */
  private static readonly CRITICAL_SLO_HOURS  = 24;
  /** High violations must be resolved within this window. */
  private static readonly HIGH_SLO_HOURS      = 72;
  /** Violations seen this many times are classified as chronic. */
  private static readonly CHRONIC_THRESHOLD   = 3;
  /** Scanner must have run within this many hours for SLO-4 to pass. */
  private static readonly SCAN_FREQUENCY_HOURS = 24;

  constructor(
    @InjectRepository(ViolationLogEntity)
    private readonly violationRepo: Repository<ViolationLogEntity>,
  ) {}

  /**
   * Generate the full SLO report for a tenant (or platform-wide if null).
   */
  async generateReport(tenantId: string | null): Promise<GovernanceSloReport> {
    // ⚡ Bolt Optimization: Consolidate 7 sequential counts for SLOs 1, 2, 3, and 5
    // into a single database round-trip using conditional aggregation.
    const stats = await this.fetchSloStats(tenantId);

    const [slo1, slo2, slo3, slo4, slo5, trend, chronic] = await Promise.all([
      this.measureSlo1CriticalResolution(tenantId, stats.allCritical, stats.breachedSla1),
      this.measureSlo2HighResolution(tenantId, stats.allHigh, stats.breachedSla2),
      this.measureSlo3ViolationStability(tenantId, stats.recent, stats.prior),
      this.measureSlo4ScanFrequency(tenantId),
      this.measureSlo5HandlerCompliance(tenantId, stats.openCount5),
      this.computeViolationTrend(tenantId),
      this.findChronicViolations(tenantId),
    ]);

    const slos = [slo1, slo2, slo3, slo4, slo5];
    const overallStatus = this.computeOverallSloStatus(slos);

    return {
      reportedAt:        new Date().toISOString(),
      tenantId,
      overallStatus,
      slos,
      violationTrend:    trend,
      chronicViolations: chronic,
    };
  }

  /**
   * ⚡ Bolt Optimization: Fetches all counts for SLOs 1, 2, 3, and 5 in one query.
   */
  private async fetchSloStats(tenantId: string | null) {
    const cutoff1 = new Date(Date.now() - GovernanceSloService.CRITICAL_SLO_HOURS * 3600 * 1000);
    const cutoff2 = new Date(Date.now() - GovernanceSloService.HIGH_SLO_HOURS * 3600 * 1000);
    const week1   = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const qb = this.violationRepo.createQueryBuilder('v');
    if (tenantId) {
      qb.where('v.tenant_id = :tenantId', { tenantId });
    }

    const raw = await qb
      .select("SUM(CASE WHEN v.severity = :crit THEN 1 ELSE 0 END)", 'allCritical')
      .addSelect("SUM(CASE WHEN v.severity = :crit AND v.resolved_at IS NULL AND v.first_seen_at < :cutoff1 THEN 1 ELSE 0 END)", 'breachedSla1')
      .addSelect("SUM(CASE WHEN v.severity = :high THEN 1 ELSE 0 END)", 'allHigh')
      .addSelect("SUM(CASE WHEN v.severity = :high AND v.resolved_at IS NULL AND v.first_seen_at < :cutoff2 THEN 1 ELSE 0 END)", 'breachedSla2')
      .addSelect("SUM(CASE WHEN v.first_seen_at < :now THEN 1 ELSE 0 END)", 'recent')
      .addSelect("SUM(CASE WHEN v.first_seen_at < :week1 THEN 1 ELSE 0 END)", 'prior')
      .addSelect("SUM(CASE WHEN v.violation_type = :vType AND v.resolved_at IS NULL THEN 1 ELSE 0 END)", 'openCount5')
      .setParameters({
        crit: ViolationSeverity.CRITICAL,
        high: ViolationSeverity.HIGH,
        cutoff1,
        cutoff2,
        now: new Date(),
        week1,
        vType: ViolationType.HANDLER_ENTITY_INJECTION,
      })
      .getRawOne();

    return {
      allCritical:  parseInt(raw.allCritical, 10) || 0,
      breachedSla1: parseInt(raw.breachedSla1, 10) || 0,
      allHigh:      parseInt(raw.allHigh, 10) || 0,
      breachedSla2: parseInt(raw.breachedSla2, 10) || 0,
      recent:       parseInt(raw.recent, 10) || 0,
      prior:        parseInt(raw.prior, 10) || 0,
      openCount5:   parseInt(raw.openCount5, 10) || 0,
    };
  }

  // ── SLO-1: Critical Violation Resolution ──────────────────────────────────

  private async measureSlo1CriticalResolution(
    tenantId: string | null,
    allCritical: number,
    breachedSla: number,
  ): Promise<SloResult> {
    const compliance = allCritical === 0 ? 1 : 1 - breachedSla / allCritical;
    const status: SloStatus = compliance === 1 ? 'COMPLIANT'
      : compliance >= 0.9 ? 'AT_RISK' : 'BREACHED';

    return {
      id:          'SLO-1',
      name:        'Critical Violation Resolution',
      target:      '100% critical violations resolved within 24h',
      status,
      compliance,
      detail:      breachedSla === 0
        ? 'All critical violations resolved within SLO window.'
        : `${breachedSla} critical violation(s) exceed the 24h resolution SLO.`,
      measuredAt:  new Date().toISOString(),
    };
  }

  // ── SLO-2: High Violation Resolution ──────────────────────────────────────

  private async measureSlo2HighResolution(
    tenantId: string | null,
    allHigh: number,
    breachedSla: number,
  ): Promise<SloResult> {
    const compliance = allHigh === 0 ? 1 : 1 - breachedSla / allHigh;
    const target     = 0.95; // 95% SLO target
    const status: SloStatus = compliance >= target ? 'COMPLIANT'
      : compliance >= 0.85 ? 'AT_RISK' : 'BREACHED';

    return {
      id:          'SLO-2',
      name:        'High Violation Resolution',
      target:      '95% of high violations resolved within 72h',
      status,
      compliance,
      detail:      breachedSla === 0
        ? 'All high violations resolved within SLO window.'
        : `${breachedSla} high violation(s) exceed the 72h resolution SLO.`,
      measuredAt:  new Date().toISOString(),
    };
  }

  // ── SLO-3: Violation Rate Stability ───────────────────────────────────────

  private async measureSlo3ViolationStability(
    tenantId: string | null,
    recent: number,
    prior: number,
  ): Promise<SloResult> {
    // Growth rate: (recent - prior) / max(prior, 1)
    const growth    = prior === 0 ? 0 : (recent - prior) / prior;
    const threshold = 0.1; // 10% tolerance
    const status: SloStatus = Math.abs(growth) <= threshold ? 'COMPLIANT'
      : growth > 0.25 ? 'BREACHED' : 'AT_RISK';

    return {
      id:          'SLO-3',
      name:        'Violation Rate Stability',
      target:      'Total violations stable within ±10% week-over-week',
      status,
      compliance:  Math.max(0, 1 - Math.abs(growth)),
      detail:      growth === 0
        ? 'Violation rate stable.'
        : `Violation count changed by ${(growth * 100).toFixed(1)}% vs previous 7 days.`,
      measuredAt:  new Date().toISOString(),
    };
  }

  // ── SLO-4: Scan Frequency ─────────────────────────────────────────────────

  private async measureSlo4ScanFrequency(tenantId: string | null): Promise<SloResult> {
    const where   = tenantId ? { tenantId } : {};
    const cutoff  = new Date(Date.now() - GovernanceSloService.SCAN_FREQUENCY_HOURS * 3600 * 1000);

    // Latest static analysis violation or resolution timestamp = proxy for last scan time
    const latestEntry = await this.violationRepo.findOne({
      where: { ...where, domain: 'static-analysis' as any },
      order: { lastSeenAt: 'DESC' },
      select: ['id', 'lastSeenAt'],
    });

    const lastScan      = latestEntry?.lastSeenAt ?? null;
    const withinWindow  = lastScan !== null && lastScan > cutoff;
    const ageHours      = lastScan
      ? Math.floor((Date.now() - lastScan.getTime()) / 3600000)
      : null;

    return {
      id:          'SLO-4',
      name:        'Scan Frequency',
      target:      'governance:scan must run at least once per 24h',
      status:      withinWindow ? 'COMPLIANT' : lastScan === null ? 'UNKNOWN' : 'BREACHED',
      compliance:  withinWindow ? 1 : 0,
      detail:      lastScan === null
        ? 'No scan results found. Run: npm run governance:scan'
        : withinWindow
          ? `Last scan ${ageHours}h ago — within 24h SLO window.`
          : `Last scan ${ageHours}h ago — exceeds 24h scan frequency SLO.`,
      measuredAt:  new Date().toISOString(),
    };
  }

  // ── SLO-5: Handler Mutation Compliance (Zero-Tolerance) ───────────────────

  private async measureSlo5HandlerCompliance(
    tenantId: string | null,
    openCount: number,
  ): Promise<SloResult> {
    const compliant = openCount === 0;

    return {
      id:          'SLO-5',
      name:        'Handler Mutation Compliance',
      target:      'Zero open HANDLER_ENTITY_INJECTION violations at any time',
      status:      compliant ? 'COMPLIANT' : 'BREACHED',
      compliance:  compliant ? 1 : 0,
      detail:      compliant
        ? 'No open handler entity injection violations. Replay safety maintained.'
        : `${openCount} open handler entity injection violation(s). Replay determinism is at risk.`,
      measuredAt:  new Date().toISOString(),
    };
  }

  // ── Trend + Chronic ───────────────────────────────────────────────────────

  private async computeViolationTrend(tenantId: string | null): Promise<number[]> {
    // ⚡ Bolt Optimization: Consolidate 7 individual queries into a single GROUP BY query.
    // Return daily violation counts for the last 7 days (oldest first).
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const results = await this.violationRepo
      .createQueryBuilder('v')
      .select("DATE_TRUNC('day', v.occurred_at)", 'day')
      .addSelect('COUNT(*)', 'count')
      .where(tenantId ? 'v.tenant_id = :tenantId' : '1=1', { tenantId })
      .andWhere('v.occurred_at >= :startDate', { startDate })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    const trendMap = new Map<string, number>();
    results.forEach(r => {
      const dayKey = new Date(r.day).toISOString().split('T')[0];
      trendMap.set(dayKey, parseInt(r.count, 10));
    });

    const trend: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      trend.push(trendMap.get(key) || 0);
    }

    return trend;
  }

  private async findChronicViolations(tenantId: string | null) {
    const where = tenantId ? { tenantId } : {};

    return this.violationRepo.find({
      where:  { ...where, occurrenceCount: LessThan(GovernanceSloService.CHRONIC_THRESHOLD) as any },
      order:  { occurrenceCount: 'DESC' },
      select: ['id', 'fingerprint', 'violationType', 'aggregateId', 'occurrenceCount', 'firstSeenAt'],
      take:   20,
    }).then((rows) =>
      rows
        .filter((r) => r.occurrenceCount >= GovernanceSloService.CHRONIC_THRESHOLD)
        .map((r) => ({
          fingerprint:     r.fingerprint ?? '',
          ruleId:          r.violationType,
          filePath:        r.aggregateId ?? '',
          occurrenceCount: r.occurrenceCount,
          firstSeenAt:     r.firstSeenAt,
        })),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildWhere(tenantId: string | null, extra: object): object {
    return tenantId ? { tenantId, ...extra } : extra;
  }

  private computeOverallSloStatus(slos: SloResult[]): SloStatus {
    if (slos.some((s) => s.status === 'BREACHED')) return 'BREACHED';
    if (slos.some((s) => s.status === 'AT_RISK'))  return 'AT_RISK';
    if (slos.some((s) => s.status === 'UNKNOWN'))  return 'UNKNOWN';
    return 'COMPLIANT';
  }
}
