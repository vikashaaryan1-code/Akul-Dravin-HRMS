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

  /** Admin shortlists → sends interview invite email */
  @Patch(':id/shortlist')
  shortlist(@Param('id') id: string, @Body() body: { companyName?: string }) {
    return this.jobApplicationService.shortlist(id, body.companyName);
  }

  /** Admin clears/selects after interview → creates account + sends credentials */
  @Patch(':id/select')
  select(
    @Param('id') id: string,
    @Body() body: { companyName?: string; tenantId?: string; companyId?: string },
  ) {
    return this.jobApplicationService.select(id, body.companyName, body.tenantId, body.companyId);
  }

  /** Admin rejects */
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.jobApplicationService.reject(id);
  }
}
