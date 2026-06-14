import { Injectable } from '@nestjs/common';
import { ActivityFeedService } from '../../../modules/activity/activity-feed.service';
import { ProjectionHandler, DomainEventEnvelope } from '../domain-event.types';
import { TASK_EVENTS, LEAVE_EVENTS, PAYROLL_EVENTS } from '../../governance/events/domain-events';

/**
 * ACTIVITY PROJECTION HANDLER
 *
 * Severity: CRITICAL
 * Subscribes to: task, leave, payroll domain events
 *
 * Writes every governed domain event to the unified activity feed.
 * Activity continuity is a critical invariant — every operational event
 * must appear in the activity timeline for HR/admin visibility.
 *
 * Failure behaviour: throws → calling operation aborts.
 * ActivityFeedService.record() already swallows DB errors internally
 * (see activity-feed.service.ts), so a throw here indicates a structural
 * failure (DI misconfiguration, connection loss, etc.).
 */
@Injectable()
export class ActivityProjectionHandler implements ProjectionHandler {
  readonly name = 'ActivityProjectionHandler';
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
    PAYROLL_EVENTS.BATCH_COMPLETED,
    PAYROLL_EVENTS.BATCH_REVERSED,
  ] as const;

  constructor(private readonly activityFeed: ActivityFeedService) {}

  async handle(envelope: DomainEventEnvelope): Promise<void> {
    const payload = envelope.payload as Record<string, unknown>;

    await this.activityFeed.record({
      tenantId: envelope.tenantId,
      actorId: envelope.actorId ?? null,
      entityType: this.extractEntityType(envelope.event),
      entityId: (payload['entityId'] as string | undefined) ?? null,
      action: envelope.event,
      description: this.buildDescription(envelope),
      metadata: {
        correlationId: envelope.correlationId,
        occurredAt: envelope.occurredAt,
        ...payload,
      },
    });
  }

  private extractEntityType(event: string): string {
    // Extract context from '<context>.<aggregate>.<event>'
    return event.split('.')[0] ?? event;
  }

  private buildDescription(envelope: DomainEventEnvelope): string {
    const payload = envelope.payload as Record<string, unknown>;
    const title = payload['title'] ?? payload['name'] ?? payload['entityId'] ?? 'entity';
    return `${envelope.event}: ${String(title)}`;
  }
}
