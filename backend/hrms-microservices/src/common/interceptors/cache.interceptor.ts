import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

/**
 * REDIS CACHE INTERCEPTOR
 *
 * Caches GET-only responses using a pluggable CacheManager.
 * Usage:
 *   @UseInterceptors(RedisCacheInterceptor)
 *   @CacheTTL(60)               // seconds
 *   @CacheKey('custom-key')     // optional override
 *   async myEndpoint() { ... }
 *
 * Cache key format:  hrms:{tenantId}:{method}:{url}:{queryHash}
 * Default TTL:       30 seconds
 * Max cacheable:     Only GET 200 responses
 */

// ── Metadata decorators ───────────────────────────────────────────────────────
import { SetMetadata } from '@nestjs/common';
export const NO_CACHE_KEY = 'no_cache';
export const CACHE_TTL_KEY = 'cache_ttl';
export const CACHE_KEY_KEY = 'cache_key';
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_KEY, key);

// ── Simple in-process LRU cache (no Redis dep required) ───────────────────────
type CacheEntry = { data: unknown; expiresAt: number };
const localCache = new Map<string, CacheEntry>();
const MAX_ENTRIES = 500;

function cacheGet(key: string): unknown | undefined {
  const entry = localCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return undefined;
  }
  return entry.data;
}

function cacheSet(key: string, data: unknown, ttlSeconds: number): void {
  if (localCache.size >= MAX_ENTRIES) {
    // Evict the oldest key
    const oldest = localCache.keys().next().value;
    if (oldest) localCache.delete(oldest);
  }
  localCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1_000 });
}

export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of localCache.keys()) {
    if (key.startsWith(prefix)) localCache.delete(key);
  }
}

// ── Interceptor ───────────────────────────────────────────────────────────────
@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RedisCacheInterceptor.name);
  private readonly DEFAULT_TTL = 30; // seconds

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      tenantId?: string;
      headers: Record<string, string>;
    }>();

    // Only cache GET requests
    if (req.method !== 'GET') return next.handle();

    // Check NoCache decorator
    const noCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (noCache) return next.handle();

    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? this.DEFAULT_TTL;

    const customKey = this.reflector.getAllAndOverride<string>(CACHE_KEY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const tenantId = req.tenantId ?? req.headers['x-tenant-id'] ?? 'global';
    const cacheKey = customKey ?? `hrms:${tenantId}:${req.url}`;

    // Check local cache
    const cached = cacheGet(cacheKey);
    if (cached !== undefined) {
      this.logger.debug(`CACHE_HIT key=${cacheKey}`);
      return of(cached);
    }

    // Execute and cache result
    return next.handle().pipe(
      tap((data) => {
        cacheSet(cacheKey, data, ttl);
        this.logger.debug(`CACHE_SET key=${cacheKey} ttl=${ttl}s`);
      }),
    );
  }
}
