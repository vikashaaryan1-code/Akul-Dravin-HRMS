import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { FeaturePermissionsService } from './feature-permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feature-permissions')
export class FeaturePermissionsController {
  constructor(private readonly featurePermissionsService: FeaturePermissionsService) {}

  @Get()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  findAll() {
    return this.featurePermissionsService.findAll();
  }

  @Get('role/:role')
  findByRole(@Param('role') role: string) {
    return this.featurePermissionsService.findByRole(role);
  }

  @Post('bulk')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  bulkUpsert(@Body() permissions: Array<{ role: string; feature: string; canView: boolean; canEdit: boolean; canDelete: boolean }>) {
    return this.featurePermissionsService.bulkUpsert(permissions);
  }

  @Delete(':id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN)
  delete(@Param('id') id: string) {
    return this.featurePermissionsService.delete(id);
  }
}
