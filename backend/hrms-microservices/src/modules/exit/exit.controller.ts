import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExitService } from './exit.service';
import { Exit } from './exit.entity';

@Controller('exits')
export class ExitController {
  constructor(private readonly exitService: ExitService) {}

  @Get()
  findAll(): Promise<Exit[]> {
    return this.exitService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.exitService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Exit> {
    return this.exitService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Exit>): Promise<Exit> {
    return this.exitService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Exit>): Promise<Exit> {
    return this.exitService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.exitService.remove(id);
  }
}
