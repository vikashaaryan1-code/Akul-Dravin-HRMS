import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { WORKFORCE_EVENTS } from '../events/events.registry';

@Injectable()
export class RedisEventBusService {
  private readonly logger = new Logger(RedisEventBusService.class.name);
  private readonly STREAM_NAME = 'workforce_governance_stream';

  constructor(
    @Inject('REDIS_PUBLISHER') private readonly redis: Redis,
  ) {}

  /**
   * Publishes an event to the Redis Stream for durable governance visibility.
   */
  async publish(eventType: string, payload: any): Promise<string> {
    try {
      const entryId = await this.redis.xadd(
        this.STREAM_NAME,
        '*',
        'type', eventType,
        'payload', JSON.stringify(payload),
        'timestamp', Date.now().toString()
      );
      
      this.logger.debug(`[EVENT] Streamed ${eventType} -> ID: ${entryId}`);
      return entryId;
    } catch (error) {
      this.logger.error(`Failed to publish event to Redis Stream: ${error.message}`);
      throw error;
    }
  }

  getStreamName() {
    return this.STREAM_NAME;
  }
}
