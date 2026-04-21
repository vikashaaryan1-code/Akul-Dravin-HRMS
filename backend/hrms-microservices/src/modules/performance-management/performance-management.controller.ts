import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PerformanceManagementService } from './performance-management.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceManagementController {
  constructor(private readonly performanceManagementService: PerformanceManagementService) {}

  @Get('scores')
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
  scores() {
    return this.performanceManagementService.getScores();
  }

  @Get('leaderboard')
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
    Role.GUEST,
  )
  leaderboard(@Query('days') days: number = 7) {
    return this.performanceManagementService.getLeaderboard(days);
  }

  @Get('top-employees')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  topEmployees(@Query('limit') limit: number = 5) {
    return this.performanceManagementService.getTopEmployees(limit);
  }

  @Get('top-employee')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.EMPLOYEE,
  )
  topEmployee() {
    return this.performanceManagementService.getTopEmployee();
  }
}

