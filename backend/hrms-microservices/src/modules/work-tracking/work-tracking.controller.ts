import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  WorkTrackingService,
  CreateActivityDto,
  CreateWorkdaySummaryDto,
} from './work-tracking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const MANAGER_ROLES = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN,
  Role.HR_MANAGER,
  Role.TEAM_MANAGER,
  Role.TEAM_LEADER,
  Role.SALES_MANAGER,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-tracking')
export class WorkTrackingController {
  constructor(private readonly workTrackingService: WorkTrackingService) {}

  @Get('activities')
  @Roles(...MANAGER_ROLES)
  getActivities(@Query('limit') limit?: string) {
    return this.workTrackingService.getActivities(limit ? parseInt(limit, 10) : 50);
  }

  @Post('activities')
  @Roles(...MANAGER_ROLES, Role.EMPLOYEE)
  createActivity(@Body() payload: CreateActivityDto) {
    return this.workTrackingService.createActivity(payload);
  }

  @Patch('activities/:id')
  @Roles(...MANAGER_ROLES)
  updateActivity(@Param('id') id: string, @Body() payload: Partial<CreateActivityDto>) {
    return this.workTrackingService.updateActivity(id, payload);
  }

  @Get('workdays')
  @Roles(...MANAGER_ROLES, Role.EMPLOYEE)
  getWorkdays(@Query('month') month?: string) {
    return this.workTrackingService.getWorkdays(month);
  }

  @Post('workdays')
  @Roles(...MANAGER_ROLES)
  upsertWorkdaySummary(@Body() payload: CreateWorkdaySummaryDto) {
    return this.workTrackingService.upsertWorkdaySummary(payload);
  }

  @Get('productivity/summary')
  @Roles(...MANAGER_ROLES)
  getProductivitySummary() {
    return this.workTrackingService.getProductivitySummary();
  }
}
