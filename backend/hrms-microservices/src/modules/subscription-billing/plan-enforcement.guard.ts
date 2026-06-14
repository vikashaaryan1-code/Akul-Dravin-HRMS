import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PlanEnforcementService } from './plan-enforcement.service';
import { PlanFeature } from './plan-catalog';

// ─────────────────────────────────────────────────────────────────────────────
// Metadata key
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_FEATURE_KEY = 'plan_feature';

// ─────────────────────────────────────────────────────────────────────────────
// @RequireFeature() decorator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Controller/handler decorator that gates access to a specific PlanFeature.
 *
 * Usage:
 *   @RequireFeature(PlanFeature.ATS_PIPELINE)
 *   @Get('jobs/:id/kanban')
 *   getKanban(...) { ... }
 *
 * The PlanEnforcementGuard reads this metadata and calls
 * PlanEnforcementService.assertFeature() for the request's tenant.
 */
export const RequireFeature = (feature: PlanFeature) =>
  SetMetadata(PLAN_FEATURE_KEY, feature);

// ─────────────────────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PLAN ENFORCEMENT GUARD
 *
 * Reads the @RequireFeature(PlanFeature.X) metadata from the route handler.
 * If a feature is required:
 *   1. Extracts tenantId from request (X-Tenant-ID header OR JWT claim)
 *   2. Calls PlanEnforcementService.assertFeature(tenantId, feature)
 *   3. Throws ForbiddenException if tenant's plan doesn't include the feature
 *
 * If no @RequireFeature decorator is present, the guard passes through.
 *
 * Registration:
 *   Register globally in app.module.ts:
 *     { provide: APP_GUARD, useClass: PlanEnforcementGuard }
 *
 *   Or per-controller:
 *     @UseGuards(PlanEnforcementGuard)
 *
 * Tenant resolution order:
 *   1. req.user?.tenantId   (from JWT — preferred)
 *   2. X-Tenant-ID header   (service-to-service)
 *   3. req.tenantId         (set by TenantContextMiddleware)
 */
@Injectable()
export class PlanEnforcementGuard implements CanActivate {
  private readonly logger = new Logger(PlanEnforcementGuard.name);

  constructor(
    private readonly reflector:         Reflector,
    private readonly enforcementService: PlanEnforcementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Read feature requirement from decorator
    const requiredFeature = this.reflector.getAllAndOverride<PlanFeature | undefined>(
      PLAN_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No feature gate on this route — pass through
    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest<Request & {
      user?:     { tenantId?: string; sub?: string };
      tenantId?: string;
    }>();

    const tenantId = this.resolveTenantId(request);

    if (!tenantId) {
      this.logger.warn(
        `[PlanEnforcement] Cannot resolve tenantId for feature gate "${requiredFeature}" ` +
        `— route: ${request.method} ${request.path}`,
      );
      // Fail open only for health/public routes; all gated routes should have tenant context
      return false;
    }

    // Delegate to enforcement service — throws ForbiddenException on violation
    await this.enforcementService.assertFeature(tenantId, requiredFeature);
    return true;
  }

  private resolveTenantId(req: Request & {
    user?:     { tenantId?: string };
    tenantId?: string;
  }): string | null {
    return (
      req.user?.tenantId
      ?? (req.headers['x-tenant-id'] as string | undefined)
      ?? req.tenantId
      ?? null
    );
  }
}
