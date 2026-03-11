import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { Holiday } from './holiday.entity';

@Controller('holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  findAll(): Promise<Holiday[]> {
    return this.holidayService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.holidayService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Holiday> {
    return this.holidayService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Holiday>): Promise<Holiday> {
    return this.holidayService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Holiday>): Promise<Holiday> {
    return this.holidayService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.holidayService.remove(id);
  }
}
