import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../redis/redis.service';

export enum MeteredMetric {
  AI_TOKENS = 'AI_TOKENS',
  MARKETPLACE_HIRES = 'MARKETPLACE_HIRES',
  WHATSAPP_MESSAGES = 'WHATSAPP_MESSAGES',
  API_CALLS = 'API_CALLS',
}

@Injectable()
export class UsageMeteringService {
  private readonly logger = new Logger(UsageMeteringService.name);

  constructor(
    private readonly redis: RedisService,
  ) {}

  /**
   * Records usage for a specific metric and tenant.
   * Uses Redis for high-frequency performance, then persists periodically.
   */
  async recordUsage(tenantId: string, metric: MeteredMetric, amount: number) {
    this.logger.debug(`Metering usage for tenant=${tenantId}: ${metric} +${amount}`);
    
    const key = `meter:${tenantId}:${metric}`;
    await this.redis.incrby(key, amount);

    // Track total usage for the current billing cycle
    const cycleKey = `cycle_usage:${tenantId}:${new Date().toISOString().slice(0, 7)}`;
    await this.redis.hincrby(cycleKey, metric, amount);
  }

  /**
   * Retrieves usage for a tenant in the current billing cycle.
   */
  async getTenantUsage(tenantId: string) {
    const cycleKey = `cycle_usage:${tenantId}:${new Date().toISOString().slice(0, 7)}`;
    return await this.redis.hgetall(cycleKey);
  }

  /**
   * Enforces feature gating based on usage limits.
   * "Fully Autonomous" guard.
   */
  async checkQuota(tenantId: string, metric: MeteredMetric, limit: number): Promise<boolean> {
    const usage = await this.getTenantUsage(tenantId);
    const current = parseInt(usage[metric] || '0');
    return current < limit;
  }
}
