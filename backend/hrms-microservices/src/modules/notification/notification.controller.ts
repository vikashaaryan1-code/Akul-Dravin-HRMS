import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() data: any) {
    return this.notificationService.create(data);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.notificationService.findAll(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('read-all')
  markAllAsRead(@Body() body: { userId: string }) {
    return this.notificationService.markAllAsRead(body.userId);
  }
}
