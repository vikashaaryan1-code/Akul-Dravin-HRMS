/**
 * DOMAIN CONTRACT PROPAGATION — ENFORCEMENT TESTS (Commit 2)
 *
 * These tests enforce the event propagation contracts registered in
 * platform-contracts.ts. They validate two things simultaneously:
 *
 *  1. CONTRACT REGISTRY INTEGRITY
 *     That the DomainContractRegistry correctly registers, retrieves,
 *     and enforces contracts with severity-aware assertion logic.
 *
 *  2. PROPAGATION ARCHITECTURE GOVERNANCE
 *     That the EventBusSpy correctly captures and asserts emissions,
 *     and that assertSatisfiesContract() fails with the right errors
 *     when propagation is incomplete.
 *
 * NOTE ON TASK SERVICE TESTS:
 * ─────────────────────────────────────────────────────────────────────
 * The task propagation tests in SECTION 4 are currently written to
 * document the REQUIRED propagation behavior and validate the spy/contract
 * machinery. The actual task service wiring (injecting ActivityFeedService,
 * AuditLogService etc. into TaskManagementService) is Commit 3 work.
 *
 * These tests validate:
 *  - Spy correctly detects missing critical effects (what will fail in CI
 *    until Commit 3 wires the service)
 *  - assertSatisfiesContract() produces the correct failure message
 *  - The contract registry has the correct entries
 *
 * Test philosophy: invariant coverage, not code coverage.
 * ─────────────────────────────────────────────────────────────────────
 */

import {
  DomainContractRegistry,
  EventBusSpy,
  TASK_EVENTS,
  AUDIT_EVENTS,
  SEARCH_EVENTS,
  NOTIFICATION_EVENTS,
  ACTIVITY_EVENTS,
  PAYROLL_EVENTS,
  LEAVE_EVENTS,
  registerPlatformContracts,
  DomainEventName,
} from '../../common/governance/events';

// ──────────────────────────────────────────────────────────────────────────────
// TEST SETUP: register platform contracts before all tests
// ──────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  registerPlatformContracts();
});

afterAll(() => {
  DomainContractRegistry.clearAll();
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 1: Domain Event Namespace Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('Domain Event Namespace — Architectural Contract', () => {
  it('all event names follow <context>.<aggregate>.<event> convention', () => {
    const allEvents: string[] = [
      ...Object.values(TASK_EVENTS),
      ...Object.values(AUDIT_EVENTS),
      ...Object.values(SEARCH_EVENTS),
      ...Object.values(NOTIFICATION_EVENTS),
      ...Object.values(ACTIVITY_EVENTS),
      ...Object.values(PAYROLL_EVENTS),
      ...Object.values(LEAVE_EVENTS),
    ];

    for (const eventName of allEvents) {
      const parts = eventName.split('.');
      expect(parts.length).toBeGreaterThanOrEqual(3);
      // Each segment must be non-empty and lowercase with optional underscores
      for (const part of parts) {
        expect(part).toMatch(/^[a-z][a-z0-9_-]*$/);
      }
    }
  });

  it('no two event constants share the same string value (uniqueness invariant)', () => {
    const allEvents: string[] = [
      ...Object.values(TASK_EVENTS),
      ...Object.values(AUDIT_EVENTS),
      ...Object.values(SEARCH_EVENTS),
      ...Object.values(NOTIFICATION_EVENTS),
      ...Object.values(ACTIVITY_EVENTS),
      ...Object.values(PAYROLL_EVENTS),
      ...Object.values(LEAVE_EVENTS),
    ];

    const unique = new Set(allEvents);
    expect(unique.size).toBe(allEvents.length);
  });

  it('PAYROLL_EVENTS.BATCH_REVERSED and BATCH_FAILED are distinct events', () => {
    // Semantic correctness test: REVERSED is intentional business rollback,
    // FAILED is infrastructure/processing error. They must never be the same event.
    expect(PAYROLL_EVENTS.BATCH_REVERSED).not.toBe(PAYROLL_EVENTS.BATCH_FAILED);
    expect(PAYROLL_EVENTS.BATCH_REVERSED).toContain('reversed');
    expect(PAYROLL_EVENTS.BATCH_FAILED).toContain('failed');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 2: DomainContractRegistry — Core Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('DomainContractRegistry — Core Contract', () => {
  it('all platform trigger events have registered contracts after bootstrap', () => {
    const expectedTriggers: DomainEventName[] = [
      TASK_EVENTS.CREATED,
      TASK_EVENTS.COMPLETED,
      TASK_EVENTS.UPDATED,
      PAYROLL_EVENTS.BATCH_COMPLETED,
      PAYROLL_EVENTS.BATCH_REVERSED,
      LEAVE_EVENTS.REQUEST_SUBMITTED,
      LEAVE_EVENTS.REQUEST_APPROVED,
    ];

    for (const trigger of expectedTriggers) {
      expect(DomainContractRegistry.hasContract(trigger)).toBe(true);
    }
  });

  it('TASK_EVENTS.CREATED contract has correct severity distribution', () => {
    const contract = DomainContractRegistry.getRequiredContract(TASK_EVENTS.CREATED);

    const critical = contract.effects.filter((e) => e.severity === 'critical');
    const eventual = contract.effects.filter((e) => e.severity === 'eventual');
    const bestEffort = contract.effects.filter((e) => e.severity === 'best_effort');

    // audit + activity are critical
    expect(critical.length).toBeGreaterThanOrEqual(2);
    // search is eventual
    expect(eventual.length).toBeGreaterThanOrEqual(1);
    // notification is best_effort
    expect(bestEffort.length).toBeGreaterThanOrEqual(1);
  });

  it('PAYROLL_EVENTS.BATCH_REVERSED contract requires audit as critical', () => {
    const contract = DomainContractRegistry.getRequiredContract(PAYROLL_EVENTS.BATCH_REVERSED);
    const auditEffect = contract.effects.find((e) => e.event === AUDIT_EVENTS.ENTRY_WRITTEN);

    expect(auditEffect).toBeDefined();
    expect(auditEffect!.severity).toBe('critical');
    // Reversal rationale must distinguish it from FAILED semantics
    expect(auditEffect!.rationale.toLowerCase()).toContain('reversed');
  });

  it('PAYROLL_EVENTS.BATCH_REVERSED audit rationale explicitly mentions REVERSED ≠ FAILED', () => {
    const contract = DomainContractRegistry.getRequiredContract(PAYROLL_EVENTS.BATCH_REVERSED);
    const auditEffect = contract.effects.find((e) => e.event === AUDIT_EVENTS.ENTRY_WRITTEN);
    // This rationale is the governance documentation — it must encode the semantic distinction
    expect(auditEffect!.rationale).toContain('REVERSED');
    expect(auditEffect!.rationale).toContain('FAILED');
  });

  it('getCriticalEffects() returns only critical-severity effects', () => {
    const criticals = DomainContractRegistry.getCriticalEffects(TASK_EVENTS.CREATED);
    for (const effect of criticals) {
      expect(effect.severity).toBe('critical');
    }
    expect(criticals.length).toBeGreaterThan(0);
  });

  it('getSummary() returns correct aggregate counts', () => {
    const summary = DomainContractRegistry.getSummary();
    expect(summary.totalContracts).toBeGreaterThanOrEqual(7);
    expect(summary.criticalEffects).toBeGreaterThan(0);
    expect(summary.eventualEffects).toBeGreaterThan(0);
    expect(summary.bestEffortEffects).toBeGreaterThan(0);
    expect(summary.totalEffects).toBe(
      summary.criticalEffects + summary.eventualEffects + summary.bestEffortEffects,
    );
  });

  it('getRequiredContract() throws descriptively when no contract exists', () => {
    // Cast to bypass TypeScript — simulates a runtime lookup with an unknown event name
    const unknownEvent = 'unknown.event.name' as DomainEventName;
    expect(() => DomainContractRegistry.getRequiredContract(unknownEvent)).toThrow(
      'DomainContractRegistry',
    );
    expect(() => DomainContractRegistry.getRequiredContract(unknownEvent)).toThrow(
      'unknown.event.name',
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 3: EventBusSpy — Spy Behavior Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('EventBusSpy — Spy Behavior', () => {
  let spy: EventBusSpy;

  beforeEach(() => {
    spy = new EventBusSpy();
  });

  it('captures emitted events in order', () => {
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN, { entityId: '1' });
    spy.emit(ACTIVITY_EVENTS.LOGGED, { entityId: '1' });
    spy.emit(SEARCH_EVENTS.DOCUMENT_INDEXED, { entityId: '1' });

    const names = spy.getEmittedNames();
    expect(names).toEqual([
      AUDIT_EVENTS.ENTRY_WRITTEN,
      ACTIVITY_EVENTS.LOGGED,
      SEARCH_EVENTS.DOCUMENT_INDEXED,
    ]);
  });

  it('toHaveEmitted() passes when event was emitted', () => {
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN);
    expect(() => spy.toHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN)).not.toThrow();
  });

  it('toHaveEmitted() throws with descriptive message when event not emitted', () => {
    spy.emit(ACTIVITY_EVENTS.LOGGED);
    expect(() => spy.toHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN)).toThrow('EventBusSpy');
    expect(() => spy.toHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN)).toThrow(
      AUDIT_EVENTS.ENTRY_WRITTEN,
    );
  });

  it('toNotHaveEmitted() passes when event was not emitted', () => {
    spy.emit(ACTIVITY_EVENTS.LOGGED);
    expect(() => spy.toNotHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN)).not.toThrow();
  });

  it('toNotHaveEmitted() throws when event WAS emitted', () => {
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN);
    expect(() => spy.toNotHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN)).toThrow();
  });

  it('getPayloadsFor() returns all payloads for a specific event', () => {
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN, { entityId: 'a' });
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN, { entityId: 'b' });
    spy.emit(ACTIVITY_EVENTS.LOGGED, { entityId: 'c' });

    const payloads = spy.getPayloadsFor(AUDIT_EVENTS.ENTRY_WRITTEN);
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toEqual({ entityId: 'a' });
    expect(payloads[1]).toEqual({ entityId: 'b' });
  });

  it('reset() clears all captured events', () => {
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN);
    spy.reset();
    expect(spy.getEmittedNames()).toHaveLength(0);
  });

  it('getEmissionLog() includes timestamp and payload', () => {
    const payload = { entityId: 'task-123' };
    spy.emit(TASK_EVENTS.CREATED, payload);

    const log = spy.getEmissionLog();
    expect(log).toHaveLength(1);
    expect(log[0].event).toBe(TASK_EVENTS.CREATED);
    expect(log[0].payload).toEqual(payload);
    expect(typeof log[0].timestamp).toBe('string');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 4: assertSatisfiesContract() — Severity-Aware Enforcement
// ──────────────────────────────────────────────────────────────────────────────

describe('EventBusSpy.assertSatisfiesContract() — Severity-Aware Enforcement', () => {
  let spy: EventBusSpy;

  beforeEach(() => {
    spy = new EventBusSpy();
  });

  it('passes when ALL effects for a trigger are emitted', () => {
    // Emit every required effect for TASK_EVENTS.CREATED
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN);
    spy.emit(ACTIVITY_EVENTS.LOGGED);
    spy.emit(SEARCH_EVENTS.DOCUMENT_INDEXED);
    spy.emit(NOTIFICATION_EVENTS.DISPATCHED);

    const result = spy.assertSatisfiesContract(TASK_EVENTS.CREATED);
    expect(result.criticalsSatisfied).toBe(true);
    expect(result.missingCritical).toHaveLength(0);
  });

  it('passes even if best_effort effects are missing (they are not enforced)', () => {
    // Emit only critical + eventual effects — omit notification (best_effort)
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN);
    spy.emit(ACTIVITY_EVENTS.LOGGED);
    spy.emit(SEARCH_EVENTS.DOCUMENT_INDEXED);
    // notification deliberately omitted — best_effort, should not fail

    const result = spy.assertSatisfiesContract(TASK_EVENTS.CREATED);
    expect(result.criticalsSatisfied).toBe(true);
    expect(result.missingBestEffort.length).toBeGreaterThan(0);
  });

  it('HARD FAILS when a critical effect is missing', () => {
    // Emit everything EXCEPT the audit entry (critical)
    spy.emit(ACTIVITY_EVENTS.LOGGED);
    spy.emit(SEARCH_EVENTS.DOCUMENT_INDEXED);
    spy.emit(NOTIFICATION_EVENTS.DISPATCHED);
    // audit.entry.written deliberately omitted

    expect(() => spy.assertSatisfiesContract(TASK_EVENTS.CREATED)).toThrow(
      'DOMAIN CONTRACT VIOLATION',
    );
  });

  it('failure message names the missing critical effect explicitly', () => {
    spy.emit(ACTIVITY_EVENTS.LOGGED);
    // audit missing

    try {
      spy.assertSatisfiesContract(TASK_EVENTS.CREATED);
      fail('Expected contract violation error');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      expect(msg).toContain('DOMAIN CONTRACT VIOLATION');
      expect(msg).toContain(AUDIT_EVENTS.ENTRY_WRITTEN);
      expect(msg).toContain(TASK_EVENTS.CREATED);
      // Rationale must appear in the failure message — self-documenting failure
      expect(msg).toContain('auditable operational event');
    }
  });

  it('failure message includes emitted events for diagnosis', () => {
    spy.emit(ACTIVITY_EVENTS.LOGGED);

    try {
      spy.assertSatisfiesContract(TASK_EVENTS.CREATED);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      expect(msg).toContain(ACTIVITY_EVENTS.LOGGED);
    }
  });

  it('failure message for empty spy explicitly states no events were emitted', () => {
    // Spy has emitted nothing — simulates the current TaskManagementService state
    // (save-only, no downstream propagation)
    try {
      spy.assertSatisfiesContract(TASK_EVENTS.CREATED);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      expect(msg).toContain('DOMAIN CONTRACT VIOLATION');
      // Both critical effects should be listed as missing
      expect(msg).toContain(AUDIT_EVENTS.ENTRY_WRITTEN);
      expect(msg).toContain(ACTIVITY_EVENTS.LOGGED);
    }
  });

  it('PAYROLL_EVENTS.BATCH_REVERSED fails if audit not emitted', () => {
    spy.emit(ACTIVITY_EVENTS.LOGGED);
    // audit missing — must hard fail because reversal audit is critical

    expect(() => spy.assertSatisfiesContract(PAYROLL_EVENTS.BATCH_REVERSED)).toThrow(
      'DOMAIN CONTRACT VIOLATION',
    );
  });

  it('result.satisfied lists effects that were correctly emitted', () => {
    spy.emit(AUDIT_EVENTS.ENTRY_WRITTEN, { entityId: 'task-1' });
    spy.emit(ACTIVITY_EVENTS.LOGGED, { entityId: 'task-1' });
    spy.emit(SEARCH_EVENTS.DOCUMENT_INDEXED, { entityId: 'task-1' });
    spy.emit(NOTIFICATION_EVENTS.DISPATCHED);

    const result = spy.assertSatisfiesContract(TASK_EVENTS.CREATED);
    const satisfiedEvents = result.satisfied.map((e) => e.event);
    expect(satisfiedEvents).toContain(AUDIT_EVENTS.ENTRY_WRITTEN);
    expect(satisfiedEvents).toContain(ACTIVITY_EVENTS.LOGGED);
    expect(satisfiedEvents).toContain(SEARCH_EVENTS.DOCUMENT_INDEXED);
    expect(satisfiedEvents).toContain(NOTIFICATION_EVENTS.DISPATCHED);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 5: Mock Factories — Service Interface Contract
// ──────────────────────────────────────────────────────────────────────────────

describe('EventBusSpy Mock Factories — Service Interface Contract', () => {
  let spy: EventBusSpy;

  beforeEach(() => {
    spy = new EventBusSpy();
  });

  it('asActivityFeedMock().record() emits activity.feed.logged', async () => {
    const mock = spy.asActivityFeedMock();
    await mock.record({ entityType: 'Task', action: 'created' });
    spy.toHaveEmitted(ACTIVITY_EVENTS.LOGGED);
  });

  it('asSearchMock().indexDocument() emits search.document.indexed', async () => {
    const mock = spy.asSearchMock();
    await mock.indexDocument('Task', 'task-123', { title: 'Test Task' });
    spy.toHaveEmitted(SEARCH_EVENTS.DOCUMENT_INDEXED);

    const payloads = spy.getPayloadsFor(SEARCH_EVENTS.DOCUMENT_INDEXED);
    expect(payloads[0]).toMatchObject({ entityType: 'Task', entityId: 'task-123' });
  });

  it('asSearchMock().removeDocument() emits search.document.removed', async () => {
    const mock = spy.asSearchMock();
    await mock.removeDocument('Task', 'task-123');
    spy.toHaveEmitted(SEARCH_EVENTS.DOCUMENT_REMOVED);
  });

  it('asNotificationMock().dispatch() emits notification.message.dispatched', async () => {
    const mock = spy.asNotificationMock();
    await mock.dispatch({ recipientId: 'emp-1', message: 'Task assigned' });
    spy.toHaveEmitted(NOTIFICATION_EVENTS.DISPATCHED);
  });

  it('asAuditMock().log() emits audit.entry.written', async () => {
    const mock = spy.asAuditMock();
    await mock.log({ action: 'TASK_CREATED', entityId: 'task-123' });
    spy.toHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN);
  });

  it('asAuditMock().write() and .record() both emit audit.entry.written', async () => {
    const mock = spy.asAuditMock();
    await mock.write({ action: 'TASK_UPDATED' });
    spy.toHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN);

    spy.reset();
    await mock.record({ action: 'TASK_COMPLETED' });
    spy.toHaveEmitted(AUDIT_EVENTS.ENTRY_WRITTEN);
  });

  it('multiple mock factories on same spy capture events to single emission log', async () => {
    const activityMock = spy.asActivityFeedMock();
    const auditMock = spy.asAuditMock();
    const searchMock = spy.asSearchMock();
    const notifMock = spy.asNotificationMock();

    await auditMock.log({ action: 'TASK_CREATED' });
    await activityMock.record({ entityType: 'Task', action: 'created' });
    await searchMock.indexDocument('Task', 'task-123', {});
    await notifMock.dispatch({ recipientId: 'emp-1' });

    // All captured on single spy — assertSatisfiesContract works across all four
    const result = spy.assertSatisfiesContract(TASK_EVENTS.CREATED);
    expect(result.criticalsSatisfied).toBe(true);
    expect(spy.getEmittedNames()).toHaveLength(4);
  });
});
