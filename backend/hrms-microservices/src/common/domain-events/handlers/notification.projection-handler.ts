import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../../modules/notification/notification.service';
import { ProjectionHandler, DomainEventEnvelope } from '../domain-event.types';
import { TASK_EVENTS, LEAVE_EVENTS } from '../../governance/events/domain-events';

/**
 * NOTIFICATION PROJECTION HANDLER
 *
 * Severity: BEST_EFFORT
 * Subscribes to: task assignment, leave approval/rejection events
 *
 * Dispatches real-time notifications to affected employees.
 * Notification delivery is a UX concern — best-effort delivery is correct.
 * A failed notification does not undo the underlying business operation.
 *
 * Failure behaviour: swallowed silently.
 * Notifications use BullMQ queue with 3 retries (exponential backoff).
 * A failure at the handler level means the queue itself is unavailable —
 * acceptable degradation.
 */
@Injectable()
export class NotificationProjectionHandler implements ProjectionHandler {
  readonly name = 'NotificationProjectionHandler';
  readonly severity = 'best_effort' as const;
  readonly handles = [
    TASK_EVENTS.CREATED,
    TASK_EVENTS.REASSIGNED,
    LEAVE_EVENTS.REQUEST_APPROVED,
    LEAVE_EVENTS.REQUEST_REJECTED,
  ] as const;

  constructor(private readonly notificationService: NotificationService) {}

  async handle(envelope: DomainEventEnvelope): Promise<void> {
    const payload = envelope.payload as Record<string, unknown>;
    const recipientId = payload['assigneeId'] ?? payload['employeeId'] ?? payload['recipientId'];

    if (!recipientId) {
      return; // No recipient resolved — silent skip (best_effort)
    }

    const { title, message } = this.buildNotificationCopy(envelope);

    await this.notificationService.createAndPush({
      tenantId: envelope.tenantId,
      userId: recipientId as string,
      type: envelope.event,
      title,
      message,
      status: 'Unread',
    });
  }

  private buildNotificationCopy(envelope: DomainEventEnvelope): {
    title: string;
    message: string;
  } {
    const payload = envelope.payload as Record<string, unknown>;
    const entityTitle = (payload['title'] as string | undefined) ?? 'An item';

    const copyMap: Record<string, { title: string; message: string }> = {
      [TASK_EVENTS.CREATED]: {
        title: 'New Task Assigned',
        message: `You have been assigned: "${entityTitle}"`,
      },
      [TASK_EVENTS.REASSIGNED]: {
        title: 'Task Reassigned',
        message: `Task "${entityTitle}" has been assigned to you.`,
      },
      [LEAVE_EVENTS.REQUEST_APPROVED]: {
        title: 'Leave Request Approved',
        message: `Your leave request has been approved.`,
      },
      [LEAVE_EVENTS.REQUEST_REJECTED]: {
        title: 'Leave Request Rejected',
        message: `Your leave request has been rejected.`,
      },
    };

    return (
      copyMap[envelope.event] ?? {
        title: 'Platform Update',
        message: `An update occurred: ${envelope.event}`,
      }
    );
  }
}
