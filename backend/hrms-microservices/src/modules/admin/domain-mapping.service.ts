import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class DomainMappingService {
  private readonly logger = new Logger(DomainMappingService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Maps a custom domain to a tenant ID.
   * "Ultra Master" White-Labeling.
   */
  async mapCustomDomain(tenantId: string, customDomain: string) {
    this.logger.log(`Mapping custom domain ${customDomain} to tenant=${tenantId}`);

    // 1. Validation (Ensures domain is properly formatted)
    if (!this.isValidDomain(customDomain)) {
      throw new BadRequestException('Invalid domain format');
    }

    // 2. Persist in Redis for high-speed middleware lookup
    const key = `domain_mapping:${customDomain}`;
    await this.redis.set(key, tenantId);

    // 3. Persist reverse lookup
    const reverseKey = `tenant_domain:${tenantId}`;
    await this.redis.set(reverseKey, customDomain);

    this.logger.debug(`Domain mapping successful for ${customDomain}`);
  }

  /**
   * Middleware lookup to resolve tenant context from host.
   */
  async resolveTenantFromDomain(host: string): Promise<string | null> {
    const key = `domain_mapping:${host}`;
    return await this.redis.get(key);
  }

  private isValidDomain(domain: string): boolean {
    const regex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
    return regex.test(domain);
  }
}
