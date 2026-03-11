import { Controller, Post, Get, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { BranchService } from './branch.service';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  create(@Body() data: any) {
    return this.branchService.create(data);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.branchService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.branchService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.branchService.delete(id);
  }
}
