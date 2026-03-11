import { Module } from '@nestjs/common';
import { PerformanceRewardsController } from './performance-rewards.controller';
import { PerformanceRewardsService } from './performance-rewards.service';

@Module({
  controllers: [PerformanceRewardsController],
  providers: [PerformanceRewardsService],
  exports: [PerformanceRewardsService],
})
export class PerformanceRewardsModule {}
