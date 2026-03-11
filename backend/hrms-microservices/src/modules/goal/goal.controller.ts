import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GoalService } from './goal.service';
import { Goal } from './goal.entity';

@Controller('goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Get()
  findAll(): Promise<Goal[]> {
    return this.goalService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.goalService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Goal> {
    return this.goalService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Goal>): Promise<Goal> {
    return this.goalService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Goal>): Promise<Goal> {
    return this.goalService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.goalService.remove(id);
  }
}
