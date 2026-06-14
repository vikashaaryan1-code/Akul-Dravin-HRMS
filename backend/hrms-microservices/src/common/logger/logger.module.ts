import { Global, Module } from '@nestjs/common';
import { GlobalLoggerService } from './logger.service';

@Global()
@Module({
  providers: [GlobalLoggerService],
  exports: [GlobalLoggerService],
})
export class LoggerModule {}
