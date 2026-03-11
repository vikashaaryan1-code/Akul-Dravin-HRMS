import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  findAll(): Promise<Project[]> {
    return this.projectService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.projectService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Project>): Promise<Project> {
    return this.projectService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Project>): Promise<Project> {
    return this.projectService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.projectService.remove(id);
  }
}
