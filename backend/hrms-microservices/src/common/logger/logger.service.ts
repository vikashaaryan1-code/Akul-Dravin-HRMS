import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class GlobalLoggerService implements LoggerService {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' 
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });

  log(message: any, context?: string) {
    this.logger.info({ context, msg: message });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error({ context, msg: message, trace });
  }

  warn(message: any, context?: string) {
    this.logger.warn({ context, msg: message });
  }

  debug(message: any, context?: string) {
    this.logger.debug({ context, msg: message });
  }

  verbose(message: any, context?: string) {
    this.logger.trace({ context, msg: message });
  }
}
