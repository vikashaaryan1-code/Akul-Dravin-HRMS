import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { SurveysService } from './surveys.service';
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

@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get()
  @Roles(...ALL_ROLES)
  async getSurveys(@Req() req: Request) {
    const user = (req as any).user;
    return this.surveysService.getSurveys(user?.tenantId);
  }

  @Get('metrics')
  @Roles(...ALL_ROLES)
  async getEnpsMetrics(@Req() req: Request) {
    const user = (req as any).user;
    return this.surveysService.getEnpsMetrics(user?.tenantId);
  }
}
