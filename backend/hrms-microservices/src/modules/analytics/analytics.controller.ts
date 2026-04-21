import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RoiService } from './roi.service';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly roiService: RoiService,
  ) {}

  @Get('events')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findAllEvents() {
    return this.analyticsService.findAllEvents();
  }

  @Post('events')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.BRANCH_ADMIN,
    Role.HR_MANAGER,
    Role.RECRUITER,
    Role.EMPLOYEE,
  )
  createEvent(@Body() payload: Partial<AnalyticsEventEntity>) {
    return this.analyticsService.createEvent(payload);
  }

  @Get('dashboard')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  dashboard() {
    return this.analyticsService.getDashboardSummary();
  }

  @Get('roi/departments')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  getDepartmentalROI() {
    return this.roiService.getDepartmentalROI();
  }

  @Get('roi/global')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  getGlobalROI() {
    return this.roiService.getGlobalROI();
  }

  @Post('roi/simulate')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  simulateImpact(@Body() payload: { directiveId: string; currentStats: any; directive: any }) {
    return this.roiService.simulateSimulation(payload.directiveId, payload.currentStats, payload.directive);
  }
}
