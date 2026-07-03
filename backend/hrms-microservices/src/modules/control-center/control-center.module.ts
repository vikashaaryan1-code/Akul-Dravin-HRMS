import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ControlCenterController } from './control-center.controller';
import { ControlCenterGateway } from './control-center.gateway';
import { QueueDepthService } from './queue-depth.service';
import { QueueMonitorController } from './queue-monitor.controller';
import { PlatformOpsController } from './platform-ops.controller';
import { SloController } from './slo.controller';
import { PolicyEngineModule } from '../policy-engine/policy-engine.module';
import { CareerGrowthModule } from '../career-growth/career-growth.module';
import { QUEUE_PAYROLL, QUEUE_AUTOMATION, QUEUE_NOTIFICATIONS } from '../../common/queues/queue-names';

@Module({
  imports: [
    PolicyEngineModule,
    CareerGrowthModule,
    // Register queues so QueueDepthService can inject all three Queue instances
    BullModule.registerQueue(
      { name: QUEUE_PAYROLL },
      { name: QUEUE_AUTOMATION },
      { name: QUEUE_NOTIFICATIONS },
    ),
  ],
  controllers: [ControlCenterController, QueueMonitorController, PlatformOpsController, SloController],
  providers:   [ControlCenterGateway, QueueDepthService],
  exports:     [QueueDepthService],
})
export class ControlCenterModule {}
