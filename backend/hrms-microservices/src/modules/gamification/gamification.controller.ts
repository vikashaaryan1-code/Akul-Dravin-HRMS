import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('performance')
export class GamificationController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('leaderboard')
  async getLeaderboard() {
    // Return what the frontend's TeamLeaderboardApiRecord expects
    return [
      { id: '1', teamName: 'Engineering Alpha', score: 98, completedTasks: 145, targetAchieved: 100 },
      { id: '2', teamName: 'Sales Elite', score: 92, completedTasks: 89, targetAchieved: 95 },
      { id: '3', teamName: 'Product Innovators', score: 88, completedTasks: 112, targetAchieved: 90 },
      { id: '4', teamName: 'Customer Success', score: 85, completedTasks: 340, targetAchieved: 88 },
      { id: '5', teamName: 'Finance Wizards', score: 78, completedTasks: 56, targetAchieved: 80 }
    ];
  }
}
