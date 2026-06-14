// ⚠️ WORKER SPLIT INVARIANT: A2zRolloutProcessor is intentionally registered
// here (inside the feature module) while running in monolith mode.
// DO NOT add it to resolveWorkerModules() without first removing it from
// this providers[] array. Double registration → every job executes twice.
// See: docs/WORKER_SPLIT_PLAN.md
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { A2zEngineController } from './a2z-engine.controller';
import { A2zEngineService } from './a2z-engine.service';
import { A2zRolloutProcessor } from './a2z-rollout.processor';
import { A2zWorkflowEntity, A2zRolloutRequestEntity, A2zMarketplaceJobEntity } from '../../database/entities/a2z-engine.entities';
import { QUEUE_AUTOMATION } from '../../common/queues/queue-names';

@Module({
  imports: [
    TypeOrmModule.forFeature([A2zWorkflowEntity, A2zRolloutRequestEntity, A2zMarketplaceJobEntity]),
    BullModule.registerQueue({
      name: QUEUE_AUTOMATION,
    }),
  ],
  controllers: [A2zEngineController],
  providers:   [A2zEngineService, A2zRolloutProcessor],
  exports:     [A2zEngineService],
})
export class A2zEngineModule {}
