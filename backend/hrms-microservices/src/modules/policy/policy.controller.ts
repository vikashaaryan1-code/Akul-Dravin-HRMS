import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { Policy } from './policy.entity';

@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  findAll(): Promise<Policy[]> {
    return this.policyService.findAll();
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.policyService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Policy> {
    return this.policyService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Policy>): Promise<Policy> {
    return this.policyService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Policy>): Promise<Policy> {
    return this.policyService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.policyService.remove(id);
  }
}
