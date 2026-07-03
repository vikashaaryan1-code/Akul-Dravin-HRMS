import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { TimesheetsService } from './timesheets.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

const ALL_ROLES = [
  Role.ROOT_OWNER,
  Role.PLATFORM_ADMIN,
  Role.SUPER_ADMIN,
  Role.COMPANY_ADMIN,
  Role.HR_MANAGER,
  Role.RECRUITER,
  Role.EMPLOYEE,
  Role.JOB_SEEKER,
];

@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get('projects')
  @Roles(...ALL_ROLES)
  async getProjects(@Req() req: Request) {
    const user = (req as any).user;
    return this.timesheetsService.getProjects(user?.tenantId);
  }

  @Get('me')
  @Roles(...ALL_ROLES)
  async getMyTimesheets(
    @Req() req: Request,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const user = (req as any).user;
    return this.timesheetsService.getMyTimesheets(user?.id, user?.tenantId, startDate, endDate);
  }

  @Post('me')
  @Roles(...ALL_ROLES)
  async saveMyTimesheets(
    @Req() req: Request,
    @Body() dto: { entries: { projectId: string; date: string; hours: number; status?: string }[] }
  ) {
    const user = (req as any).user;
    return this.timesheetsService.saveMyTimesheets(user?.id, user?.tenantId, dto.entries);
  }
}
