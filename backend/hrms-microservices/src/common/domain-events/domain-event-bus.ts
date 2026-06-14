import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DomainEventName } from '../governance/events/domain-events';
import { DomainEventEnvelope, ProjectionHandler } from './domain-event.types';

/**
 * DOMAIN EVENT BUS — GOVERNED PROPAGATION ROUTER
 *
 * The single emission point for all domain events in the platform.
 * Routes typed events to registered projection handlers with
 * severity-aware execution semantics.
 *
 * Architecture:
 *   Service calls bus.emit('task.assignment.created', envelope)
 *   Bus routes to all registered handlers for that event name
 *   Each handler executes according to its declared severity:
 *     - critical    → await, throw on failure (blocks the calling operation)
 *     - eventual    → await, log on failure (operation continues)
 *     - best_effort → void (fire and forget, failure swallowed)
 *
 * This replaces the scattered service-to-service coupling pattern:
 *   BEFORE: TaskService → AuditService, ActivityService, SearchService, NotifService
 *   AFTER:  TaskService → DomainEventBus → [AuditHandler, ActivityHandler, ...]
 *
 * Governance integration:
 *   The bus does NOT directly assert DomainContracts at runtime —
 *   that is CI's responsibility via EventBusSpy.assertSatisfiesContract().
 *   The bus's job is correct routing and severity enforcement, not verification.
 *
 * Registration:
 *   Handlers are registered via registerHandler() at module initialization.
 *   Each module registers its own projection handlers for the events it owns.
 *
 * Observability:
 *   Every emission logs: event name, tenant, correlation ID, handler count,
 *   and per-handler success/failure status. Compatible with pino structured logs.
 */
@Injectable()
export class DomainEventBus {
  private readonly logger = new Logger(DomainEventBus.name);
  private readonly handlers = new Map<DomainEventName, ProjectionHandler[]>();

  /**
   * Register a projection handler for one or more event names.
   * Called during module initialization for each downstream system.
   *
   * A single handler can subscribe to multiple events (e.g., AuditHandler
   * handles task.assignment.created, task.assignment.completed, etc.)
   */
  registerHandler(handler: ProjectionHandler): void {
    for (const eventName of handler.handles) {
      if (!this.handlers.has(eventName)) {
        this.handlers.set(eventName, []);
      }
      this.handlers.get(eventName)!.push(handler);
      this.logger.debug(
        `Handler registered: ${handler.name} → ${eventName} [${handler.severity}]`,
      );
    }
  }

  /**
   * Emit a domain event to all registered projection handlers.
   *
   * Execution model (severity-ordered):
   *  1. All CRITICAL handlers run first, sequentially, awaited.
   *     If any critical handler throws → error propagates to caller.
   *  2. All EVENTUAL handlers run concurrently, awaited together.
   *     If any eventual handler throws → logged as WARN, caller continues.
   *  3. All BEST_EFFORT handlers fire-and-forget (void, not awaited).
   *     Failures are swallowed — caller never knows.
   *
   * @param event          Canonical event name from domain-events.ts.
   * @param tenantId       Tenant scope — mandatory.
   * @param payload        Event-specific data.
   * @param options.correlationId   HTTP request trace ID — threads through all handlers.
   * @param options.actorId         User/system that triggered the originating operation.
   * @param options.causationId     ID of the upstream event that caused this emission.
   * @param options.aggregateId     Root entity ID — for replay partitioning.
   * @param options.aggregateType   Root entity class name — for replay type filtering.
   * @param options.version         Aggregate sequence number — for optimistic concurrency.
   */
  async emit<T = Record<string, unknown>>(
    event: DomainEventName,
    tenantId: string,
    payload: T,
    options: {
      correlationId?: string;
      actorId?: string;
      causationId?: string;
      aggregateId?: string;
      aggregateType?: string;
      version?: number;
    } = {},
  ): Promise<void> {
    // Bus generates the unique event ID — callers never supply it.
    // This guarantees every envelope has a globally unique ID for deduplication.
    const eventId = randomUUID();

    const envelope: DomainEventEnvelope<T> = {
      id:            eventId,
      event,
      tenantId,
      correlationId: options.correlationId,
      causationId:   options.causationId,
      actorId:       options.actorId,
      aggregateId:   options.aggregateId,
      aggregateType: options.aggregateType,
      version:       options.version,
      occurredAt:    new Date().toISOString(),
      payload,
    };

    const registered = this.handlers.get(event) ?? [];

    if (registered.length === 0) {
      this.logger.debug(`DomainEventBus: no handlers registered for "${event}"`);
      return;
    }

    this.logger.log(
      `DomainEventBus: emitting "${event}" to ${registered.length} handler(s) ` +
        `[id=${eventId}] [tenant=${tenantId}] [correlationId=${options.correlationId ?? 'none'}]`,
    );

    const critical = registered.filter((h) => h.severity === 'critical');
    const eventual = registered.filter((h) => h.severity === 'eventual');
    const bestEffort = registered.filter((h) => h.severity === 'best_effort');

    // ── Phase 1: Critical handlers — sequential, blocking ─────────────────
    for (const handler of critical) {
      try {
        await handler.handle(envelope as DomainEventEnvelope);
        this.logger.debug(`  ✓ [critical] ${handler.name}`);
      } catch (err) {
        this.logger.error(
          `  ✗ [critical] ${handler.name} FAILED for "${event}" ` +
            `[correlationId=${options.correlationId ?? 'none'}]: ${String(err)}`,
        );
        // Critical handler failure propagates — caller receives the error
        throw err;
      }
    }

    // ── Phase 2: Eventual handlers — concurrent, awaited, non-blocking ────
    const eventualResults = await Promise.allSettled(
      eventual.map((handler) => handler.handle(envelope as DomainEventEnvelope)),
    );

    for (let i = 0; i < eventualResults.length; i++) {
      const result = eventualResults[i];
      const handler = eventual[i];
      if (result.status === 'rejected') {
        this.logger.warn(
          `  ⚠ [eventual] ${handler!.name} failed for "${event}" ` +
            `[correlationId=${options.correlationId ?? 'none'}]: ${String(result.reason)}`,
        );
        // Eventual failure is logged but not re-thrown
      } else {
        this.logger.debug(`  ✓ [eventual] ${handler!.name}`);
      }
    }

    // ── Phase 3: Best-effort handlers — fire and forget ───────────────────
    for (const handler of bestEffort) {
      void handler
        .handle(envelope as DomainEventEnvelope)
        .then(() => this.logger.debug(`  ✓ [best_effort] ${handler.name}`))
        .catch((err: unknown) =>
          this.logger.debug(
            `  ⚑ [best_effort] ${handler.name} failed silently: ${String(err)}`,
          ),
        );
    }
  }

  /**
   * Returns all registered handler names for a given event.
   * Used in governance tooling and test assertions.
   */
  getHandlerNames(event: DomainEventName): string[] {
    return (this.handlers.get(event) ?? []).map((h) => h.name);
  }

  /**
   * Returns all event names that have at least one registered handler.
   */
  getRegisteredEvents(): DomainEventName[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * OUTBOX DELIVERY PATH — Commit 8
   *
   * Delivers a pre-built envelope from the outbox to registered handlers.
   * Used by OutboxDeliveryProcessor — the envelope is deserialized from
   * the governance_outbox_events table and routed as-if freshly emitted.
   *
   * Critical difference from emit():
   *   emit()               → generates a new UUID, builds a new envelope
   *   deliverFromOutbox()  → uses the original envelope.id from emission time
   *
   * Preserving envelope.id is mandatory for ReplayProtectionStore deduplication:
   *   Handler checks hasProcessed(envelope.id, handlerName)
   *   If the delivery queue retries (BullMQ retry or duplicate delivery),
   *   the same envelope.id hits the same handler → skipped by replay store.
   *
   * This method applies identical severity-based routing as emit().
   */
  async deliverFromOutbox(
    event: DomainEventName,
    envelope: DomainEventEnvelope,
  ): Promise<void> {
    const registered = this.handlers.get(event) ?? [];

    if (registered.length === 0) {
      this.logger.debug(`deliverFromOutbox: no handlers for "${event}"`);
      return;
    }

    this.logger.log(
      `OUTBOX_ROUTE: "${event}" → ${registered.length} handler(s) ` +
        `[id=${envelope.id}] [tenant=${envelope.tenantId}]`,
    );

    const critical   = registered.filter((h) => h.severity === 'critical');
    const eventual   = registered.filter((h) => h.severity === 'eventual');
    const bestEffort = registered.filter((h) => h.severity === 'best_effort');

    // Critical: sequential, blocking — same semantics as emit()
    for (const handler of critical) {
      try {
        await handler.handle(envelope);
      } catch (err) {
        this.logger.error(
          `[outbox-delivery][critical] ${handler.name} FAILED for "${event}" ` +
            `[envelopeId=${envelope.id}]: ${String(err)}`,
        );
        throw err;
      }
    }

    // Eventual: concurrent, awaited, non-blocking
    await Promise.allSettled(
      eventual.map((h) => h.handle(envelope).catch((err: unknown) => {
        this.logger.warn(
          `[outbox-delivery][eventual] ${h.name} failed: ${String(err)}`,
        );
      })),
    );

    // Best-effort: fire-and-forget
    for (const handler of bestEffort) {
      void handler.handle(envelope).catch(() => {});
    }
  }
}
