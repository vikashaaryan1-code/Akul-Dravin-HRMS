import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { RecruiterService } from './recruiter.service';

@Controller('recruiters')
export class RecruiterController {
  constructor(private readonly recruiterService: RecruiterService) {}

  @Post()
  create(@Body() data: any) {
    return this.recruiterService.create(data);
  }

  @Get()
  findAll() {
    return this.recruiterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recruiterService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.recruiterService.update(id, data);
  }

  @Patch(':id/upgrade')
  upgradePlan(@Param('id') id: string, @Body() body: { planType: string; jobPostsLimit: number; commissionRate: number }) {
    return this.recruiterService.upgradePlan(id, body.planType, body.jobPostsLimit, body.commissionRate);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.recruiterService.delete(id);
  }
}
