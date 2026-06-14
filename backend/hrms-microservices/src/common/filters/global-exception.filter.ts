import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const isProd   = process.env.NODE_ENV === 'production';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as Record<string, unknown>;
        message = (r['message'] as string) || exception.message;
        // Validation errors come as array — include in dev/staging
        if (!isProd && Array.isArray(r['message'])) {
          details = r['message'];
          message = 'Validation failed';
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = isProd ? 'Internal server error' : exception.message;
    } else {
      message = 'Internal server error';
    }

    // Always log at warn+ level — omit stack in production
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status} | ${message}`,
        !isProd && exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${status} | ${message}`);
    }

    const body: Record<string, unknown> = {
      success: false,
      data:    null,
      error:   message,
      statusCode: status,
      path:    request.url,
      timestamp: new Date().toISOString(),
    };

    if (details !== undefined) {
      body['details'] = details;
    }

    response.status(status).json(body);
  }
}
