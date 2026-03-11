import { Controller, Post, Get, Put, Body, Param, Query } from '@nestjs/common';
import { PerformanceRewardsService } from './performance-rewards.service';

@Controller('api/v1/performance-rewards')
export class PerformanceRewardsController {
  constructor(private readonly rewardsService: PerformanceRewardsService) {}

  @Post('calculate')
  async calculateReward(@Body() data: { employeeId: string; performanceScore: number; tasksCompleted: number }) {
    return this.rewardsService.calculateReward(data.employeeId, data.performanceScore, data.tasksCompleted);
  }

  @Post()
  async createReward(@Body() data: any) {
    return this.rewardsService.createReward(data);
  }

  @Put(':id/approve')
  async approveReward(@Param('id') id: string, @Body() data: { approvedBy: string }) {
    return this.rewardsService.approveReward(id, data.approvedBy);
  }

  @Get('employee/:employeeId')
  async getEmployeeRewards(@Param('employeeId') employeeId: string) {
    return this.rewardsService.getEmployeeRewards(employeeId);
  }

  @Get('pending')
  async getPendingRewards(@Query('companyId') companyId: string) {
    return this.rewardsService.getPendingRewards(companyId);
  }
}
