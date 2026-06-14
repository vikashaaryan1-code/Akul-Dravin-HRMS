import { DomainEventName } from './domain-events';
import { DomainContractRegistry, ContractEffect } from './domain-contract-registry';

/**
 * EMITTED EVENT RECORD
 *
 * Captures a single event emission for assertion by the EventBusSpy.
 * Includes the payload for deeper assertion on specific test cases.
 */
export interface EmittedEvent {
  readonly event: string;
  readonly payload: unknown;
  readonly timestamp: string;
}

/**
 * CONTRACT ASSERTION RESULT
 *
 * Returned by assertSatisfiesContract() with full diagnostic context.
 * Used for CI reporting and structured failure output.
 */
export interface ContractAssertionResult {
  /** The trigger event being asserted. */
  trigger: DomainEventName;

  /** Effects that were expected AND emitted (governed correctly). */
  satisfied: ContractEffect[];

  /** Critical effects that were expected but NOT emitted — hard failures. */
  missingCritical: ContractEffect[];

  /** Eventual effects that were expected but NOT emitted — warnings. */
  missingEventual: ContractEffect[];

  /** Best-effort effects not emitted — informational only. */
  missingBestEffort: ContractEffect[];

  /** Whether all critical effects were satisfied. */
  criticalsSatisfied: boolean;
}

/**
 * EVENT BUS SPY — TEST DOUBLE FOR EVENT PROPAGATION GOVERNANCE
 *
 * A purpose-built test double for asserting domain event propagation contracts.
 * It does NOT wrap NestJS EventEmitter — it is injected via NestJS DI override
 * to replace real service calls in test suites.
 *
 * Architecture:
 *  The platform uses direct service injection (ActivityFeedService.record(),
 *  NotificationService.dispatch(), etc.) rather than a pub/sub event bus.
 *  Therefore EventBusSpy is a mock of those specific service interfaces,
 *  not a generic event bus wrapper.
 *
 * Usage pattern:
 *
 *   const spy = new EventBusSpy();
 *
 *   // Use spy as a mock in NestJS test module overrides:
 *   builder.overrideProvider(ActivityFeedService).useValue(spy.asActivityFeedMock());
 *   builder.overrideProvider(SearchService).useValue(spy.asSearchMock());
 *   builder.overrideProvider(NotificationService).useValue(spy.asNotificationMock());
 *   builder.overrideProvider(AuditLogService).useValue(spy.asAuditMock());
 *
 *   // Execute the operation under test:
 *   await taskService.createTask(payload);
 *
 *   // Assert propagation against the registered contract:
 *   spy.assertSatisfiesContract('task.assignment.created');
 *   // or check individual effects:
 *   spy.toHaveEmitted('audit.entry.written');
 *   spy.toHaveEmitted('search.document.indexed');
 *
 * The key governance property:
 *   A future developer who removes an event emission will BREAK THIS TEST.
 *   That is the purpose. The spy is the enforcement mechanism.
 */
export class EventBusSpy {
  private readonly emitted: EmittedEvent[] = [];

  /**
   * Record an event emission. Called by mock service implementations.
   * @param event  The canonical event name (from domain-events.ts)
   * @param payload  The event payload for inspection assertions.
   */
  emit(event: string, payload: unknown = {}): void {
    this.emitted.push({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Assertion API ─────────────────────────────────────────────────────────

  /**
   * Assert that a specific event was emitted at least once.
   * Throws a descriptive error if the event was not emitted.
   *
   * Use in Jest tests: spy.toHaveEmitted('audit.entry.written')
   */
  toHaveEmitted(event: DomainEventName | string): void {
    const found = this.emitted.some((e) => e.event === event);
    if (!found) {
      const emittedList =
        this.emitted.length === 0
          ? '(none)'
          : this.emitted.map((e) => `  • ${e.event}`).join('\n');
      throw new Error(
        `[EventBusSpy] Expected event "${event}" to have been emitted, but it was not.\n` +
          `Emitted events:\n${emittedList}\n\n` +
          `This is a domain propagation contract violation. ` +
          `Ensure the service emits "${event}" after the operation.`,
      );
    }
  }

  /**
   * Assert that a specific event was NOT emitted.
   * Useful for verifying events are not emitted on failed operations.
   */
  toNotHaveEmitted(event: DomainEventName | string): void {
    const found = this.emitted.some((e) => e.event === event);
    if (found) {
      throw new Error(
        `[EventBusSpy] Expected event "${event}" NOT to have been emitted, but it was.`,
      );
    }
  }

  /**
   * Get all payloads for a specific event name.
   * Use for deeper payload-level assertions.
   */
  getPayloadsFor(event: DomainEventName | string): unknown[] {
    return this.emitted.filter((e) => e.event === event).map((e) => e.payload);
  }

  /**
   * Get the complete list of emitted event names (ordered by emission time).
   * Use for ordered propagation sequence assertions.
   */
  getEmittedNames(): string[] {
    return this.emitted.map((e) => e.event);
  }

  /**
   * Get the full emission log — all events with payloads and timestamps.
   */
  getEmissionLog(): EmittedEvent[] {
    return [...this.emitted];
  }

  /**
   * Assert propagation satisfies the registered DomainContract for a trigger event.
   *
   * Severity enforcement:
   *  - critical    → throws immediately if missing (hard CI failure).
   *  - eventual    → console.warn only (tracked, not failed).
   *  - best_effort → recorded in result, no warning.
   *
   * @throws Error if any CRITICAL effect was not emitted.
   * @returns ContractAssertionResult with full diagnostic breakdown.
   */
  assertSatisfiesContract(trigger: DomainEventName): ContractAssertionResult {
    const contract = DomainContractRegistry.getRequiredContract(trigger);
    const emittedNames = new Set(this.getEmittedNames());

    const satisfied: ContractEffect[] = [];
    const missingCritical: ContractEffect[] = [];
    const missingEventual: ContractEffect[] = [];
    const missingBestEffort: ContractEffect[] = [];

    for (const effect of contract.effects) {
      if (emittedNames.has(effect.event)) {
        satisfied.push(effect);
      } else {
        switch (effect.severity) {
          case 'critical':
            missingCritical.push(effect);
            break;
          case 'eventual':
            missingEventual.push(effect);
            break;
          case 'best_effort':
            missingBestEffort.push(effect);
            break;
        }
      }
    }

    // Warn on missing eventual effects
    for (const effect of missingEventual) {
      console.warn(
        `[EventBusSpy] CONTRACT WARNING: Eventual effect "${effect.event}" was not emitted ` +
          `for trigger="${trigger}". Rationale: ${effect.rationale}`,
      );
    }

    const result: ContractAssertionResult = {
      trigger,
      satisfied,
      missingCritical,
      missingEventual,
      missingBestEffort,
      criticalsSatisfied: missingCritical.length === 0,
    };

    // Hard fail on any missing critical effects
    if (missingCritical.length > 0) {
      const missingList = missingCritical
        .map((e) => `  • "${e.event}" — ${e.rationale}`)
        .join('\n');
      const emittedList =
        this.emitted.length === 0
          ? '  (none)'
          : this.emitted.map((e) => `  • ${e.event}`).join('\n');

      throw new Error(
        `[EventBusSpy] DOMAIN CONTRACT VIOLATION for trigger="${trigger}"\n\n` +
          `${contract.description ? `Contract: ${contract.description}\n\n` : ''}` +
          `Missing CRITICAL effects (${missingCritical.length}):\n${missingList}\n\n` +
          `Emitted events:\n${emittedList}\n\n` +
          `A future developer removed or bypassed required event propagation. ` +
          `These events are architectural invariants, not optional side-effects. ` +
          `Restore the missing emissions before merging.`,
      );
    }

    return result;
  }

  /**
   * Reset the spy between test cases.
   * Call in beforeEach() to prevent cross-test contamination.
   */
  reset(): void {
    this.emitted.length = 0;
  }

  // ── NestJS Service Mock Factories ─────────────────────────────────────────
  // These return objects that satisfy the interfaces of real platform services,
  // wired to the spy's emit() so all service calls are captured.

  /**
   * Mock for ActivityFeedService.
   * Use: builder.overrideProvider(ActivityFeedService).useValue(spy.asActivityFeedMock())
   */
  asActivityFeedMock(): { record: (payload: unknown) => Promise<void> } {
    return {
      record: async (payload: unknown) => {
        this.emit('activity.feed.logged', payload);
      },
    };
  }

  /**
   * Mock for SearchService (index upsert operations).
   * Use: builder.overrideProvider(SearchService).useValue(spy.asSearchMock())
   */
  asSearchMock(): {
    indexDocument: (entityType: string, entityId: string, data: unknown) => Promise<void>;
    removeDocument: (entityType: string, entityId: string) => Promise<void>;
    upsertIndex: (payload: any) => Promise<void>;
    removeFromIndex: (tenantId: string, entityType: string, entityId: string) => Promise<void>;
  } {
    return {
      indexDocument: async (entityType: string, entityId: string, data: unknown) => {
        this.emit('search.document.indexed', { entityType, entityId, data });
      },
      removeDocument: async (entityType: string, entityId: string) => {
        this.emit('search.document.removed', { entityType, entityId });
      },
      upsertIndex: async (payload: any) => {
        this.emit('search.document.indexed', { entityType: payload.entityType, entityId: payload.entityId, data: payload });
      },
      removeFromIndex: async (tenantId: string, entityType: string, entityId: string) => {
        this.emit('search.document.removed', { entityType, entityId });
      },
    };
  }

  /**
   * Mock for NotificationService.
   * Use: builder.overrideProvider(NotificationService).useValue(spy.asNotificationMock())
   */
  asNotificationMock(): {
    dispatch: (payload: unknown) => Promise<void>;
    send: (payload: unknown) => Promise<void>;
    createAndPush: (payload: unknown) => Promise<void>;
  } {
    return {
      dispatch: async (payload: unknown) => {
        this.emit('notification.message.dispatched', payload);
      },
      send: async (payload: unknown) => {
        this.emit('notification.message.dispatched', payload);
      },
      createAndPush: async (payload: unknown) => {
        this.emit('notification.message.dispatched', payload);
      },
    };
  }

  /**
   * Mock for AuditLogService / ForensicAuditService.
   * Use: builder.overrideProvider(AuditLogService).useValue(spy.asAuditMock())
   */
  asAuditMock(): {
    log: (payload: unknown) => Promise<void>;
    write: (payload: unknown) => Promise<void>;
    record: (payload: unknown) => Promise<void>;
  } {
    return {
      log: async (payload: unknown) => {
        this.emit('audit.entry.written', payload);
      },
      write: async (payload: unknown) => {
        this.emit('audit.entry.written', payload);
      },
      record: async (payload: unknown) => {
        this.emit('audit.entry.written', payload);
      },
    };
  }
}
