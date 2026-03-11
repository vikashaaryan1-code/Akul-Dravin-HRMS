import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('performance-reviews')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  create(@Body() data: any) {
    return this.performanceService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.performanceService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.performanceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.performanceService.update(id, data);
  }

  @Patch(':id/submit')
  submit(@Param('id') id: string) {
    return this.performanceService.submit(id);
  }
}
