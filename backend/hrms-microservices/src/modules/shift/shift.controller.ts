import { Controller, Post, Get, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { ShiftService } from './shift.service';

@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  create(@Body() data: any) {
    return this.shiftService.create(data);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.shiftService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.shiftService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shiftService.delete(id);
  }
}
