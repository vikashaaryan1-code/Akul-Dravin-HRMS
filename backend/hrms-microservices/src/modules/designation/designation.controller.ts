import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';

@Controller('designations')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    if (departmentId) {
      return this.designationService.findByDepartment(departmentId);
    }
    return this.designationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designationService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDesignationDto) {
    return this.designationService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.designationService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.designationService.delete(id);
  }
}
