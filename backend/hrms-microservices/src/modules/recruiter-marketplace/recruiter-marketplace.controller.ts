import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RecruiterMarketplaceService } from './recruiter-marketplace.service';
import { RecruiterProfileEntity } from '../../database/entities/recruiter-profile.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recruiter-marketplace')
export class RecruiterMarketplaceController {
  constructor(private readonly recruiterMarketplaceService: RecruiterMarketplaceService) {}

  @Get('profiles')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAllProfiles() {
    return this.recruiterMarketplaceService.findAllProfiles();
  }

  @Get('profiles/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findOneProfile(@Param('id') id: string) {
    return this.recruiterMarketplaceService.findOneProfile(id);
  }

  @Post('profiles')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.RECRUITER)
  createProfile(@Body() payload: Partial<RecruiterProfileEntity>) {
    return this.recruiterMarketplaceService.createProfile(payload);
  }

  @Patch('profiles/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.RECRUITER)
  updateProfile(@Param('id') id: string, @Body() payload: Partial<RecruiterProfileEntity>) {
    return this.recruiterMarketplaceService.updateProfile(id, payload);
  }
}
