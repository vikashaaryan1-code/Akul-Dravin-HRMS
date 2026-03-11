import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('generate')
  generate(@Body() data: any) {
    return this.payrollService.generate(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.payrollService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.payrollService.updateStatus(id, body.status);
  }
}
