import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

/**
 * RedisService — thin wrapper around redis client.
 * Gracefully degrades when Redis is unavailable.
 * Set REDIS_URL or REDIS_HOST/REDIS_PORT environment variables.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private _isAvailable = false;

  get isAvailable(): boolean { return this._isAvailable; }

  async onModuleInit() {
    const url = process.env.REDIS_URL
      ?? `redis://${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? '6379'}`;

    try {
      this.client = createClient({ url }) as RedisClientType;
      this.client.on('error', (err: any) => this.logger.warn(`Redis error: ${String(err)}`));
      this.client.on('reconnecting', () => this.logger.debug('Redis reconnecting...'));
      this.client.on('ready', () => { this._isAvailable = true; this.logger.log('Redis connected'); });
      await this.client.connect();
      this._isAvailable = true;
    } catch (err) {
      this.logger.warn(`Redis unavailable — running without Redis. Brute-force protection and rate limits degraded. Error: ${String(err)}`);
      this.client = null;
      this._isAvailable = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  // ── Safe wrappers ─────────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try { return await this.client.get(key); } catch { return null; }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      ttlSeconds
        ? await this.client.set(key, value, { EX: ttlSeconds })
        : await this.client.set(key, value);
    } catch {}
  }

  async setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try { await this.client.del(key); } catch {}
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 1;
    try { return await this.client.incr(key); } catch { return 1; }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    try { await this.client.expire(key, ttlSeconds); } catch {}
  }

  async hSet(key: string, field: string, value: string): Promise<void> {
    if (!this.client) return;
    try { await this.client.hSet(key, field, value); } catch {}
  }

  async hGet(key: string, field: string): Promise<string | undefined> {
    if (!this.client) return undefined;
    try { return (await this.client.hGet(key, field)) ?? undefined; } catch { return undefined; }
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    if (!this.client) return {};
    try { return (await this.client.hGetAll(key)) ?? {}; } catch { return {}; }
  }

  async incrby(key: string, amount: number): Promise<number> {
    if (!this.client) return amount;
    try { return await this.client.incrBy(key, amount); } catch { return amount; }
  }

  async hincrby(key: string, field: string, amount: number): Promise<number> {
    if (!this.client) return amount;
    try { return await this.client.hIncrBy(key, field, amount); } catch { return amount; }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.hGetAll(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) return [];
    try { return await this.client.keys(pattern); } catch { return []; }
  }

  async flushKeyPattern(pattern: string): Promise<void> {
    const matched = await this.keys(pattern);
    await Promise.all(matched.map(k => this.del(k)));
  }
}
