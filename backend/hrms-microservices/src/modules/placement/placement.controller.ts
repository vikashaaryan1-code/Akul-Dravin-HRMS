import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlacementService } from './placement.service';
import { Placement } from './placement.entity';

@Controller('placements')
export class PlacementController {
  constructor(private readonly service: PlacementService) {}
  @Get() findAll(): Promise<Placement[]> { return this.service.findAll(); }
  @Get('stats') getStats(): Promise<any> { return this.service.getStats(); }
  @Get(':id') findOne(@Param('id') id: string): Promise<Placement> { return this.service.findOne(id); }
  @Post() create(@Body() data: Partial<Placement>): Promise<Placement> { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: Partial<Placement>): Promise<Placement> { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string): Promise<void> { return this.service.remove(id); }
}
