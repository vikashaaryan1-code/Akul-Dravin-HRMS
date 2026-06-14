import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { LmsService } from './lms.service';

const LMS_ROLES = [Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.EMPLOYEE];

/**
 * LMS CONTROLLER
 * Exposes course catalog, my-learning progress, and completion analytics.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('courses')
  @Roles(...LMS_ROLES)
  getCourses() {
    return this.lmsService.getCourses();
  }

  @Get('my-learning')
  @Roles(...LMS_ROLES)
  getMyLearning() {
    return this.lmsService.getMyLearning();
  }

  @Get('completion-trend')
  @Roles(...LMS_ROLES)
  getCompletionTrend() {
    return this.lmsService.getCompletionTrend();
  }

  @Get('summary')
  @Roles(...LMS_ROLES)
  getSummary() {
    return this.lmsService.getSummary();
  }
}
