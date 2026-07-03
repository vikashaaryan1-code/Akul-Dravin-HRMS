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
      { id: '1', employeeName: 'Priya N.', performanceScore: 96, targetAchievement: 95, tasksDelivered: 120, aiScore: 98 },
      { id: '2', employeeName: 'Rahul S.', performanceScore: 84, targetAchievement: 85, tasksDelivered: 90, aiScore: 88 },
      { id: '3', employeeName: 'Aarav M.', performanceScore: 98, targetAchievement: 98, tasksDelivered: 150, aiScore: 99 },
      { id: '4', employeeName: 'Sneha R.', performanceScore: 78, targetAchievement: 75, tasksDelivered: 60, aiScore: 78 }
    ];
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return [
      { teamName: 'Engineering', score: 95, completedTasks: 450 },
      { teamName: 'Product', score: 92, completedTasks: 320 },
      { teamName: 'Design', score: 88, completedTasks: 210 },
      { teamName: 'Marketing', score: 85, completedTasks: 180 },
    ];
  }

  @Get('cycles')
  async getCycles() {
    return [
      { id: 'Q1-2026', name: 'Q1 2026 Performance Review', period: 'Jan – Mar 2026', status: 'completed',   participants: 142, completionRate: 97, avgScore: 83 },
      { id: 'Q2-2026', name: 'Q2 2026 Performance Review', period: 'Apr – Jun 2026', status: 'in-progress', participants: 148, completionRate: 61, avgScore: 79 },
      { id: 'MID-2026', name: 'Mid-Year Goals Review',     period: 'Jun 2026',       status: 'pending',     participants: 148, completionRate: 0,  avgScore: 0  },
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
