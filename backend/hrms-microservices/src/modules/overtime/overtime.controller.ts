import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { OvertimeService } from './overtime.service';

@Controller('overtime')
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Post()
  create(@Body() data: any) {
    return this.overtimeService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.overtimeService.findAll(filters);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: { approverId: string }) {
    return this.overtimeService.approve(id, body.approverId);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { approverId: string }) {
    return this.overtimeService.reject(id, body.approverId);
  }
}
