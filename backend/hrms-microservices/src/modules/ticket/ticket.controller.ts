import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { Ticket } from './ticket.entity';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  findAll(): Promise<Ticket[]> {
    return this.ticketService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.ticketService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Ticket> {
    return this.ticketService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Ticket>): Promise<Ticket> {
    return this.ticketService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Ticket>): Promise<Ticket> {
    return this.ticketService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.ticketService.remove(id);
  }
}
