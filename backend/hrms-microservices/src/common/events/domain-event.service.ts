import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface DomainEvent {
  type: string;
  tenantId: string;
  payload: any;
  metadata: {
    timestamp: string;
    correlationId: string;
    version: string;
  };
}

@Injectable()
export class DomainEventService {
  private readonly logger = new Logger(DomainEventService.name);

  constructor(
    @InjectQueue('domain-events')
    private readonly eventQueue: Queue,
  ) {}

  /**
   * Publishes a domain event to the autonomous orchestration bus.
   * "Fully Automatic A2Z" central communication method.
   */
  async publish(type: string, tenantId: string, payload: any) {
    const event: DomainEvent = {
      type,
      tenantId,
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: Math.random().toString(36).substring(7).toUpperCase(),
        version: '1.0',
      },
    };

    this.logger.log(`Publishing Domain Event: [${type}] correlationId=${event.metadata.correlationId}`);

    // Persist to BullMQ for asynchronous, retry-safe orchestration
    await this.eventQueue.add(type, event, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
    });

    return event;
  }
}
