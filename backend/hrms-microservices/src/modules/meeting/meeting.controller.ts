import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MeetingService } from './meeting.service';
import { Meeting } from './meeting.entity';

@Controller('meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get()
  findAll(): Promise<Meeting[]> {
    return this.meetingService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.meetingService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Meeting> {
    return this.meetingService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Meeting>): Promise<Meeting> {
    return this.meetingService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Meeting>): Promise<Meeting> {
    return this.meetingService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.meetingService.remove(id);
  }
}
