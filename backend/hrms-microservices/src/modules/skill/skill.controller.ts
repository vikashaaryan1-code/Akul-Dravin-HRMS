import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SkillService } from './skill.service';
import { Skill } from './skill.entity';

@Controller('skills')
export class SkillController {
  constructor(private readonly service: SkillService) {}
  @Get() findAll(): Promise<Skill[]> { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string): Promise<Skill> { return this.service.findOne(id); }
  @Post() create(@Body() data: Partial<Skill>): Promise<Skill> { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: Partial<Skill>): Promise<Skill> { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string): Promise<void> { return this.service.remove(id); }
}
