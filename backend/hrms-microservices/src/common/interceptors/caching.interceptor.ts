import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class UniversalCachingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UniversalCachingInterceptor.name);

  constructor(private readonly redis: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const tenantId = request.user?.tenantId || 'global';
    const cacheKey = `cache:${tenantId}:${request.url}`;

    // 1. Check Redis Cache
    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      this.logger.debug(`CACHE_HIT: ${cacheKey}`);
      return of(JSON.parse(cachedData));
    }

    // 2. Fetch and Cache
    return next.handle().pipe(
      tap(async (response) => {
        if (response) {
          this.logger.debug(`CACHE_MISS: ${cacheKey}. Persisting for 300s.`);
          await this.redis.set(cacheKey, JSON.stringify(response), 300); // 5 min TTL
        }
      }),
    );
  }

  /**
   * Helper to invalidate cache for a specific tenant/module.
   * "Fully Autonomous" cache management.
   */
  async invalidateTenantCache(tenantId: string) {
    this.logger.log(`Invalidating cache for tenant=${tenantId}`);
    const keys = await this.redis.keys(`cache:${tenantId}:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => this.redis.del(key)));
    }
  }
}
