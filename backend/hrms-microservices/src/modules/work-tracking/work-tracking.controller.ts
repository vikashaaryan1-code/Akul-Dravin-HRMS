import { Controller, Get, UseGuards } from '@nestjs/common';
import { WorkTrackingService } from './work-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-tracking')
export class WorkTrackingController {
  constructor(private readonly workTrackingService: WorkTrackingService) {}

  @Get('activities')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.SALES_MANAGER,
  )
  activities() {
    return this.workTrackingService.getActivities();
  }

  @Get('workdays')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.SALES_MANAGER,
    Role.EMPLOYEE,
  )
  workdays() {
    return this.workTrackingService.getWorkdays();
  }
}
