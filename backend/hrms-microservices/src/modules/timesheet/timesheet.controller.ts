import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { Timesheet } from './timesheet.entity';

@Controller('timesheets')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Get()
  findAll(): Promise<Timesheet[]> {
    return this.timesheetService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.timesheetService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Timesheet> {
    return this.timesheetService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Timesheet>): Promise<Timesheet> {
    return this.timesheetService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Timesheet>): Promise<Timesheet> {
    return this.timesheetService.update(id, data);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body('approverId') approverId: string): Promise<Timesheet> {
    return this.timesheetService.approve(id, approverId);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.timesheetService.remove(id);
  }
}
