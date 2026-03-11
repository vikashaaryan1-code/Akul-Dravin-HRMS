import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Employee } from './employee.entity';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  findAll(): Promise<Employee[]> {
    return this.employeeService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.employeeService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Employee> {
    return this.employeeService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Employee>): Promise<Employee> {
    try {
      console.log('Creating employee with data:', JSON.stringify(data, null, 2));
      const result = await this.employeeService.create(data);
      console.log('Employee created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Error creating employee:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Employee>): Promise<Employee> {
    return this.employeeService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.employeeService.remove(id);
  }
}
