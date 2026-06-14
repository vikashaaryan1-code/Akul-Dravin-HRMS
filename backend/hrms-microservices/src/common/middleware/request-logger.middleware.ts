import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * REQUEST LOGGER MIDDLEWARE
 *
 * Emits a structured log line for every inbound HTTP request, including:
 * - method, path, status, duration (ms), requestId
 *
 * In production the logs are formatted as JSON by GlobalLoggerService (pino).
 * This gives full request traceability without a separate APM agent.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startAt = Date.now();

    // Attach a lightweight request ID for correlation across logs
    const requestId = (req.headers['x-request-id'] as string | undefined)
      ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startAt;

      const level: 'log' | 'warn' | 'error' =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      this.logger[level](
        `${method} ${originalUrl} ${statusCode} +${duration}ms [${requestId}]`,
        'HTTP',
      );
    });

    next();
  }
}
