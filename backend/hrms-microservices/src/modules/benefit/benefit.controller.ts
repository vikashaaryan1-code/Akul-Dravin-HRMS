import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BenefitService } from './benefit.service';
import { Benefit } from './benefit.entity';

@Controller('benefits')
export class BenefitController {
  constructor(private readonly service: BenefitService) {}
  @Get() findAll(): Promise<Benefit[]> { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string): Promise<Benefit> { return this.service.findOne(id); }
  @Post() create(@Body() data: Partial<Benefit>): Promise<Benefit> { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: Partial<Benefit>): Promise<Benefit> { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string): Promise<void> { return this.service.remove(id); }
}
