import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { BenefitsService } from './benefits.service';
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

@Controller('benefits')
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get('plans')
  @Roles(...ALL_ROLES)
  async getBenefitPlans(@Req() req: Request) {
    const user = (req as any).user;
    return this.benefitsService.getActiveBenefits(user?.tenantId);
  }

  @Get('enrollments/me')
  @Roles(...ALL_ROLES)
  async getMyEnrollments(@Req() req: Request) {
    const user = (req as any).user;
    return this.benefitsService.getMyEnrollments(user?.id, user?.tenantId);
  }

  @Post('enroll')
  @Roles(...ALL_ROLES)
  async enrollInBenefit(@Body() dto: { benefitId: string; coverageLevel: string }, @Req() req: Request) {
    const user = (req as any).user;
    return this.benefitsService.enrollInBenefit(user?.id, user?.tenantId, dto.benefitId, dto.coverageLevel);
  }
}
