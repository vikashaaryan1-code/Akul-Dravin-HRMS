import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/tenants/me/settings')
export class TenantSettingsController {
  constructor(private readonly service: SuperAdminService) {}

  @Get()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async getMySettings(@Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new Error('No tenant associated with this user');
    }
    const tenant = await this.service.getTenant(tenantId);
    return {
      metadata: tenant.metadata || {},
      customDomain: tenant.customDomain,
      featureFlags: tenant.featureFlags || {},
      plan: tenant.plan,
    };
  }

  @Patch()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  async updateMySettings(
    @Req() req: Request,
    @Body() body: { metadata?: Record<string, any>; customDomain?: string; allowedModules?: string[] },
  ) {
    const user = (req as any).user;
    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new Error('No tenant associated with this user');
    }

    const currentTenant = await this.service.getTenant(tenantId);
    
    // Merge metadata
    const mergedMetadata = {
      ...(currentTenant.metadata || {}),
      ...(body.metadata || {}),
    };

    if (body.allowedModules) {
      mergedMetadata.allowedModules = body.allowedModules;
    }

    return this.service.updateTenant(
      tenantId,
      {
        metadata: mergedMetadata as any, // Using type assertion to bypass strict typing on UpdateTenantDto
        customDomain: body.customDomain !== undefined ? body.customDomain : currentTenant.customDomain,
      } as any,
      user?.id
    );
  }
}
