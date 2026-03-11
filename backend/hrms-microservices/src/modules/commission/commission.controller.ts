import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { Commission } from './commission.entity';

@Controller('commissions')
export class CommissionController {
  constructor(private readonly service: CommissionService) {}
  @Get() findAll(): Promise<Commission[]> { return this.service.findAll(); }
  @Get('stats') getStats(): Promise<any> { return this.service.getStats(); }
  @Get(':id') findOne(@Param('id') id: string): Promise<Commission> { return this.service.findOne(id); }
  @Post() create(@Body() data: Partial<Commission>): Promise<Commission> { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: Partial<Commission>): Promise<Commission> { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string): Promise<void> { return this.service.remove(id); }
}
