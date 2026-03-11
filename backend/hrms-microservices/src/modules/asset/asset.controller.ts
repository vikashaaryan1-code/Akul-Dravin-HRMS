import { Controller, Post, Get, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { AssetService } from './asset.service';

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  create(@Body() data: any) {
    return this.assetService.create(data);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.assetService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Patch(':id/assign')
  assign(@Param('id') id: string, @Body() body: { employeeId: string }) {
    return this.assetService.assign(id, body.employeeId);
  }

  @Patch(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.assetService.unassign(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.assetService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.assetService.delete(id);
  }
}
