import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { GamificationController } from './gamification.controller';

@Module({
  controllers: [GamificationController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class GamificationModule {}
