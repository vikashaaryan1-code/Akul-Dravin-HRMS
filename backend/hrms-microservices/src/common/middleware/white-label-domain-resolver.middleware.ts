import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WhiteLabelBrandingService } from '../../modules/white-label/white-label-branding.service';

/**
 * WHITE LABEL DOMAIN RESOLVER MIDDLEWARE
 *
 * PRD §12.2 — Custom Domain Routing:
 *   Inspects every incoming request's Host header.
 *   If the hostname is a registered custom domain, resolves the tenantId
 *   and injects it into the request object for downstream use.
 *
 * Placement: applied globally before JwtAuthGuard so that tenant context
 * is available during token validation.
 *
 * Performance: domain→tenant lookup is cached with 5-minute TTL in
 * WhiteLabelBrandingService — no DB hit on subsequent requests from the same domain.
 */
@Injectable()
export class WhiteLabelDomainResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WhiteLabelDomainResolverMiddleware.name);

  // Known platform domains — skip reverse-lookup for these
  private readonly PLATFORM_DOMAINS = new Set([
    'localhost',
    '127.0.0.1',
    'app.akulhrms.com',
    'api.akulhrms.com',
    'staging.akulhrms.com',
  ]);

  constructor(
    private readonly brandingService: WhiteLabelBrandingService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const host = req.hostname?.toLowerCase().replace(/^www\./, '') ?? '';

      // Skip for platform-owned domains
      if (!host || this.PLATFORM_DOMAINS.has(host) || host.endsWith('.akulhrms.com')) {
        return next();
      }

      const tenantId = await this.brandingService.resolveTenantIdFromDomain(host);
      if (tenantId) {
        // Inject into request for use by guards and controllers
        (req as any).whitelabelTenantId = tenantId;
        this.logger.debug(`DOMAIN_MIDDLEWARE: host=${host} → tenantId=${tenantId}`);
      }
    } catch {
      // Non-fatal — fallback to JWT-embedded tenantId
    }

    next();
  }
}
