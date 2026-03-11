import { Controller, Post, Get, Patch, Delete, Body, Query, Param } from '@nestjs/common';
import { EmployeeDocumentService } from './employee-document.service';

@Controller('employee-documents')
export class EmployeeDocumentController {
  constructor(private readonly documentService: EmployeeDocumentService) {}

  @Post()
  create(@Body() data: any) {
    return this.documentService.create(data);
  }

  @Get()
  findAll(@Query('employeeId') employeeId?: string) {
    return this.documentService.findAll(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.documentService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.documentService.delete(id);
  }
}
