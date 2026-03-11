import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { ApplicationService } from './application.service';

@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  create(@Body() data: any) {
    return this.applicationService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.applicationService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; stage?: string }) {
    return this.applicationService.updateStatus(id, body.status, body.stage);
  }
}
