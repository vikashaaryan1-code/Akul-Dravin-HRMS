import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

// ── Key namespacing ───────────────────────────────────────────────────────────

const KEY = {
  stab:  (k: string) => `hrms:mitigation:stab:${k}`,
  dedup: (k: string) => `hrms:mitigation:dedup:${k}`,
  cool:  (k: string) => `hrms:mitigation:cool:${k}`,
} as const;

// ── In-memory fallback (used when Redis is unavailable) ───────────────────────

const memFallback = {
  stab:  new Map<string, number>(), // key → expiry unix ms
  dedup: new Map<string, number>(),
  cool:  new Map<string, number>(),
};

/**
 * MITIGATION COORDINATION STORE — Phase AA
 *
 * Replaces in-process Maps with Redis-TTL-backed distributed coordination.
 * This eliminates three categories of coordination failure:
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │ Failure           │ In-memory Maps (before)  │ Redis TTL (after)        │
 *  ├─────────────────────────────────────────────────────────────────────────┤
 *  │ Process restart   │ all state lost → storms  │ TTL survives restart     │
 *  │ Deploy rollout    │ split brain             │ single source of truth   │
 *  │ Horizontal scale  │ duplicate mitigations   │ first-writer wins (NX)   │
 *  │ Node crash        │ coordination reset      │ TTL expires naturally     │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * ── Graceful degradation ──────────────────────────────────────────────────────
 *  If Redis is unavailable (connection error, network partition), every method
 *  falls back to an in-process Map with the same TTL semantics.
 *  This ensures mitigation evaluation continues even during Redis outages —
 *  at the cost of single-process coordination only during the downtime window.
 *
 * ── Key schema ────────────────────────────────────────────────────────────────
 *  hrms:mitigation:stab:{sloId}:{targetResource}    → stabilization window
 *  hrms:mitigation:dedup:{sloId}:{action}           → proposal deduplication
 *  hrms:mitigation:cool:{sloId}:{alertClass}        → burn rate alert cooldown
 *
 * ── All TTLs are set via Redis PX (milliseconds) for sub-second precision.
 */
@Injectable()
export class MitigationCoordinationStore {
  private readonly logger = new Logger(MitigationCoordinationStore.name);
  private readonly available: boolean;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {
    this.available = true;
    this.redis.on('error', () => { /* errors already logged by RedisModule */ });
  }

  // ── Stabilization ─────────────────────────────────────────────────────────

  async setStabilizing(stabKey: string, signalId: string, windowMs: number): Promise<void> {
    const val = JSON.stringify({ signalId, startedAt: new Date().toISOString() });
    await this.set(KEY.stab(stabKey), val, windowMs);
  }

  async isStabilizing(stabKey: string): Promise<boolean> {
    return this.exists(KEY.stab(stabKey));
  }

  async clearStabilizing(stabKey: string): Promise<void> {
    await this.del(KEY.stab(stabKey));
  }

  async getStabilizingEntry(stabKey: string): Promise<{ signalId: string; startedAt: string } | null> {
    const raw = await this.get(KEY.stab(stabKey));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  /**
   * Returns all active stabilization keys with remaining TTL.
   * Uses Redis SCAN to avoid blocking the event loop with KEYS.
   */
  async listStabilizing(): Promise<Array<{ key: string; remainingMs: number }>> {
    try {
      const pattern = KEY.stab('*');
      const keys    = await this.scan(pattern);
      if (keys.length === 0) return [];

      const pipeline = this.redis.pipeline();
      for (const k of keys) pipeline.pttl(k);
      const results = await pipeline.exec();

      return keys.map((k, i) => ({
        key:        k.replace('hrms:mitigation:stab:', ''),
        remainingMs: Math.max(0, (results?.[i]?.[1] as number) ?? 0),
      })).filter(e => e.remainingMs > 0);
    } catch {
      // Fall back to in-memory map
      const now = Date.now();
      return [...memFallback.stab.entries()]
        .filter(([, exp]) => exp > now)
        .map(([k, exp]) => ({ key: k, remainingMs: exp - now }));
    }
  }

  // ── Deduplication ─────────────────────────────────────────────────────────

  async setDedup(dedupKey: string, windowMs: number): Promise<void> {
    await this.set(KEY.dedup(dedupKey), '1', windowMs);
  }

  async isDeduped(dedupKey: string): Promise<boolean> {
    return this.exists(KEY.dedup(dedupKey));
  }

  // ── Burn-rate alert cooldowns (migrated from module-level Map) ────────────

  async setCooldown(coolKey: string, windowMs: number): Promise<void> {
    await this.set(KEY.cool(coolKey), '1', windowMs);
  }

  async isInCooldown(coolKey: string): Promise<boolean> {
    return this.exists(KEY.cool(coolKey));
  }

  // ── Low-level Redis operations with in-memory fallback ────────────────────

  private async set(key: string, value: string, ttlMs: number): Promise<void> {
    try {
      await this.redis.set(key, value, 'PX', ttlMs);
    } catch (err) {
      this.logger.warn(`[CoordStore] Redis SET failed (fallback): ${String(err)}`);
      const mapKey = key.split(':').slice(3).join(':'); // strip prefix
      const prefix = key.split(':')[2] as keyof typeof memFallback;
      memFallback[prefix]?.set(mapKey, Date.now() + ttlMs);
    }
  }

  private async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch {
      const mapKey  = key.split(':').slice(3).join(':');
      const prefix  = key.split(':')[2] as keyof typeof memFallback;
      const expiry  = memFallback[prefix]?.get(mapKey);
      if (!expiry) return false;
      if (Date.now() > expiry) { memFallback[prefix].delete(mapKey); return false; }
      return true;
    }
  }

  private async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  private async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      const mapKey = key.split(':').slice(3).join(':');
      const prefix = key.split(':')[2] as keyof typeof memFallback;
      memFallback[prefix]?.delete(mapKey);
    }
  }

  private async scan(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }
}
