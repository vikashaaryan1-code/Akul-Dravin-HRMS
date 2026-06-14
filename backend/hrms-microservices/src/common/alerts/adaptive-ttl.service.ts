import { Injectable, Logger } from '@nestjs/common';

export interface AdaptiveTTLEntry {
  resourceKey:      string;
  avgLifecycleMs:   number;
  adaptedTtlMs:     number;
  observationCount: number;
}

export interface AdaptiveTTLReport {
  entries:      AdaptiveTTLEntry[];
  defaultTtlMs: number;
}

/**
 * ADAPTIVE TTL SERVICE — Phase AT-4
 *
 * Computes per-resource reservation TTLs from observed signal lifecycle
 * durations. Slow-resolving resources get proportionally longer leases.
 *
 * ── Formula ───────────────────────────────────────────────────────────────────
 *
 *  TTL = clamp(avgLifecycleMs × 1.5, 5min, 45min)
 *
 *  avgLifecycleMs = EMA of observed durations (α = 0.15)
 *
 * ── Calibration constants ─────────────────────────────────────────────────────
 *
 *  LEASE_MULTIPLIER = 1.5  — 50% headroom above observed avg for deferral delay
 *  MIN_TTL = 5 min         — must survive at least one scheduler tick
 *  MAX_TTL = 45 min        — cap against pathologically slow resources
 *  EMA_ALPHA = 0.15        — moderate adaptation; single outlier shifts by 15%
 *  MIN_SAMPLES = 3         — bootstrap floor; DEFAULT_TTL until 3 observations
 *
 * ── Recording ────────────────────────────────────────────────────────────────
 *
 *  Call `recordLifecycle(resourceKey, durationMs)` from MitigationSignalService
 *  when a signal reaches RESOLVED or ROLLED_BACK.
 */
@Injectable()
export class AdaptiveTTLService {
  private readonly logger          = new Logger(AdaptiveTTLService.name);
  private readonly avgMs           = new Map<string, number>(); // EMA
  private readonly counts          = new Map<string, number>();
  private readonly EMA_ALPHA       = 0.15;
  private readonly LEASE_MULTIPLIER = 1.5;
  readonly DEFAULT_TTL_MS          = 15 * 60 * 1000;
  private readonly MIN_TTL_MS      = 5  * 60 * 1000;
  private readonly MAX_TTL_MS      = 45 * 60 * 1000;
  private readonly MIN_SAMPLES     = 3;

  recordLifecycle(resourceKey: string, durationMs: number): void {
    const current = this.avgMs.get(resourceKey);
    const updated = current === undefined
      ? durationMs
      : (1 - this.EMA_ALPHA) * current + this.EMA_ALPHA * durationMs;
    this.avgMs.set(resourceKey, updated);
    this.counts.set(resourceKey, (this.counts.get(resourceKey) ?? 0) + 1);
    this.logger.debug(
      `[AdaptiveTTL] ${resourceKey}: avg=${Math.round(updated / 60000)}m → TTL=${Math.round(this.computeTTL(updated) / 60000)}m`,
    );
  }

  getTTL(resourceKey: string): number {
    if ((this.counts.get(resourceKey) ?? 0) < this.MIN_SAMPLES) return this.DEFAULT_TTL_MS;
    const avg = this.avgMs.get(resourceKey);
    return avg !== undefined ? this.computeTTL(avg) : this.DEFAULT_TTL_MS;
  }

  getAvgLifecycleMs(resourceKey: string): number | null {
    return (this.counts.get(resourceKey) ?? 0) === 0 ? null : (this.avgMs.get(resourceKey) ?? null);
  }

  getReport(): AdaptiveTTLReport {
    const entries = [...this.avgMs.entries()].map(([key, avg]) => ({
      resourceKey:      key,
      avgLifecycleMs:   Math.round(avg),
      adaptedTtlMs:     this.computeTTL(avg),
      observationCount: this.counts.get(key) ?? 0,
    }));
    return { entries, defaultTtlMs: this.DEFAULT_TTL_MS };
  }

  private computeTTL(avgMs: number): number {
    return Math.max(this.MIN_TTL_MS, Math.min(this.MAX_TTL_MS, Math.round(avgMs * this.LEASE_MULTIPLIER)));
  }
}
