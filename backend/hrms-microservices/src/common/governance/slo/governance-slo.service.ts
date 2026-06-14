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
    const [slo1, slo2, slo3, slo4, slo5, trend, chronic] = await Promise.all([
      this.measureSlo1CriticalResolution(tenantId),
      this.measureSlo2HighResolution(tenantId),
      this.measureSlo3ViolationStability(tenantId),
      this.measureSlo4ScanFrequency(tenantId),
      this.measureSlo5HandlerCompliance(tenantId),
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

  // ── SLO-1: Critical Violation Resolution ──────────────────────────────────

  private async measureSlo1CriticalResolution(tenantId: string | null): Promise<SloResult> {
    const windowMs     = GovernanceSloService.CRITICAL_SLO_HOURS * 3600 * 1000;
    const cutoff       = new Date(Date.now() - windowMs);
    const where        = this.buildWhere(tenantId, { severity: ViolationSeverity.CRITICAL });

    const allCritical  = await this.violationRepo.count({ where });
    const breachedSla  = await this.violationRepo.count({
      where: { ...where, resolvedAt: IsNull(), firstSeenAt: LessThan(cutoff) },
    });

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

  private async measureSlo2HighResolution(tenantId: string | null): Promise<SloResult> {
    const windowMs    = GovernanceSloService.HIGH_SLO_HOURS * 3600 * 1000;
    const cutoff      = new Date(Date.now() - windowMs);
    const where       = this.buildWhere(tenantId, { severity: ViolationSeverity.HIGH });

    const allHigh     = await this.violationRepo.count({ where });
    const breachedSla = await this.violationRepo.count({
      where: { ...where, resolvedAt: IsNull(), firstSeenAt: LessThan(cutoff) },
    });

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

  private async measureSlo3ViolationStability(tenantId: string | null): Promise<SloResult> {
    // Proxy: count violations created in last 7 days vs previous 7 days
    const now     = Date.now();
    const week1   = new Date(now - 7 * 24 * 3600 * 1000);
    const week2   = new Date(now - 14 * 24 * 3600 * 1000);
    const where   = tenantId ? { tenantId } : {};

    const [recent, prior] = await Promise.all([
      this.violationRepo.count({ where: { ...where, firstSeenAt: LessThan(new Date()) } }),
      this.violationRepo.count({ where: { ...where, firstSeenAt: LessThan(week1) } }),
    ]);

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

  private async measureSlo5HandlerCompliance(tenantId: string | null): Promise<SloResult> {
    const where     = this.buildWhere(tenantId, {
      violationType: ViolationType.HANDLER_ENTITY_INJECTION,
      resolvedAt:    IsNull() as any,
    });

    const openCount = await this.violationRepo.count({ where });
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
    // Return daily violation counts for the last 7 days (oldest first)
    const trend: number[] = [];
    const where = tenantId ? { tenantId } : {};

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const dayStart = new Date(Date.now() - (dayOffset + 1) * 24 * 3600 * 1000);
      const dayEnd   = new Date(Date.now() - dayOffset * 24 * 3600 * 1000);

      const count = await this.violationRepo
        .createQueryBuilder('v')
        .where(tenantId ? 'v.tenant_id = :tenantId' : '1=1', { tenantId })
        .andWhere('v.occurred_at >= :dayStart', { dayStart })
        .andWhere('v.occurred_at < :dayEnd', { dayEnd })
        .getCount();

      trend.push(count);
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
