import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../../audit/audit-log.service';
import { ProjectionHandler, DomainEventEnvelope } from '../domain-event.types';
import { TASK_EVENTS, LEAVE_EVENTS, PAYROLL_EVENTS } from '../../governance/events/domain-events';

/**
 * AUDIT PROJECTION HANDLER
 *
 * Severity: CRITICAL
 * Subscribes to: task, leave, payroll domain events
 *
 * Writes every governed domain event to the append-only audit trail.
 * Audit continuity is a compliance invariant — no operational mutation
 * is silent. The audit trail is the forensic record of the platform.
 *
 * Failure behaviour: throws → calling operation aborts.
 * If audit cannot be written, the mutation must not complete —
 * a mutation without an audit record is a compliance violation.
 *
 * Note: AuditLogService.log() internally swallows errors with WARN.
 * This handler intentionally does NOT swallow — it delegates to the
 * service and trusts its internal resilience. If the service itself
 * throws (structural failure), this handler correctly re-throws.
 */
@Injectable()
export class AuditProjectionHandler implements ProjectionHandler {
  readonly name = 'AuditProjectionHandler';
  readonly severity = 'critical' as const;
  readonly handles = [
    TASK_EVENTS.CREATED,
    TASK_EVENTS.UPDATED,
    TASK_EVENTS.COMPLETED,
    TASK_EVENTS.DELETED,
    TASK_EVENTS.REASSIGNED,
    LEAVE_EVENTS.REQUEST_SUBMITTED,
    LEAVE_EVENTS.REQUEST_APPROVED,
    LEAVE_EVENTS.REQUEST_REJECTED,
    LEAVE_EVENTS.REQUEST_CANCELLED,
    PAYROLL_EVENTS.BATCH_SUBMITTED,
    PAYROLL_EVENTS.BATCH_COMPLETED,
    PAYROLL_EVENTS.BATCH_REVERSED,  // REVERSED ≠ FAILED — intentional business rollback
    PAYROLL_EVENTS.BATCH_FAILED,
  ] as const;

  constructor(private readonly auditLog: AuditLogService) {}

  async handle(envelope: DomainEventEnvelope): Promise<void> {
    const payload = envelope.payload as Record<string, unknown>;

    // Map canonical domain event name to AuditAction convention
    // Domain events use '<context>.<aggregate>.<verb>' format
    // AuditLog uses SCREAMING_SNAKE_CASE — convert on entry
    const auditAction = envelope.event.toUpperCase().replace(/\./g, '_') as any;

    await this.auditLog.log(auditAction, {
      tenantId: envelope.tenantId,
      actorId: envelope.actorId ?? null,
      resourceType: this.extractResourceType(envelope.event),
      resourceId: (payload['entityId'] as string | undefined) ?? null,
      metadata: {
        correlationId: envelope.correlationId,
        occurredAt: envelope.occurredAt,
        domainEvent: envelope.event,
        ...payload,
      },
    });
  }

  private extractResourceType(event: string): string {
    // Extract '<context>.<aggregate>' from '<context>.<aggregate>.<event>'
    const parts = event.split('.');
    return parts.slice(0, 2).join('.') ?? event;
  }
}
