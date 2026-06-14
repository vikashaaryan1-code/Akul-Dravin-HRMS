import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { randomBytes } from 'node:crypto';

export interface LockHandle {
  /** Release the lock. Safe to call even if the lock has already expired. */
  release: () => Promise<void>;
  /** The unique token used to hold this lock. */
  token: string;
}

/**
 * RedlockService — distributed mutual exclusion via Redis SET NX PX.
 *
 * Design:
 * - Uses the existing `REDIS_CLIENT` (ioredis) — zero new packages.
 * - Atomic acquire via `SET key token NX PX ttlMs`.
 * - Atomic release via Lua CAS — only the lock holder can release.
 * - Never throws on release failure — logs and continues.
 *
 * Usage:
 *   const lock = await redlockService.acquireLock('payroll:batch:tenant-x', 30_000);
 *   try {
 *     await doWork();
 *   } finally {
 *     await lock.release();
 *   }
 *
 * Limitations:
 * - Single-node Redis only (no Redlock quorum). Acceptable for Phase 9A.
 * - If Redis is unavailable, `acquireLock` throws — callers must handle.
 *   For payroll enqueue this means the HTTP handler gets a 503, which is correct.
 */
@Injectable()
export class RedlockService {
  private readonly logger = new Logger(RedlockService.name);

  // Lua script: delete key only if value matches token (atomic CAS release)
  private static readonly RELEASE_SCRIPT = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  /**
   * Attempt to acquire a lock. Returns a LockHandle on success.
   * Throws if the lock is already held or Redis is unreachable.
   *
   * @param key    Unique lock identifier (e.g. `payroll:batch:tenant-x:2026-09`)
   * @param ttlMs  Lock TTL in milliseconds. Should exceed worst-case job duration.
   */
  async acquireLock(key: string, ttlMs: number): Promise<LockHandle> {
    const token = randomBytes(16).toString('hex');
    const result = await this.redis.set(key, token, 'PX', ttlMs, 'NX');

    if (result !== 'OK') {
      throw new Error(
        `RedlockService: Failed to acquire lock "${key}" — already held. ` +
        `This indicates a concurrent operation for the same resource.`,
      );
    }

    this.logger.debug(`Lock acquired: key="${key}" token=${token} ttlMs=${ttlMs}`);

    const release = async (): Promise<void> => {
      try {
        const deleted = await this.redis.eval(
          RedlockService.RELEASE_SCRIPT,
          1,       // numkeys
          key,     // KEYS[1]
          token,   // ARGV[1]
        ) as number;
        if (deleted === 0) {
          // Lock expired before explicit release — this is acceptable; log it.
          this.logger.warn(
            `RedlockService: Lock "${key}" expired before release (TTL too short or job ran long).`,
          );
        } else {
          this.logger.debug(`Lock released: key="${key}"`);
        }
      } catch (err: unknown) {
        // Release must never throw — log and continue
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`RedlockService: Failed to release lock "${key}": ${msg}`);
      }
    };

    return { token, release };
  }

  /**
   * Convenience wrapper: acquire → execute callback → release.
   * Guarantees `release()` is called even if `fn` throws.
   */
  async withLock<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const lock = await this.acquireLock(key, ttlMs);
    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }
}
