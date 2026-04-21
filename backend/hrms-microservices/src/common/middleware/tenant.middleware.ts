import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant-context';
import { SettingsService } from '../settings/settings.service';

/**
 * TENANT MIDDLEWARE - THE ISOLATION GATEKEEPER
 * 
 * Responsibilities:
 * 1. Identify tenant from JWT context.
 * 2. Resolve validated, typed policy settings.
 * 3. Inject both into a strictly scoped execution context.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly settingsService: SettingsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Exclude public/auth routes from strict isolation checks
    if (req.path.includes('/auth/') || req.path === '/') {
      return next();
    }

    const user = (req as any).user;
    const tenantId = user?.tenantId;
    
    if (!tenantId) {
      throw new BadRequestException('Security Isolation Violation: Active tenant ID missing from request context.');
    }

    try {
      // 1. Deterministic Settings Resolution (Cache-backed)
      const settings = await this.settingsService.resolveSettings(tenantId);

      // 2. Scoped Execution Runner
      // This ensures that the entire request lifecycle (Controllers, Services, Ledger)
      // runs within a hermetically sealed context.
      await TenantContext.runScoped(tenantId, settings, () => {
        return next();
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      
      console.error(`CRITICAL: Tenant Isolation Setup Failed [Tenant: ${tenantId}]:`, error);
      throw new BadRequestException('Context Failure: System could not initialize secure isolation for this request.');
    }
  }
}
