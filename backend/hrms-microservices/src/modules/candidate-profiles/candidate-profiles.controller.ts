import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CandidateProfilesService } from './candidate-profiles.service';
import { CandidateProfileEntity } from '../../database/entities/candidate-profile.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidates')
export class CandidateProfilesController {
  constructor(private readonly candidateProfilesService: CandidateProfilesService) {}

  @Get()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  findAll() {
    return this.candidateProfilesService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.RECRUITER,
    Role.JOB_SEEKER,
  )
  findOne(@Param('id') id: string) {
    return this.candidateProfilesService.findOne(id);
  }

  @Post()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.RECRUITER, Role.JOB_SEEKER)
  create(@Body() payload: Partial<CandidateProfileEntity>) {
    return this.candidateProfilesService.create(payload);
  }

  @Patch(':id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.RECRUITER, Role.JOB_SEEKER)
  update(@Param('id') id: string, @Body() payload: Partial<CandidateProfileEntity>) {
    return this.candidateProfilesService.update(id, payload);
  }
}
