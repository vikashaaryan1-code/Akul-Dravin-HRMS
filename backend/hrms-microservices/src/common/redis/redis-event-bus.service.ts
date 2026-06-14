import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { WORKFORCE_EVENTS } from '../events/events.registry';

@Injectable()
export class RedisEventBusService {
  private readonly logger = new Logger(RedisEventBusService.name);
  private readonly STREAM_NAME = 'workforce_governance_stream';

  constructor(
    @Inject('REDIS_PUBLISHER') private readonly redis: Redis,
  ) {}

  /**
   * Publishes an event to the Redis Stream for durable governance visibility.
   */
  async publish(eventType: keyof typeof WORKFORCE_EVENTS | string, payload: unknown): Promise<string> {
    try {
      const entryId = await this.redis.xadd(
        this.STREAM_NAME,
        '*',
        'type', eventType,
        'payload', JSON.stringify(payload),
        'timestamp', Date.now().toString()
      );

      this.logger.debug(`[EVENT] Streamed ${eventType} -> ID: ${entryId}`);
      // xadd returns null only if MAXLEN 0 is used; in normal usage it always returns a string.
      return entryId!;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to publish event to Redis Stream: ${message}`);
      throw error;
    }
  }

  getStreamName() {
    return this.STREAM_NAME;
  }
}
