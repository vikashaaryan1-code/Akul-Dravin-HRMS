import { Module } from '@nestjs/common';
import { PingPlanController } from './ping-plan.controller';
import { PingPlanService } from './ping-plan.service';

@Module({
  controllers: [PingPlanController],
  providers: [PingPlanService],
  exports: [PingPlanService],
})
export class PingPlanModule {}
