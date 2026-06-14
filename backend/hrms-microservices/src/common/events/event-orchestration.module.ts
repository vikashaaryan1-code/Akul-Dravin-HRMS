import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DomainEventService } from './domain-event.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'domain-events',
    }),
  ],
  providers: [DomainEventService],
  exports: [DomainEventService],
})
export class EventOrchestrationModule {}
