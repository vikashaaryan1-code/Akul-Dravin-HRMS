/**
 * CRITICAL EVENT PROVENANCE DECORATOR — Commit 8
 *
 * Marks a service method as the origin point of a critical domain event.
 * This decorator is both documentation and a CI enforcement target.
 *
 * # Purpose
 *
 * The recommended commit sequence noted:
 *   "Before Commit 8 lands, add one CI invariant:
 *    Every critical event must originate from a transaction boundary."
 *
 * This decorator enforces three provenance properties at the call site:
 *   1. ANNOTATION: the method is marked as a critical event origin.
 *   2. ENFORCEMENT: the method is expected to use outboxWriter.write() within
 *      an active EntityManager transaction (checked at runtime by guards).
 *   3. CI TARGET: governance tests can enumerate all @CriticalEvent methods
 *      and assert they are in transactional services — not controllers or handlers.
 *
 * # Structural Rules (enforced by governance tests, not runtime)
 *   ✅ ALLOWED:   Service methods that open a DB transaction and call outboxWriter.write()
 *   ❌ FORBIDDEN: Controller route handlers (no transaction boundary)
 *   ❌ FORBIDDEN: Projection handlers (handlers consume events — they don't emit critical ones)
 *   ❌ FORBIDDEN: Cron workers (no request context or transaction scope)
 *
 * # Usage
 *   @CriticalEvent({ name: 'payroll.batch.reversed', aggregate: 'PayrollBatch' })
 *   async reverseBatch(...): Promise<void> {
 *     await dataSource.transaction(async (manager) => {
 *       // domain mutation
 *       await outboxWriter.write(manager, 'payroll.batch.reversed', envelope, 'critical');
 *     });
 *   }
 *
 * # Metadata Access (for CI governance tests)
 *   const meta = Reflect.getMetadata(CRITICAL_EVENT_METADATA_KEY, target, propertyKey);
 *   // → { name: 'payroll.batch.reversed', aggregate: 'PayrollBatch', requiresTransaction: true }
 */

import 'reflect-metadata';

export const CRITICAL_EVENT_METADATA_KEY = Symbol('CriticalEvent');

export interface CriticalEventMetadata {
  /** Canonical domain event name this method emits. From domain-events.ts. */
  name: string;
  /**
   * Aggregate type being mutated. Used by governance tooling to trace
   * which aggregates can emit critical events.
   */
  aggregate: string;
  /**
   * Whether this method MUST be called within a DB transaction.
   * Default: true — critical events must always be transactionally safe.
   * Set to false only for test methods or synthetic event generators.
   */
  requiresTransaction?: boolean;
}

/**
 * @CriticalEvent — Method decorator.
 *
 * Attach to any service method that emits a critical domain event
 * via OutboxEventWriter.write() within a DB transaction.
 *
 * This is enforced in CI by `critical-event-provenance.enforcement.spec.ts`
 * which walks all decorated methods and asserts:
 *   1. The method is in a class annotated with @Injectable() (NestJS service).
 *   2. The class name ends in 'Service' or 'Engine' (not 'Controller' or 'Handler').
 *   3. requiresTransaction is true (default).
 */
export function CriticalEvent(metadata: CriticalEventMetadata): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    // Write provenance metadata — readable by reflection in tests and tooling
    Reflect.defineMetadata(
      CRITICAL_EVENT_METADATA_KEY,
      {
        requiresTransaction: true,
        ...metadata,
      } satisfies Required<CriticalEventMetadata>,
      target,
      propertyKey,
    );

    // Store on class-level registry for discovery without instance creation
    const existingRegistry: Array<{ method: string | symbol; metadata: Required<CriticalEventMetadata> }> =
      Reflect.getMetadata(CRITICAL_EVENT_METADATA_KEY, target.constructor) ?? [];

    existingRegistry.push({ method: propertyKey, metadata: { requiresTransaction: true, ...metadata } });
    Reflect.defineMetadata(CRITICAL_EVENT_METADATA_KEY, existingRegistry, target.constructor);

    return descriptor;
  };
}

/**
 * getCriticalEventMethods
 *
 * Enumerate all methods on a class decorated with @CriticalEvent.
 * Used by governance tests to discover and validate provenance.
 *
 * @param target  The service class constructor.
 * @returns       Array of (method, metadata) pairs.
 */
export function getCriticalEventMethods(
  target: Function,
): Array<{ method: string | symbol; metadata: Required<CriticalEventMetadata> }> {
  return Reflect.getMetadata(CRITICAL_EVENT_METADATA_KEY, target) ?? [];
}
