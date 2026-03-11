import { Injectable } from '@nestjs/common';

@Injectable()
export class PerformanceRewardsService {
  async calculateReward(employeeId: string, performanceScore: number, tasksCompleted: number) {
    let rewardType = 'certificate';
    let rewardTitle = 'Good Performance';
    let monetaryValue = 0;

    if (performanceScore >= 90 && tasksCompleted >= 50) {
      rewardType = 'tour';
      rewardTitle = 'Company Sponsored Tour';
      monetaryValue = 50000;
    } else if (performanceScore >= 80 && tasksCompleted >= 30) {
      rewardType = 'bonus';
      rewardTitle = 'Performance Bonus';
      monetaryValue = 20000;
    } else if (performanceScore >= 70 && tasksCompleted >= 20) {
      rewardType = 'gift';
      rewardTitle = 'Gift Voucher';
      monetaryValue = 5000;
    }

    return {
      employeeId,
      rewardType,
      rewardTitle,
      monetaryValue,
      performanceScore,
      tasksCompleted,
      status: 'pending',
    };
  }

  async createReward(data: any) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date(),
    };
  }

  async approveReward(rewardId: string, approvedBy: string) {
    return {
      rewardId,
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    };
  }

  async getEmployeeRewards(employeeId: string) {
    return [];
  }

  async getPendingRewards(companyId: string) {
    return [];
  }
}
