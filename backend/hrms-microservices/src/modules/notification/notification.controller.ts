import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.RECRUITER,
    Role.EMPLOYEE,
    Role.JOB_SEEKER,
  )
  findAll() {
    return this.notificationService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.RECRUITER,
    Role.EMPLOYEE,
    Role.JOB_SEEKER,
  )
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Post()
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  create(@Body() payload: Partial<NotificationEntity>) {
    return this.notificationService.create(payload);
  }

  @Patch(':id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  update(@Param('id') id: string, @Body() payload: Partial<NotificationEntity>) {
    return this.notificationService.update(id, payload);
  }
}
