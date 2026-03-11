import { Controller, Post, Get, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { TrainingService } from './training.service';

@Controller('trainings')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Post()
  create(@Body() data: any) {
    return this.trainingService.create(data);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.trainingService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingService.findOne(id);
  }

  @Patch(':id/enroll')
  enroll(@Param('id') id: string) {
    return this.trainingService.enroll(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.trainingService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.trainingService.delete(id);
  }
}
