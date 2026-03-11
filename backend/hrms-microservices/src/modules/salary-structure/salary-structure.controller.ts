import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SalaryStructureService } from './salary-structure.service';
import { SalaryStructure } from './salary-structure.entity';

@Controller('salary-structures')
export class SalaryStructureController {
  constructor(private readonly salaryStructureService: SalaryStructureService) {}

  @Get()
  findAll(): Promise<SalaryStructure[]> {
    return this.salaryStructureService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string): Promise<SalaryStructure[]> {
    return this.salaryStructureService.findByEmployee(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<SalaryStructure> {
    return this.salaryStructureService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    return this.salaryStructureService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<SalaryStructure>): Promise<SalaryStructure> {
    return this.salaryStructureService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.salaryStructureService.remove(id);
  }
}
