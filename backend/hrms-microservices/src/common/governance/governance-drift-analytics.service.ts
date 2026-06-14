import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ViolationStatus } from '../../database/entities/violation-log.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Response types
// ─────────────────────────────────────────────────────────────────────────────

export interface DayBucket {
  /** YYYY-MM-DD — calendar day in UTC. */
  date: string;
  /** Violations whose first_seen_at falls on this day (net-new debt). */
  newViolations: number;
  /** Violations whose last_seen_at falls on this day (recurrence + new). */
  activeHits: number;
}

export interface HotspotEntry {
  /** Source file path (stored in aggregate_id column). */
  filePath: string;
  /** Most frequent violation type in this file. */
  dominantViolationType: string;
  /** Highest severity among active violations in this file. */
  worstSeverity: string;
  /** Total unique ACTIVE violations in this file. */
  activeViolationCount: number;
  /** Cumulative occurrence_count sum — high = chronic, not just present. */
  totalOccurrences: number;
  /** Most recent last_seen_at across all violations in this file. */
  lastSeenAt: string | null;
}

export interface RuleSummaryEntry {
  /** violation_type column (maps 1:1 to GovernanceRuleId via scanner). */
  violationType: string;
  /** Severity tier for this rule. */
  severity: string;
  /** Count of ACTIVE violations currently tracked for this rule. */
  activeCount: number;
  /** Sum of occurrence_count (how many times the scanner fired this rule total). */
  totalOccurrences: number;
  /** Most recent detection across all violations for this rule. */
  lastSeenAt: string | null;
  /** Files affected by this rule. */
  affectedFiles: number;
}

export interface DriftScore {
  /**
   * Composite score 0–100. Higher = more architectural drift.
   * Formula: min(100, (currentWindowNewCount / max(1, priorWindowNewCount)) * 50)
   * capped at 100. A score of 0 means zero new violations this week.
   */
  score: number;
  /** Directional trend based on week-over-week new violation count. */
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  /** New violations first seen in the last 7 days. */
  currentWindowNewCount: number;
  /** New violations first seen in the 7 days before that. */
  priorWindowNewCount: number;
  /** currentWindowNewCount − priorWindowNewCount. */
  netChange: number;
  /** Percentage change (null if priorWindowNewCount = 0 and current > 0). */
  changePercent: number | null;
}

export interface SeverityBreakdown {
  critical: number;
  high:     number;
  medium:   number;
  low:      number;
  /** Sum of all severity buckets. */
  total: number;
}

export interface GovernanceDriftReport {
  /** ISO 8601 generation timestamp. */
  generatedAt:   string;
  /** Number of calendar days the trend data covers. */
  windowDays:    number;
  /** Active violations broken down by severity. */
  severity:      SeverityBreakdown;
  /** Week-over-week new violation velocity. */
  driftScore:    DriftScore;
  /** Top files with the most active violations (max 10). */
  hotspots:      HotspotEntry[];
  /** Per-rule counts (violation_type). */
  ruleSummary:   RuleSummaryEntry[];
  /** Daily new-violation and recurrence counts over windowDays. */
  trend:         DayBucket[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GOVERNANCE DRIFT ANALYTICS SERVICE
 *
 * Queries the governance_violation_log table (Fifth Truth Plane) to produce
 * temporal drift metrics. All queries scope to static-analysis violations
 * (fingerprint IS NOT NULL) and exclude RESOLVED/ACCEPTED rows from active counts.
 *
 * Design decisions:
 *
 * 1. Raw SQL via DataSource.query() for date_trunc and window functions.
 *    TypeORM's query builder does not support PostgreSQL date_trunc natively.
 *
 * 2. aggregate_id column stores the file path for static analysis violations.
 *    This is a deliberate repurposing — see ViolationLogPersisterService.atomicUpsert().
 *
 * 3. All queries use parameterized inputs — no string interpolation.
 *
 * 4. getFullReport() fans out all sub-queries in parallel via Promise.all()
 *    for minimal latency on the /governance/drift endpoint.
 *
 * Performance:
 *   All queries hit indexed columns (occurrence_count, last_seen_at, severity,
 *   first_seen_at, fingerprint). Cold query time should be <100ms under
 *   normal load with the partial indexes from migrations 1747300000000 and
 *   1747310000000.
 */
@Injectable()
export class GovernanceDriftAnalyticsService {
  private readonly logger = new Logger(GovernanceDriftAnalyticsService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ── Full report ────────────────────────────────────────────────────────────

  /**
   * Composite drift report — fans out all sub-queries in parallel.
   *
   * @param windowDays  Number of calendar days to include in the trend (default 30).
   * @param hotspotLimit  Max number of hotspot files to return (default 10).
   */
  async getFullReport(
    windowDays    = 30,
    hotspotLimit  = 10,
  ): Promise<GovernanceDriftReport> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const [severity, driftScore, hotspots, ruleSummary, trend] = await Promise.all([
      this.getSeverityBreakdown(),
      this.getDriftScore(),
      this.getHotspots(since, hotspotLimit),
      this.getRuleSummary(),
      this.getTrend(windowDays),
    ]);

    return {
      generatedAt:  new Date().toISOString(),
      windowDays,
      severity,
      driftScore,
      hotspots,
      ruleSummary,
      trend,
    };
  }

  // ── Severity breakdown ────────────────────────────────────────────────────

  /**
   * Count of ACTIVE static-analysis violations grouped by severity.
   * Excludes RESOLVED/ACCEPTED — those are deliberate decisions, not active debt.
   */
  async getSeverityBreakdown(): Promise<SeverityBreakdown> {
    const rows = await this.dataSource.query<{ severity: string; cnt: string }[]>(`
      SELECT severity, COUNT(*) AS cnt
      FROM   governance_violation_log
      WHERE  fingerprint IS NOT NULL
        AND  status      = $1
      GROUP  BY severity
    `, [ViolationStatus.ACTIVE]);

    const map: Record<string, number> = {};
    for (const row of rows) {
      map[row.severity.toLowerCase()] = parseInt(row.cnt, 10);
    }

    const critical = map['critical'] ?? 0;
    const high     = map['high']     ?? 0;
    const medium   = map['medium']   ?? 0;
    const low      = map['low']      ?? 0;

    return { critical, high, medium, low, total: critical + high + medium + low };
  }

  // ── Drift score ───────────────────────────────────────────────────────────

  /**
   * Week-over-week drift velocity.
   *
   * Compares how many violations were FIRST SEEN in the last 7 days vs the
   * prior 7 days. New violations = net-new architectural debt introduced.
   */
  async getDriftScore(): Promise<DriftScore> {
    const now         = new Date();
    const minus7days  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
    const minus14days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const rows = await this.dataSource.query<{ window: string; cnt: string }[]>(`
      SELECT
        CASE
          WHEN first_seen_at >= $1 THEN 'current'
          WHEN first_seen_at >= $2 AND first_seen_at < $1 THEN 'prior'
        END AS window,
        COUNT(*) AS cnt
      FROM   governance_violation_log
      WHERE  fingerprint   IS NOT NULL
        AND  first_seen_at >= $2
        AND  first_seen_at IS NOT NULL
      GROUP  BY window
    `, [minus7days, minus14days]);

    const windowMap: Record<string, number> = {};
    for (const row of rows) {
      if (row.window) windowMap[row.window] = parseInt(row.cnt, 10);
    }

    const current = windowMap['current'] ?? 0;
    const prior   = windowMap['prior']   ?? 0;
    const delta   = current - prior;

    let changePercent: number | null = null;
    if (prior > 0) {
      changePercent = Math.round((delta / prior) * 100);
    } else if (current > 0) {
      changePercent = null; // infinite growth from zero baseline
    } else {
      changePercent = 0;
    }

    let trend: DriftScore['trend'];
    if (delta < 0) {
      trend = 'IMPROVING';
    } else if (delta === 0) {
      trend = 'STABLE';
    } else {
      trend = 'DEGRADING';
    }

    // Score: normalised to 0–100. 0 = no new violations this week.
    // Formula: proportional to how much worse this week is vs last week.
    // Capped at 100.
    const score = Math.min(100, current === 0 ? 0 : Math.round(
      (current / Math.max(1, prior)) * 50,
    ));

    return {
      score,
      trend,
      currentWindowNewCount: current,
      priorWindowNewCount:   prior,
      netChange:             delta,
      changePercent,
    };
  }

  // ── Hotspot files ─────────────────────────────────────────────────────────

  /**
   * Top files by active violation density.
   *
   * aggregate_id stores the file path for static-analysis violations.
   * Returns files sorted by total occurrence_count descending —
   * a file that re-fires frequently is higher-priority than one with
   * the same active count but no recurrence.
   */
  async getHotspots(since: Date, limit = 10): Promise<HotspotEntry[]> {
    const rows = await this.dataSource.query<{
      file_path:               string;
      dominant_violation_type: string;
      worst_severity:          string;
      active_violation_count:  string;
      total_occurrences:       string;
      last_seen_at:            string | null;
    }[]>(`
      SELECT
        aggregate_id                                             AS file_path,
        mode() WITHIN GROUP (ORDER BY violation_type)           AS dominant_violation_type,
        (ARRAY[
          MAX(CASE severity WHEN 'CRITICAL' THEN 1 END),
          MAX(CASE severity WHEN 'HIGH'     THEN 2 END),
          MAX(CASE severity WHEN 'MEDIUM'   THEN 3 END),
          MAX(CASE severity WHEN 'LOW'      THEN 4 END)
        ])[1]                                                    AS worst_severity_rank,
        CASE
          WHEN MAX(CASE severity WHEN 'CRITICAL' THEN 1 END) = 1 THEN 'CRITICAL'
          WHEN MAX(CASE severity WHEN 'HIGH'     THEN 1 END) = 1 THEN 'HIGH'
          WHEN MAX(CASE severity WHEN 'MEDIUM'   THEN 1 END) = 1 THEN 'MEDIUM'
          ELSE 'LOW'
        END                                                      AS worst_severity,
        COUNT(*)                                                 AS active_violation_count,
        SUM(occurrence_count)                                    AS total_occurrences,
        MAX(last_seen_at)::text                                  AS last_seen_at
      FROM   governance_violation_log
      WHERE  fingerprint   IS NOT NULL
        AND  status        = $1
        AND  aggregate_id  IS NOT NULL
        AND  last_seen_at  >= $2
      GROUP  BY aggregate_id
      ORDER  BY SUM(occurrence_count) DESC, COUNT(*) DESC
      LIMIT  $3
    `, [ViolationStatus.ACTIVE, since, limit]);

    return rows.map((r) => ({
      filePath:              r.file_path,
      dominantViolationType: r.dominant_violation_type,
      worstSeverity:         r.worst_severity,
      activeViolationCount:  parseInt(r.active_violation_count, 10),
      totalOccurrences:      parseInt(r.total_occurrences, 10),
      lastSeenAt:            r.last_seen_at,
    }));
  }

  // ── Rule summary ──────────────────────────────────────────────────────────

  /**
   * Per-rule violation summary across all ACTIVE violations.
   * Sorted by total_occurrences DESC — chronic rules surface first.
   */
  async getRuleSummary(): Promise<RuleSummaryEntry[]> {
    const rows = await this.dataSource.query<{
      violation_type:    string;
      severity:          string;
      active_count:      string;
      total_occurrences: string;
      last_seen_at:      string | null;
      affected_files:    string;
    }[]>(`
      SELECT
        violation_type,
        severity,
        COUNT(*)              AS active_count,
        SUM(occurrence_count) AS total_occurrences,
        MAX(last_seen_at)     AS last_seen_at,
        COUNT(DISTINCT aggregate_id) FILTER (WHERE aggregate_id IS NOT NULL) AS affected_files
      FROM   governance_violation_log
      WHERE  fingerprint IS NOT NULL
        AND  status      = $1
      GROUP  BY violation_type, severity
      ORDER  BY SUM(occurrence_count) DESC
    `, [ViolationStatus.ACTIVE]);

    return rows.map((r) => ({
      violationType:    r.violation_type,
      severity:         r.severity,
      activeCount:      parseInt(r.active_count, 10),
      totalOccurrences: parseInt(r.total_occurrences, 10),
      lastSeenAt:       r.last_seen_at ? new Date(r.last_seen_at).toISOString() : null,
      affectedFiles:    parseInt(r.affected_files, 10),
    }));
  }

  // ── Daily trend ───────────────────────────────────────────────────────────

  /**
   * Daily violation trend over the last N calendar days.
   *
   * Two time series:
   *   newViolations  — violations FIRST SEEN on that day (new debt introduced)
   *   activeHits     — violations that were LAST SEEN on that day (includes recurrences)
   *
   * The gap between newViolations and activeHits indicates recurrence rate.
   * High recurrence with zero new violations = chronic, unmoved debt.
   */
  async getTrend(windowDays = 30): Promise<DayBucket[]> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    // First-seen series
    const newRows = await this.dataSource.query<{ day: string; cnt: string }[]>(`
      SELECT
        date_trunc('day', first_seen_at)::date::text AS day,
        COUNT(*) AS cnt
      FROM   governance_violation_log
      WHERE  fingerprint   IS NOT NULL
        AND  first_seen_at >= $1
        AND  first_seen_at IS NOT NULL
      GROUP  BY date_trunc('day', first_seen_at)
      ORDER  BY day ASC
    `, [since]);

    // Last-seen series (recurrence + new combined)
    const hitRows = await this.dataSource.query<{ day: string; cnt: string }[]>(`
      SELECT
        date_trunc('day', last_seen_at)::date::text AS day,
        COUNT(*) AS cnt
      FROM   governance_violation_log
      WHERE  fingerprint  IS NOT NULL
        AND  last_seen_at >= $1
        AND  last_seen_at IS NOT NULL
      GROUP  BY date_trunc('day', last_seen_at)
      ORDER  BY day ASC
    `, [since]);

    // Merge into a unified day-keyed map
    const newMap  = new Map(newRows.map((r) => [r.day, parseInt(r.cnt, 10)]));
    const hitMap  = new Map(hitRows.map((r) => [r.day, parseInt(r.cnt, 10)]));

    // Build the complete date range — include zero-count days
    const days: DayBucket[] = [];
    const cursor = new Date(since);
    cursor.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10); // YYYY-MM-DD
      days.push({
        date:          key,
        newViolations: newMap.get(key) ?? 0,
        activeHits:    hitMap.get(key) ?? 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return days;
  }
}
