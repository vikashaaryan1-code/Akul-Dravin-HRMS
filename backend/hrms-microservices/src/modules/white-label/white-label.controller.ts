import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { WhiteLabelService, UpsertWhiteLabelDto } from './white-label.service';
import { WhiteLabelBrandingService } from './white-label-branding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const ADMIN_ROLES = [Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN];

/**
 * WHITE LABEL CONTROLLER
 *
 * PRD §12 — White Label & Partner Engine.
 *
 * Two access tiers:
 *  1. Public  — /branding/:tenantId  — no auth (login pages, embedded widgets)
 *  2. Admin   — /admin/white-label/* — JWT + role guard
 */
@Controller('admin/white-label')
export class WhiteLabelController {
  constructor(
    private readonly service:   WhiteLabelService,
    private readonly branding:  WhiteLabelBrandingService,
  ) {}

  // ── Public Branding (NO AUTH) ─────────────────────────────────────────────

  /**
   * GET /admin/white-label/public/:tenantOrDomain
   * Returns public branding token for login page injection.
   * Accepts either tenantId (UUID) or a custom domain.
   */
  @Get('public/:tenantOrDomain')
  getPublicBranding(@Param('tenantOrDomain') tenantOrDomain: string) {
    return this.branding.getPublicBranding(tenantOrDomain);
  }

  // ── Admin Endpoints ───────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':tenantId')
  @Roles(...ADMIN_ROLES)
  getConfig(@Param('tenantId') tenantId: string) {
    return this.service.getConfig(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':tenantId/token')
  @Roles(...ADMIN_ROLES)
  getBrandingToken(@Param('tenantId') tenantId: string) {
    return this.branding.resolveBrandingToken(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':tenantId/email-context')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  getEmailTemplateContext(@Param('tenantId') tenantId: string) {
    return this.branding.getEmailTemplateContext(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':tenantId/entitlements')
  @Roles(...ADMIN_ROLES)
  async getEntitlements(@Param('tenantId') tenantId: string) {
    const token = await this.branding.resolveBrandingToken(tenantId);
    return token.entitlements;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':tenantId')
  @Roles(...ADMIN_ROLES)
  upsertConfig(
    @Param('tenantId') tenantId: string,
    @Body() payload: UpsertWhiteLabelDto,
  ) {
    this.branding.invalidateBrandingCache(tenantId);
    return this.service.upsertConfig(tenantId, payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':tenantId/feature/:feature')
  @Roles(...ADMIN_ROLES)
  toggleFeature(
    @Param('tenantId') tenantId: string,
    @Param('feature') feature: string,
    @Body() body: { enabled: boolean },
  ) {
    this.branding.invalidateBrandingCache(tenantId);
    return this.service.toggleFeature(tenantId, feature, body.enabled);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':tenantId/reset')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  resetToDefaults(@Param('tenantId') tenantId: string) {
    this.branding.invalidateBrandingCache(tenantId);
    return this.service.resetToDefaults(tenantId);
  }

  // ── Domain Management ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':tenantId/domain/initiate')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  initiateDomainVerification(
    @Param('tenantId') tenantId: string,
    @Body() body: { domain: string },
  ) {
    return this.branding.initiateDomainVerification(tenantId, body.domain);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':tenantId/domain/verify')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  verifyDomain(@Param('tenantId') tenantId: string) {
    return this.branding.verifyDomain(tenantId);
  }

  // ── Partner / Reseller Client Management ─────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':tenantId/partner/clients')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN)
  listPartnerClients(@Param('tenantId') tenantId: string) {
    return this.branding.listPartnerClients(tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':tenantId/partner/provision')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  provisionPartnerClient(
    @Param('tenantId') parentTenantId: string,
    @Body() body: {
      newTenantId: string;
      brandName?: string;
      primaryColor?: string;
      logoUrl?: string;
      plan?: string;
      maxEmployees?: number;
    },
  ) {
    const { newTenantId, ...options } = body;
    return this.branding.provisionPartnerClient(parentTenantId, newTenantId, options);
  }

  // ── Entitlement Check ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':tenantId/module-access/:module')
  @Roles(...ADMIN_ROLES)
  checkModuleAccess(
    @Param('tenantId') tenantId: string,
    @Param('module') moduleName: string,
  ) {
    return this.branding.isModuleAllowed(tenantId, moduleName).then((allowed) => ({ moduleName, allowed }));
  }
}
