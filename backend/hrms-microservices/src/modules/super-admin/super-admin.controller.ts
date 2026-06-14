import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SuperAdminService, CreateTenantDto, UpdateTenantDto } from './super-admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Request } from 'express';

const ROOT_ONLY = [Role.ROOT_OWNER, Role.PLATFORM_ADMIN];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/tenants')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  @Get()
  @Roles(...ROOT_ONLY)
  listTenants(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    return this.service.listTenants({ search, status, plan });
  }

  @Get('stats')
  @Roles(...ROOT_ONLY)
  getGlobalStats() {
    return this.service.getGlobalStats();
  }

  @Get(':id')
  @Roles(...ROOT_ONLY)
  getTenant(@Param('id') id: string) {
    return this.service.getTenant(id);
  }

  @Post()
  @Roles(...ROOT_ONLY)
  createTenant(@Body() payload: CreateTenantDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.service.createTenant(payload, user?.id);
  }

  @Patch(':id')
  @Roles(...ROOT_ONLY)
  updateTenant(@Param('id') id: string, @Body() payload: UpdateTenantDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.service.updateTenant(id, payload, user?.id);
  }

  @Patch(':id/suspend')
  @Roles(...ROOT_ONLY)
  suspendTenant(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req: Request) {
    const user = (req as any).user;
    return this.service.suspendTenant(id, body.reason ?? 'Suspended by admin', user?.id);
  }

  @Patch(':id/activate')
  @Roles(...ROOT_ONLY)
  activateTenant(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.service.activateTenant(id, user?.id);
  }

  @Patch(':id/feature-flags')
  @Roles(...ROOT_ONLY)
  setFeatureFlags(
    @Param('id') id: string,
    @Body() body: { flags: Record<string, boolean> },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.service.setFeatureFlags(id, body.flags, user?.id);
  }
}
