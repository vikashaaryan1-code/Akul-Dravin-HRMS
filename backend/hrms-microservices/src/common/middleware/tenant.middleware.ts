import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant-context';
import { SettingsService } from '../settings/settings.service';

/**
 * TENANT MIDDLEWARE — THE ISOLATION GATEKEEPER
 *
 * Responsibilities:
 *   1. Identify tenant from JWT-populated request context (set by AuthContextMiddleware).
 *   2. Resolve validated, cached tenant policy settings via SettingsService.
 *   3. Wrap the remainder of the request in a hermetically sealed TenantContext.runScoped().
 *
 * Exclusion rules:
 *   - Public routes: exact path prefix match on /api/v1/auth/ to avoid over-broad exclusion.
 *   - Health/metrics: /api/v1/health and /metrics are excluded (no user context needed).
 *   - Root: / (API gateway health check).
 *
 * Error handling:
 *   - Missing tenantId → 401 Unauthorized (not 400 — it is an auth boundary violation).
 *   - Context setup failure → 503 Service Unavailable with correlation ID.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  /** Route prefixes that bypass tenant isolation — public or system endpoints. */
  private static readonly PUBLIC_PREFIXES = [
    '/api/v1/auth/',
    '/api/v1/health',
    '/api/v1/public/',
    '/metrics',
    '/favicon.ico',
  ] as const;

  constructor(private readonly settingsService: SettingsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;

    // Exact prefix match — avoids the too-broad path.includes('/auth/') pattern
    // which would also bypass e.g. /api/v1/candidate-profiles/auth-verify
    const isPublic =
      path === '/' ||
      TenantMiddleware.PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix));

    if (isPublic) {
      return next();
    }

    const user = (req as any).user;
    const tenantId: string | undefined = user?.tenantId;

    if (!tenantId) {
      // Return 401 — absence of tenantId is an authentication gap, not a bad request
      res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Tenant context is missing from request. Ensure a valid JWT is provided.',
        correlationId: (req.headers['x-correlation-id'] as string) ?? null,
      });
      return;
    }

    try {
      const settings = await this.settingsService.resolveSettings(tenantId);

      await TenantContext.runScoped(
        tenantId,
        settings,
        { epochHash: 'LEGACY_UNANCHORED', confidence: 0, residualRisk: 'UNGOVERNED_EXECUTION' },
        () => {
          return next();
        },
      );
    } catch (error) {
      const correlationId = (req.headers['x-correlation-id'] as string) ?? 'none';
      this.logger.error(
        `Tenant isolation failure [tenant=${tenantId}] [correlationId=${correlationId}]: ${error}`,
      );
      res.status(503).json({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Failed to initialize tenant context. Please retry.',
        correlationId,
      });
    }
  }
}
