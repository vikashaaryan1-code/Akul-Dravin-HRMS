import { Controller, Get, UseGuards } from '@nestjs/common';
import { LocationTrackingService } from './location-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('location-tracking')
export class LocationTrackingController {
  constructor(private readonly locationTrackingService: LocationTrackingService) {}

  @Get('current')
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
  current() {
    return this.locationTrackingService.current();
  }

  @Get('history')
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
  history() {
    return this.locationTrackingService.historyDistribution();
  }
}
