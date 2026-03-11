import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Invoice } from './invoice.entity';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get()
  findAll(): Promise<Invoice[]> {
    return this.invoiceService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.invoiceService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Invoice> {
    return this.invoiceService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Invoice>): Promise<Invoice> {
    return this.invoiceService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Invoice>): Promise<Invoice> {
    return this.invoiceService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.invoiceService.remove(id);
  }
}
