import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PingPlanService } from './ping-plan.service';

@Controller('api/v1/ping-plan')
export class PingPlanController {
  constructor(private readonly pingPlanService: PingPlanService) {}

  @Post()
  async createPing(@Body() data: any) {
    return this.pingPlanService.createPing(data);
  }

  @Get('employee/:employeeId')
  async getEmployeePings(
    @Param('employeeId') employeeId: string,
    @Query('date') date?: string,
  ) {
    return this.pingPlanService.getEmployeePings(employeeId, date);
  }

  @Get('employee/:employeeId/status')
  async getEmployeeStatus(@Param('employeeId') employeeId: string) {
    return this.pingPlanService.getEmployeeStatus(employeeId);
  }

  @Get('report/daily')
  async getDailyReport(
    @Query('companyId') companyId: string,
    @Query('date') date: string,
  ) {
    return this.pingPlanService.getDailyReport(companyId, date);
  }
}
