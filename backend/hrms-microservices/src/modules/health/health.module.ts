import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { QUEUE_NOTIFICATIONS, QUEUE_EMAILS, QUEUE_AI_JOBS, QUEUE_AUTOMATION } from '../../common/queues/queue-names';

/**
 * HealthModule — exposes GET /health and GET /health/ready.
 * Registers queue references for health introspection (read-only; no workers here).
 * No authentication guard — must remain publicly accessible for load balancers.
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NOTIFICATIONS },
      { name: QUEUE_EMAILS },
      { name: QUEUE_AI_JOBS },
      { name: QUEUE_AUTOMATION },
    ),
  ],
  controllers: [HealthController],
})
export class HealthModule {}

