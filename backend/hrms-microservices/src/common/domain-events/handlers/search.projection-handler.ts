import { Injectable } from '@nestjs/common';
import { SearchService } from '../../../modules/search/search.service';
import { ProjectionHandler, DomainEventEnvelope } from '../domain-event.types';
import { TASK_EVENTS } from '../../governance/events/domain-events';

/**
 * SEARCH PROJECTION HANDLER
 *
 * Severity: EVENTUAL
 * Subscribes to: task create/update/complete/delete events
 *
 * Maintains the search index in sync with task mutations.
 * Search index consistency is eventually consistent by design —
 * a temporary search gap does not constitute data loss.
 *
 * Failure behaviour: logs WARN, operation continues.
 * SearchService.upsertIndex() already swallows DB errors internally.
 * A failure here is unusual (connection loss, schema mismatch).
 *
 * Upgrade path: swap SearchService.upsertIndex() for Meilisearch/
 * OpenSearch client without changing this handler.
 */
@Injectable()
export class SearchProjectionHandler implements ProjectionHandler {
  readonly name = 'SearchProjectionHandler';
  readonly severity = 'eventual' as const;
  readonly handles = [
    TASK_EVENTS.CREATED,
    TASK_EVENTS.UPDATED,
    TASK_EVENTS.COMPLETED,
    TASK_EVENTS.REASSIGNED,
  ] as const;

  constructor(private readonly searchService: SearchService) {}

  async handle(envelope: DomainEventEnvelope): Promise<void> {
    const payload = envelope.payload as Record<string, unknown>;

    if (envelope.event === TASK_EVENTS.DELETED) {
      await this.searchService.removeFromIndex(
        envelope.tenantId,
        'task',
        payload['entityId'] as string,
      );
      return;
    }

    await this.searchService.upsertIndex({
      tenantId: envelope.tenantId,
      entityType: 'task',
      entityId: (payload['entityId'] as string) ?? '',
      title: (payload['title'] as string | undefined) ?? 'Untitled Task',
      body: (payload['description'] as string | undefined) ?? '',
      tags: (payload['tags'] as string[] | undefined) ?? [],
      metadata: {
        status: payload['status'],
        priority: payload['priority'],
        assigneeId: payload['assigneeId'],
        projectId: payload['projectId'],
        correlationId: envelope.correlationId,
      },
    });
  }
}
