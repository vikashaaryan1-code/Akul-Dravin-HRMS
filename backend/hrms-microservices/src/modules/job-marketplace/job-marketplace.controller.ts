import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JobMarketplaceService } from './job-marketplace.service';
import { MarketplaceJobEntity } from '../../database/entities/marketplace-job.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('job-marketplace')
export class JobMarketplaceController {
  constructor(private readonly jobMarketplaceService: JobMarketplaceService) {}

  @Get('jobs')
  findAllJobs() {
    return this.jobMarketplaceService.findAllJobs();
  }

  @Get('jobs/:id')
  findOneJob(@Param('id') id: string) {
    return this.jobMarketplaceService.findOneJob(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('jobs')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  createJob(@Body() payload: Partial<MarketplaceJobEntity>) {
    return this.jobMarketplaceService.createJob(payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('jobs/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  updateJob(@Param('id') id: string, @Body() payload: Partial<MarketplaceJobEntity>) {
    return this.jobMarketplaceService.updateJob(id, payload);
  }
}
