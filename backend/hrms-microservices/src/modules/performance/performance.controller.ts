import { Controller, Get, Param, UseGuards, Post, Body } from '@nestjs/common';
import { OkrService } from './okr.service';
import { AppraisalService } from './appraisal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('performance')
export class PerformanceController {
  constructor(
    private readonly okrService: OkrService,
    private readonly appraisalService: AppraisalService,
  ) {}

  @Get('scores')
  async getScores() {
    return [
      { id: '1', employeeName: 'Priya N.', performanceScore: 4.8, targetAchievement: 95, tasksDelivered: 120, aiScore: 98 },
      { id: '2', employeeName: 'Rahul S.', performanceScore: 4.2, targetAchievement: 85, tasksDelivered: 90, aiScore: 88 },
      { id: '3', employeeName: 'Aarav M.', performanceScore: 4.9, targetAchievement: 98, tasksDelivered: 150, aiScore: 99 },
      { id: '4', employeeName: 'Sneha R.', performanceScore: 3.9, targetAchievement: 75, tasksDelivered: 60, aiScore: 78 }
    ];
  }

  @Get('okrs/:employeeId')
  async getOkrs(@Param('employeeId') employeeId: string) {
    return this.okrService.getOkrsForEmployee(employeeId);
  }

  @Post('okrs/:krId/progress')
  async updateProgress(@Param('krId') krId: string, @Body('progress') progress: number) {
    await this.okrService.updateKeyResultProgress(krId, progress);
    return { success: true };
  }

  @Get('appraisals/:employeeId')
  async getAppraisals(@Param('employeeId') employeeId: string) {
    const feedback = await this.appraisalService.get360Feedback(employeeId);
    const aiSummary = await this.appraisalService.generateAiAppraisalSummary(employeeId);
    return { feedback, aiSummary };
  }
}
