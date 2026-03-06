import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { PermissionControlService } from './permission-control.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permission-control')
export class PermissionControlController {
  constructor(private readonly permissionControlService: PermissionControlService) {}

  @Get('roles')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.TEAM_MANAGER)
  roles() {
    return this.permissionControlService.getRoles();
  }

  @Get('audits')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
  )
  audits() {
    return this.permissionControlService.getAudits();
  }

  @Patch('roles/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  updateRole(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.permissionControlService.updateRole(id, payload);
  }
}
