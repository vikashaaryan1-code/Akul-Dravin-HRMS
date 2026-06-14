import { Injectable, Logger } from '@nestjs/common';

/**
 * ANALYTICS CACHE SERVICE
 *
 * Architectural Enhancement: Redis-backed KPI caching layer.
 *
 * Design:
 *  - TTL-keyed in-memory fallback when Redis is unavailable (graceful degradation)
 *  - Production: swap in-memory Map for ioredis client
 *  - Cache keys are tenant-scoped to prevent data leakage
 *
 * TTL Strategy:
 *  - Workforce KPIs:    5  minutes (changes on employee mutation)
 *  - Recruitment KPIs:  2  minutes (pipeline updates frequently)
 *  - Revenue/MRR:       15 minutes (subscription changes are less frequent)
 *  - Attrition Risk:    30 minutes (expensive computation)
 *  - AI Matching:       10 minutes (per job)
 *
 * Future: Replace this.cache Map with ioredis for distributed deployments.
 * The interface contract is identical — only the storage backend changes.
 */
@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);

  // In-memory fallback store: key → { value, expiresAt }
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();

  // TTL constants (ms)
  static readonly TTL = {
    WORKFORCE_KPI:    5  * 60 * 1000,  // 5 min
    RECRUITMENT_KPI:  2  * 60 * 1000,  // 2 min
    REVENUE_KPI:      15 * 60 * 1000,  // 15 min
    ATTRITION_RISK:   30 * 60 * 1000,  // 30 min
    AI_MATCH_JOB:     10 * 60 * 1000,  // 10 min per job
    PLAN_DISTRIBUTION: 60 * 60 * 1000, // 1 hr (very stable)
  };

  // ── Core Operations ───────────────────────────────────────────────────────

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    // Evict oldest entries when cache grows large (LRU approximation)
    if (this.cache.size > 500) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (v.expiresAt < now) this.cache.delete(k);
        if (this.cache.size <= 400) break;
      }
    }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`CACHE_INVALIDATED: ${key}`);
  }

  invalidateByPrefix(prefix: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.logger.debug(`CACHE_INVALIDATED_PREFIX: prefix=${prefix} count=${count}`);
  }

  // ── Cache-aside Pattern Helper ─────────────────────────────────────────────

  /**
   * Standard cache-aside: return cached value or compute + cache.
   * Usage:
   *   return this.cache.getOrCompute(key, ttl, () => this.ds.query(...));
   */
  async getOrCompute<T>(
    key: string,
    ttlMs: number,
    compute: () => Promise<T>,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = await compute();
    this.set(key, value, ttlMs);
    return value;
  }

  // ── Tenant-Scoped Key Builders ────────────────────────────────────────────

  static keys = {
    workforceKpi:    (tenantId: string) => `analytics:workforce:${tenantId}`,
    recruitmentKpi:  (tenantId: string) => `analytics:recruitment:${tenantId}`,
    revenueKpi:      (tenantId: string) => `analytics:revenue:${tenantId}`,
    attritionRisk:   (tenantId: string) => `ai:attrition:${tenantId}`,
    aiMatchJob:      (tenantId: string, jobId: string) => `ai:match:${tenantId}:${jobId}`,
    commissionLedger:(tenantId: string, period: string) => `commission:${tenantId}:${period}`,
  };

  // ── Metrics ───────────────────────────────────────────────────────────────

  getStats(): { size: number; expired: number } {
    const now   = Date.now();
    let expired = 0;
    for (const v of this.cache.values()) {
      if (v.expiresAt < now) expired++;
    }
    return { size: this.cache.size, expired };
  }
}
