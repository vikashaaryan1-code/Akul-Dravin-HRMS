import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { Client } from './client.entity';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  findAll(): Promise<Client[]> {
    return this.clientService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.clientService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Client> {
    return this.clientService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Client>): Promise<Client> {
    return this.clientService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Client>): Promise<Client> {
    return this.clientService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.clientService.remove(id);
  }
}
