import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { Announcement } from './announcement.entity';

@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  findAll(): Promise<Announcement[]> {
    return this.announcementService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.announcementService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Announcement> {
    return this.announcementService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Announcement>): Promise<Announcement> {
    return this.announcementService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Announcement>): Promise<Announcement> {
    return this.announcementService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.announcementService.remove(id);
  }
}
