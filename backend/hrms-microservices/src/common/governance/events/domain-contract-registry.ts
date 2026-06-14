import { DomainEventName } from './domain-events';

/**
 * CONTRACT EFFECT SEVERITY
 *
 * Encodes the consistency model of each downstream effect.
 * Not all effects are equal — this distinction is architectural.
 *
 * critical   → Must complete. Missing = data integrity failure.
 *              CI enforces with hard assertion. No degradation permitted.
 *              Examples: audit.entry.written, activity.feed.logged
 *
 * eventual   → Should complete. Missing = temporary inconsistency.
 *              CI enforces with warning. Retry semantics apply.
 *              Examples: search.document.indexed
 *
 * best_effort → Attempt only. Missing = acceptable degradation.
 *               CI tracks but does not fail. Rate-limited, failsafe.
 *               Examples: notification.message.dispatched
 */
export type ContractEffectSeverity = 'critical' | 'eventual' | 'best_effort';

/**
 * CONTRACT EFFECT
 *
 * A single required downstream effect for a domain trigger event.
 * Contains the event name and its severity for CI enforcement policy.
 */
export interface ContractEffect {
  /** The downstream domain event that must be emitted. */
  readonly event: DomainEventName;

  /**
   * Consistency model for this effect:
   *  - critical    → hard CI assertion
   *  - eventual    → tracked, not failed
   *  - best_effort → informational only
   */
  readonly severity: ContractEffectSeverity;

  /**
   * Human-readable rationale. Documents WHY this effect is required.
   * Becomes visible in CI failure output, making violations self-explaining.
   */
  readonly rationale: string;
}

/**
 * DOMAIN CONTRACT
 *
 * Defines the complete set of required downstream effects
 * that MUST result from a trigger domain event.
 *
 * This is the single source of truth for what "correct propagation" means
 * for each trigger event. Adding a downstream system means adding to this
 * contract — tests automatically enforce the new requirement.
 */
export interface DomainContract {
  /** The triggering domain event (e.g., 'task.assignment.created'). */
  readonly trigger: DomainEventName;

  /**
   * All downstream effects required when trigger fires.
   * Ordered by severity (critical first) for CI output readability.
   */
  readonly effects: ReadonlyArray<ContractEffect>;

  /**
   * Optional human-readable description for governance documentation.
   * Surfaced in CI failure reports.
   */
  readonly description?: string;
}

/**
 * DOMAIN CONTRACT REGISTRY
 *
 * The single architectural truth about what "correct event propagation" means
 * for each domain trigger in the platform.
 *
 * Purpose:
 *  - Converts invisible event architecture into executable contracts.
 *  - Makes propagation rules discoverable, testable, and enforceable.
 *  - Scales automatically: adding a downstream system = one registry entry.
 *  - A future developer cannot silently remove event emission without CI failing.
 *
 * Severity enforcement policy:
 *  - critical    → EventBusSpy.assertSatisfiesContract() hard-fails on missing effect.
 *  - eventual    → EventBusSpy.assertSatisfiesContract() warns only.
 *  - best_effort → EventBusSpy.assertSatisfiesContract() records for reporting only.
 *
 * Usage (in test suites):
 *   const spy = new EventBusSpy();
 *   await taskService.createTask(payload);
 *   spy.assertSatisfiesContract('task.assignment.created');
 *
 * Usage (registering a new contract):
 *   DomainContractRegistry.register({
 *     trigger: TASK_EVENTS.CREATED,
 *     description: 'TaskCreated must propagate to audit, activity, search, notification',
 *     effects: [
 *       { event: AUDIT_EVENTS.ENTRY_WRITTEN, severity: 'critical', rationale: '...' },
 *       ...
 *     ],
 *   });
 */
export class DomainContractRegistry {
  private static readonly contracts = new Map<DomainEventName, DomainContract>();

  /**
   * Register a domain contract.
   * Overwrites any existing contract for the same trigger event.
   * Call this at module initialization time, before tests run.
   */
  static register(contract: DomainContract): void {
    this.contracts.set(contract.trigger, contract);
  }

  /**
   * Register multiple contracts at once.
   * Use this when bootstrapping a module's governance declarations.
   */
  static registerAll(contracts: DomainContract[]): void {
    for (const contract of contracts) {
      this.register(contract);
    }
  }

  /**
   * Retrieve a registered contract by trigger event name.
   * Returns undefined if no contract is registered for that event.
   */
  static getContract(trigger: DomainEventName): DomainContract | undefined {
    return this.contracts.get(trigger);
  }

  /**
   * Retrieve a registered contract, throwing if not found.
   * Use in tests that require a contract to exist.
   */
  static getRequiredContract(trigger: DomainEventName): DomainContract {
    const contract = this.contracts.get(trigger);
    if (!contract) {
      throw new Error(
        `[DomainContractRegistry] No contract registered for trigger="${trigger}". ` +
          `Register it via DomainContractRegistry.register() before asserting propagation.`,
      );
    }
    return contract;
  }

  /**
   * Get all registered contracts — for governance reporting and CI summary output.
   */
  static getAllContracts(): DomainContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Get all critical effects for a trigger.
   * Used by EventBusSpy for hard assertions in test suites.
   */
  static getCriticalEffects(trigger: DomainEventName): ContractEffect[] {
    return (this.getContract(trigger)?.effects ?? []).filter(
      (e) => e.severity === 'critical',
    );
  }

  /**
   * Check if a contract is registered for a trigger.
   */
  static hasContract(trigger: DomainEventName): boolean {
    return this.contracts.has(trigger);
  }

  /**
   * Clear all registered contracts.
   * USE ONLY IN TEST TEARDOWN — not in production code.
   */
  static clearAll(): void {
    this.contracts.clear();
  }

  /**
   * Summary for CI output and governance reports.
   * Returns registration state: how many triggers, how many total effects,
   * broken down by severity.
   */
  static getSummary(): {
    totalContracts: number;
    totalEffects: number;
    criticalEffects: number;
    eventualEffects: number;
    bestEffortEffects: number;
  } {
    const all = this.getAllContracts();
    const allEffects = all.flatMap((c) => c.effects);
    return {
      totalContracts: all.length,
      totalEffects: allEffects.length,
      criticalEffects: allEffects.filter((e) => e.severity === 'critical').length,
      eventualEffects: allEffects.filter((e) => e.severity === 'eventual').length,
      bestEffortEffects: allEffects.filter((e) => e.severity === 'best_effort').length,
    };
  }
}
