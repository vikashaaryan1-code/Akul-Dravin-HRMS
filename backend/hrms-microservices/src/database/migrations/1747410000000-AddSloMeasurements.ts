import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MIGRATION: SLO Measurements & Error Budget Snapshots — Track P
 *
 * slo_measurements:
 *  Point-in-time SLO samples recorded every evaluation tick (every 5 min).
 *  Provides the time-series data needed for rolling-window analysis,
 *  burn rate computation, and long-range reliability trend analysis.
 *
 *  Retention: 90 days (managed by a scheduled purge job).
 *  Partitioning strategy: monthly RANGE partitioning recommended at >10M rows.
 *
 * error_budget_snapshots:
 *  Periodic snapshots of computed error budget state.
 *  Stores burn rates + budget remaining for fast dashboard queries
 *  without re-querying the full slo_measurements time series.
 */
export class AddSloMeasurements1747410000000 implements MigrationInterface {
  name = 'AddSloMeasurements1747410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── slo_measurements ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS slo_measurements (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Which SLO was measured
        slo_id        VARCHAR(80)   NOT NULL,

        -- The measured value at this point in time
        measured_value NUMERIC(18,4) NOT NULL,

        -- Was the SLO in breach at this moment?
        is_breach     BOOLEAN       NOT NULL DEFAULT FALSE,

        -- Deviation from target (positive = breaching, negative = headroom)
        -- Stored as percentage: ((value - target) / target) * 100
        deviation_pct NUMERIC(10,4),

        -- Optional tenant scoping (NULL = platform-level measurement)
        tenant_id     UUID,

        -- When the measurement was taken
        sampled_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // Time-series primary access pattern: SLO + window
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_slo_measurements_window
        ON slo_measurements (slo_id, sampled_at DESC)
    `);

    // Breach-only index for burn rate queries (much smaller scan)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_slo_measurements_breach
        ON slo_measurements (slo_id, sampled_at DESC)
        WHERE is_breach = TRUE
    `);

    // Tenant-scoped analysis
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_slo_measurements_tenant
        ON slo_measurements (tenant_id, slo_id, sampled_at DESC)
        WHERE tenant_id IS NOT NULL
    `);

    // ── error_budget_snapshots ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS error_budget_snapshots (
        id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        slo_id          VARCHAR(80)   NOT NULL,

        -- Window the snapshot covers: '1h' | '6h' | '24h' | '7d' | '30d'
        window_label    VARCHAR(10)   NOT NULL,

        -- Budget math
        -- Total allowed error minutes in this window
        budget_total_min   NUMERIC(12,4) NOT NULL,
        -- Actual error minutes consumed
        budget_used_min    NUMERIC(12,4) NOT NULL,
        -- Remaining budget (total - used)
        budget_remaining_min NUMERIC(12,4) NOT NULL,
        -- 0.0 to 1.0 — fraction consumed
        budget_consumed_pct NUMERIC(6,4) NOT NULL,

        -- Burn rates
        -- Current window burn rate (1.0 = exactly on pace to exhaust budget)
        burn_rate        NUMERIC(8,4) NOT NULL DEFAULT 1.0,
        -- Fast-burn threshold for this SLO+window (pre-computed for quick comparison)
        fast_burn_threshold NUMERIC(8,4) NOT NULL,
        slow_burn_threshold NUMERIC(8,4) NOT NULL,

        -- Breach classification
        is_fast_burn     BOOLEAN       NOT NULL DEFAULT FALSE,
        is_slow_burn     BOOLEAN       NOT NULL DEFAULT FALSE,

        -- Forecast
        -- Estimated minutes until budget exhaustion at current burn rate
        -- NULL = not burning (budget growing)
        forecast_exhaustion_min INTEGER,

        -- Trend direction based on comparing current vs previous window
        -- 'improving' | 'degrading' | 'stable'
        trend_direction  VARCHAR(12)   NOT NULL DEFAULT 'stable',

        snapped_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_budget_snapshot_lookup
        ON error_budget_snapshots (slo_id, window_label, snapped_at DESC)
    `);

    // Latest snapshot per SLO+window for dashboard fast reads
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_budget_snapshot_latest
        ON error_budget_snapshots (slo_id, window_label, snapped_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS error_budget_snapshots`);
    await queryRunner.query(`DROP TABLE IF EXISTS slo_measurements`);
  }
}
