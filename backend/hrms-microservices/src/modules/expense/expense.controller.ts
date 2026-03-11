import { Controller, Post, Get, Patch, Body, Query, Param } from '@nestjs/common';
import { ExpenseService } from './expense.service';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Body() data: any) {
    return this.expenseService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.expenseService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: { approverId: string; remarks?: string }) {
    return this.expenseService.approve(id, body.approverId, body.remarks);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { approverId: string; remarks: string }) {
    return this.expenseService.reject(id, body.approverId, body.remarks);
  }
}
