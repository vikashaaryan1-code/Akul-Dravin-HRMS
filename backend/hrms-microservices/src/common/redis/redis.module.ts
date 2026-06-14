import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

function createRedisClient(configService: ConfigService): Redis {
  const url = configService.get<string>('REDIS_URL');
  const baseOptions = {
    lazyConnect: true,           // don't crash if Redis is not yet up at boot
    maxRetriesPerRequest: 3,
    connectTimeout: 10_000,
    keepAlive: 30_000,
    enableReadyCheck: true,
    retryStrategy: (times: number) => Math.min(times * 200, 5_000),
  };
  const client = url
    ? new Redis(url, baseOptions)
    : new Redis({
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: configService.get<number>('REDIS_PORT') || 6379,
        ...baseOptions,
      });

  // Prevent unhandled-error crash — ioredis emits errors even when lazyConnect=true
  // The health endpoint surfaces Redis status as 'degraded' when down.
  client.on('error', (err: Error) => {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.error(`[RedisClient] connection error: ${err.message}`);
    }
  });

  return client;
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => createRedisClient(configService),
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_PUBLISHER',
      useFactory: (configService: ConfigService) => createRedisClient(configService),
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}

