import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RecruitmentAtsService } from './recruitment-ats.service';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recruitment')
export class RecruitmentAtsController {
  constructor(private readonly recruitmentAtsService: RecruitmentAtsService) {}

  @Get('jobs')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllJobs() {
    return this.recruitmentAtsService.findAllJobs();
  }

  @Post('jobs')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  createJob(@Body() payload: Partial<RecruitmentJobEntity>) {
    return this.recruitmentAtsService.createJob(payload);
  }

  @Patch('jobs/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateJob(@Param('id') id: string, @Body() payload: Partial<RecruitmentJobEntity>) {
    return this.recruitmentAtsService.updateJob(id, payload);
  }

  @Get('applications')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllApplications() {
    return this.recruitmentAtsService.findAllApplications();
  }

  @Post('applications')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  createApplication(@Body() payload: Partial<RecruitmentApplicationEntity>) {
    return this.recruitmentAtsService.createApplication(payload);
  }

  @Patch('applications/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateApplication(@Param('id') id: string, @Body() payload: Partial<RecruitmentApplicationEntity>) {
    return this.recruitmentAtsService.updateApplication(id, payload);
  }
}
