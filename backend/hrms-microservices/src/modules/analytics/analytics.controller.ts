import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('employee-growth')
  getEmployeeGrowth() {
    return this.analyticsService.getEmployeeGrowth();
  }

  @Get('attendance-trends')
  getAttendanceTrends(@Query('days') days?: string) {
    return this.analyticsService.getAttendanceTrends(days ? parseInt(days) : 30);
  }
}
