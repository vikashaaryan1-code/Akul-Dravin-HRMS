import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { JobApplicationService } from './job-application.service';

@Controller('job-applications')
export class JobApplicationController {
  constructor(private readonly jobApplicationService: JobApplicationService) {}

  @Post()
  create(@Body() data: any) {
    return this.jobApplicationService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.jobApplicationService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobApplicationService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.jobApplicationService.update(id, data);
  }
}
