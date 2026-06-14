import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class AutonomousAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AutonomousAuditInterceptor.name);

  constructor(private readonly auditService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Only log state-mutating requests (POST, PATCH, PUT, DELETE)
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;
          this.logAction(request, response, duration, 'SUCCESS');
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logAction(request, error, duration, 'FAILED');
        },
      }),
    );
  }

  private async logAction(request: any, response: any, duration: number, status: string) {
    const { method, url, body, user, ip } = request;
    const tenantId = user?.tenantId || 'system';

    // Forensic Metadata for Enterprise Audit
    const auditData = {
      action: `${method} ${url}`,
      actorId: user?.id || 'anonymous',
      tenantId,
      status,
      duration: `${duration}ms`,
      ipAddress: ip,
      userAgent: request.headers['user-agent'],
      payload: this.sanitizePayload(body),
      responseStatus: response?.status || (status === 'SUCCESS' ? 200 : 500),
    };

    try {
      const auditCtx = {
        tenantId: tenantId === 'system' ? null : tenantId,
        actorId: user?.id || 'anonymous',
        actorEmail: user?.email || null,
        resourceType: 'HTTP_REQUEST',
        resourceId: url,
        metadata: {
          status,
          duration: `${duration}ms`,
          ipAddress: ip,
          userAgent: request.headers['user-agent'],
          payload: this.sanitizePayload(body),
          responseStatus: response?.status || (status === 'SUCCESS' ? 200 : 500),
        }
      };
      await this.auditService.log(auditData.action as any, auditCtx);
      this.logger.debug(`AUDIT_LOG_SUCCESS: ${auditData.action} by ${auditData.actorId}`);
    } catch (err) {
      this.logger.error('AUDIT_LOG_FAILED', err);
    }
  }

  private sanitizePayload(payload: any) {
    if (!payload) return null;
    const sensitiveFields = ['password', 'token', 'secret', 'cvv', 'card_number'];
    const sanitized = { ...payload };
    for (const field of sensitiveFields) {
      if (sanitized[field]) sanitized[field] = '********';
    }
    return sanitized;
  }
}
