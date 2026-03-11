import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AppraisalService } from './appraisal.service';
import { Appraisal } from './appraisal.entity';

@Controller('appraisals')
export class AppraisalController {
  constructor(private readonly appraisalService: AppraisalService) {}

  @Get()
  findAll(): Promise<Appraisal[]> {
    return this.appraisalService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.appraisalService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Appraisal> {
    return this.appraisalService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Appraisal>): Promise<Appraisal> {
    return this.appraisalService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Appraisal>): Promise<Appraisal> {
    return this.appraisalService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.appraisalService.remove(id);
  }
}
