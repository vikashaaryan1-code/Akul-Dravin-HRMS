import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.get('REDIS_URL') || 'redis://localhost:6379');
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_PUBLISHER',
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.get('REDIS_URL') || 'redis://localhost:6379');
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', 'REDIS_PUBLISHER'],
})
export class RedisModule {}
