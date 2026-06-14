import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { DeadLetterRecord, QueueJobEnvelope } from './queue-job.types';
import { QueueName } from './queue-names';

/**
 * DEAD LETTER SERVICE
 *
 * Platform-wide DLQ (Dead Letter Queue) management.
 *
 * ── Responsibilities ─────────────────────────────────────────────────────────
 *  1. Idempotency key management — Redis SET NX for exactly-once processing.
 *  2. Record dead letters — persists failed jobs to `queue_dead_letters` table.
 *  3. Admin query — retrieve dead letters by queue/tenant for monitoring.
 *  4. Replay — re-enqueues a dead letter (requires InjectQueue at call site).
 *
 * ── Idempotency contract ──────────────────────────────────────────────────────
 *  checkIdempotency(key, ttl):
 *    - Returns true if key exists in Redis → job is a duplicate, skip it.
 *    - Returns false if key is new → marks key in Redis, allow processing.
 *    - Gracefully degrades if Redis is down → returns false (allow processing,
 *      accepting the risk of rare duplicates during Redis outages).
 */
@Injectable()
export class DeadLetterService {
  private readonly logger = new Logger(DeadLetterService.name);
  private readonly IDEMPOTENCY_KEY_PREFIX = 'queue:idem:';

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly redis: RedisService,
  ) {}

  // ── Idempotency ───────────────────────────────────────────────────────────

  /**
   * Checks and marks an idempotency key atomically.
   *
   * @returns true  — key already existed → this is a duplicate, skip.
   * @returns false — key was new → mark it, proceed with processing.
   */
  async checkIdempotency(key: string, ttlSeconds: number): Promise<boolean> {
    const redisKey = `${this.IDEMPOTENCY_KEY_PREFIX}${key}`;
    try {
      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        // First time seeing this key — set expiry
        await this.redis.expire(redisKey, ttlSeconds);
        return false; // not a duplicate
      }
      return true; // duplicate — count > 1
    } catch {
      // Redis unavailable — allow processing (graceful degradation)
      this.logger.warn(`[DeadLetterService] Redis unavailable for idempotency check key=${key}. Allowing processing.`);
      return false;
    }
  }

  /** Explicitly mark an idempotency key (e.g., after successful completion). */
  async markProcessed(key: string, ttlSeconds: number): Promise<void> {
    const redisKey = `${this.IDEMPOTENCY_KEY_PREFIX}${key}`;
    try {
      await this.redis.set(redisKey, '1', ttlSeconds);
    } catch {
      // Non-fatal
    }
  }

  // ── Dead Letter Recording ─────────────────────────────────────────────────

  /**
   * Records a job failure in the `queue_dead_letters` table.
   * Called by BaseQueueProcessor on final retry attempt.
   */
  async record(rec: DeadLetterRecord): Promise<void> {
    try {
      await this.ds.query(
        `INSERT INTO queue_dead_letters
           (queue_name, job_name, tenant_id, idempotency_key, payload,
            error_message, stack_trace, attempts, first_failed_at, last_failed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
         ON CONFLICT (idempotency_key) DO UPDATE SET
           attempts       = queue_dead_letters.attempts + 1,
           error_message  = EXCLUDED.error_message,
           stack_trace    = EXCLUDED.stack_trace,
           last_failed_at = NOW()`,
        [
          rec.queueName, rec.jobName, rec.tenantId, rec.idempotencyKey,
          JSON.stringify(rec.payload), rec.errorMessage,
          rec.stackTrace ?? null, rec.attempts,
        ],
      );
      this.logger.warn(
        `[DLQ] Recorded: queue=${rec.queueName} job=${rec.jobName} tenant=${rec.tenantId} key=${rec.idempotencyKey}`,
      );
    } catch (err) {
      // DLQ write failure is logged but never propagated
      this.logger.error(`[DLQ] Failed to record dead letter: ${String(err)}`);
    }
  }

  // ── Admin Queries ─────────────────────────────────────────────────────────

  async getDeadLetters(options: {
    queueName?: QueueName;
    tenantId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const args: unknown[] = [];
    const conditions: string[] = [];

    if (options.queueName) {
      args.push(options.queueName);
      conditions.push(`queue_name = $${args.length}`);
    }
    if (options.tenantId) {
      args.push(options.tenantId);
      conditions.push(`tenant_id = $${args.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit  = options.limit  ?? 50;
    const offset = options.offset ?? 0;

    const [data, countRows] = await Promise.all([
      this.ds.query(
        `SELECT * FROM queue_dead_letters ${where} ORDER BY last_failed_at DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
        [...args, limit, offset],
      ),
      this.ds.query(`SELECT COUNT(*) AS total FROM queue_dead_letters ${where}`, args),
    ]);

    return { data, total: parseInt(countRows[0]?.total ?? '0', 10) };
  }

  async getDeadLetter(id: string): Promise<any | null> {
    const [row] = await this.ds.query(`SELECT * FROM queue_dead_letters WHERE id = $1`, [id]);
    return row ?? null;
  }

  // ── Replay ───────────────────────────────────────────────────────────────

  /**
   * Marks a dead letter as replayed and returns its payload.
   * Caller is responsible for re-enqueueing the job.
   */
  async markReplayed(id: string): Promise<QueueJobEnvelope<unknown> | null> {
    const row = await this.getDeadLetter(id);
    if (!row) return null;

    await this.ds.query(
      `UPDATE queue_dead_letters SET replayed_at = NOW() WHERE id = $1`,
      [id],
    );

    this.logger.log(`[DLQ] Marked replayed: id=${id} queue=${row.queue_name}`);
    return row.payload as QueueJobEnvelope<unknown>;
  }
}
