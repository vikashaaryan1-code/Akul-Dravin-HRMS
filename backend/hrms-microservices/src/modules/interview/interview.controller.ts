import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { InterviewService } from './interview.service';

@Controller('interviews')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  create(@Body() data: any) {
    return this.interviewService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.interviewService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string; feedback?: string; rating?: number }) {
    return this.interviewService.updateStatus(id, body.status, body.feedback, body.rating);
  }
}
