import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Request } from 'express';

const ALL_ROLES = [Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER, Role.EMPLOYEE, Role.JOB_SEEKER];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles(...ALL_ROLES)
  findAll(@Req() req: Request) {
    const user = (req as any).user;
    return this.notificationService.findAll(user?.tenantId);
  }

  @Get('me')
  @Roles(...ALL_ROLES)
  getMyNotifications(@Req() req: Request) {
    const user = (req as any).user;
    return this.notificationService.findByUser(user?.id, user?.tenantId);
  }

  @Get('me/unread-count')
  @Roles(...ALL_ROLES)
  getUnreadCount(@Req() req: Request) {
    const user = (req as any).user;
    return this.notificationService.getUnreadCount(user?.id).then(count => ({ count }));
  }

  @Patch('me/mark-all-read')
  @Roles(...ALL_ROLES)
  markAllRead(@Req() req: Request) {
    const user = (req as any).user;
    return this.notificationService.markAllRead(user?.id, user?.tenantId);
  }

  @Get(':id')
  @Roles(...ALL_ROLES)
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id/read')
  @Roles(...ALL_ROLES)
  markRead(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.notificationService.markRead(id, user?.id);
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

