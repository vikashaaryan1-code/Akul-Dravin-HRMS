import { Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';

export interface LeaderboardEntry {
  employeeId: string;
  name: string;
  points: number;
  rank: number;
  badges: string[];
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  async getTopPerformers(): Promise<LeaderboardEntry[]> {
    const tenantId = TenantContext.getTenantId();
    this.logger.log(`Fetching gamification leaderboard for tenant ${tenantId}`);
    
    return [
      {
        employeeId: 'emp-101',
        name: 'Rahul Mehta',
        points: 4250,
        rank: 1,
        badges: ['Bug Squasher', 'Architect']
      },
      {
        employeeId: 'emp-205',
        name: 'Priya Sharma',
        points: 3900,
        rank: 2,
        badges: ['Mentor', 'High Performer']
      },
      {
        employeeId: 'emp-112',
        name: 'Amit Kulkarni',
        points: 3100,
        rank: 3,
        badges: ['Innovator']
      }
    ];
  }

  async awardPoints(employeeId: string, points: number, reason: string): Promise<void> {
    const tenantId = TenantContext.getTenantId();
    this.logger.log(`Awarding ${points} points to ${employeeId} in tenant ${tenantId}. Reason: ${reason}`);
    // Logic to increment points in DB
  }
}
