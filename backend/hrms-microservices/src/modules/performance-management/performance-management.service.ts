import { Injectable } from '@nestjs/common';

@Injectable()
export class PerformanceManagementService {
  private readonly scores = [
    { id: 'PERF-1', employeeName: 'Meera Joshi', performanceScore: 94, targetAchievement: 112, tasksDelivered: 48, aiScore: 93 },
    { id: 'PERF-2', employeeName: 'Ananya Rao', performanceScore: 91, targetAchievement: 104, tasksDelivered: 42, aiScore: 90 },
    { id: 'PERF-3', employeeName: 'Siddharth Iyer', performanceScore: 88, targetAchievement: 98, tasksDelivered: 40, aiScore: 87 },
    { id: 'PERF-4', employeeName: 'Neha Kapoor', performanceScore: 86, targetAchievement: 95, tasksDelivered: 37, aiScore: 85 },
    { id: 'PERF-5', employeeName: 'Raghav Menon', performanceScore: 84, targetAchievement: 92, tasksDelivered: 35, aiScore: 83 },
  ];

  private readonly leaderboard = [
    { id: 'LDB-1', teamName: 'Sales South', score: 92, completedTasks: 176, targetAchieved: 108 },
    { id: 'LDB-2', teamName: 'HR Operations', score: 89, completedTasks: 154, targetAchieved: 101 },
    { id: 'LDB-3', teamName: 'Engineering Core', score: 87, completedTasks: 162, targetAchieved: 98 },
    { id: 'LDB-4', teamName: 'Finance & Payroll', score: 84, completedTasks: 133, targetAchieved: 96 },
  ];

  getScores() {
    return this.scores;
  }

  getLeaderboard() {
    return this.leaderboard;
  }
}
