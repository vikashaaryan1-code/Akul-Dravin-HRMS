import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { incrementCounter } from '../observability/observability';

/**
 * CorrelationMiddleware — attaches a unique X-Correlation-ID to every request.
 *
 * - Uses incoming header if present (forwarded from API gateway / load balancer)
 * - Generates UUID v4 if absent
 * - Injects into request object for downstream use
 * - Echoes back on response header for client-side debugging
 * - Tracks per-route metrics
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = performance.now();

    // Honour upstream correlation ID (API gateway, Nginx, Cloudflare)
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      randomUUID();

    // Attach to request for controller/service access
    (req as Request & { correlationId: string }).correlationId = correlationId;

    // Echo back on response
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Powered-By', 'Akul-Dravin-HRMS');

    // Log on response finish
    res.on('finish', () => {
      const duration = Math.round(performance.now() - start);
      const status = res.statusCode;
      const method = req.method;
      const path = req.path;
      const tenantId = (req.headers['x-tenant-id'] as string) || '-';

      // Prometheus-style counters
      incrementCounter('http_requests_total', { method, status: String(status) });
      if (duration > 1000) incrementCounter('http_slow_requests_total', { path });
      if (status >= 500) incrementCounter('http_errors_5xx_total', { path });
      if (status >= 400 && status < 500) incrementCounter('http_errors_4xx_total', { path });

      // Structured access log
      this.logger.log(
        `${method} ${path} ${status} ${duration}ms tenant=${tenantId} cid=${correlationId.slice(0, 8)}`
      );
    });

    next();
  }
}
