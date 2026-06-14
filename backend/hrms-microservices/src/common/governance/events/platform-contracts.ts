import { DomainContractRegistry } from './domain-contract-registry';
import {
  TASK_EVENTS,
  AUDIT_EVENTS,
  SEARCH_EVENTS,
  NOTIFICATION_EVENTS,
  ACTIVITY_EVENTS,
  PAYROLL_EVENTS,
  LEAVE_EVENTS,
} from './domain-events';

/**
 * PLATFORM DOMAIN CONTRACTS — CANONICAL REGISTRATION
 *
 * This file registers all domain propagation contracts for the platform.
 * It is the governance source-of-truth for event architecture.
 *
 * Call registerPlatformContracts() once at application bootstrap,
 * and in test suite beforeAll() blocks, to activate all contracts.
 *
 * Contract evolution rules:
 *  - Adding a downstream system: add a new ContractEffect entry here.
 *    All existing tests that call assertSatisfiesContract() will
 *    automatically begin enforcing the new effect.
 *  - Changing severity: edit the severity here. CI policy updates automatically.
 *  - Removing an effect: requires deliberate edit + PR review.
 *    Governance visibility is the point — nothing is accidentally removed.
 */
export function registerPlatformContracts(): void {

  // ── Task Domain Contracts ─────────────────────────────────────────────────

  DomainContractRegistry.register({
    trigger: TASK_EVENTS.CREATED,
    description: 'Task creation must propagate to audit, activity feed, search index, and notification',
    effects: [
      {
        event: AUDIT_EVENTS.ENTRY_WRITTEN,
        severity: 'critical',
        rationale: 'Every task creation is an auditable operational event. ' +
          'Audit continuity is a compliance invariant — no creation is silent.',
      },
      {
        event: ACTIVITY_EVENTS.LOGGED,
        severity: 'critical',
        rationale: 'Task creation feeds the unified activity timeline. ' +
          'Activity continuity is required for operational visibility across the tenant.',
      },
      {
        event: SEARCH_EVENTS.DOCUMENT_INDEXED,
        severity: 'eventual',
        rationale: 'Tasks must be discoverable via global search. ' +
          'Eventual consistency is acceptable — temporary search gap is not a data loss.',
      },
      {
        event: NOTIFICATION_EVENTS.DISPATCHED,
        severity: 'best_effort',
        rationale: 'Assignee notification is a UX concern, not a data integrity concern. ' +
          'Rate-limited, failsafe — best-effort delivery is acceptable.',
      },
    ],
  });

  DomainContractRegistry.register({
    trigger: TASK_EVENTS.COMPLETED,
    description: 'Task completion must propagate to audit and activity feed',
    effects: [
      {
        event: AUDIT_EVENTS.ENTRY_WRITTEN,
        severity: 'critical',
        rationale: 'Task completion is an auditable state transition. ' +
          'Completion events feed performance analytics and compliance reporting.',
      },
      {
        event: ACTIVITY_EVENTS.LOGGED,
        severity: 'critical',
        rationale: 'Completion must appear in the activity timeline for operational visibility.',
      },
      {
        event: SEARCH_EVENTS.DOCUMENT_INDEXED,
        severity: 'eventual',
        rationale: 'Search index must reflect completion status for filtering.',
      },
    ],
  });

  DomainContractRegistry.register({
    trigger: TASK_EVENTS.UPDATED,
    description: 'Task updates must propagate to audit and search index',
    effects: [
      {
        event: AUDIT_EVENTS.ENTRY_WRITTEN,
        severity: 'critical',
        rationale: 'Field mutations on tasks are auditable — especially status, due date, assignee.',
      },
      {
        event: SEARCH_EVENTS.DOCUMENT_INDEXED,
        severity: 'eventual',
        rationale: 'Search index must stay in sync with task field changes.',
      },
      {
        event: ACTIVITY_EVENTS.LOGGED,
        severity: 'eventual',
        rationale: 'Significant updates (status, assignee) appear in activity feed.',
      },
    ],
  });

  // ── Payroll Domain Contracts ──────────────────────────────────────────────

  DomainContractRegistry.register({
    trigger: PAYROLL_EVENTS.BATCH_COMPLETED,
    description: 'Payroll batch completion must propagate to audit, activity, and notification',
    effects: [
      {
        event: AUDIT_EVENTS.ENTRY_WRITTEN,
        severity: 'critical',
        rationale: 'Payroll completion is a financial event. ' +
          'Audit entry is required for statutory compliance and reconciliation.',
      },
      {
        event: ACTIVITY_EVENTS.LOGGED,
        severity: 'critical',
        rationale: 'Payroll execution appears in the activity feed for operational visibility ' +
          'by HR administrators and finance managers.',
      },
      {
        event: NOTIFICATION_EVENTS.DISPATCHED,
        severity: 'best_effort',
        rationale: 'Employee payment confirmation is a UX concern. ' +
          'Best-effort delivery — payment is not blocked by notification failure.',
      },
    ],
  });

  DomainContractRegistry.register({
    trigger: PAYROLL_EVENTS.BATCH_REVERSED,
    description: 'Payroll reversal must propagate to audit with mandatory audit trail (financial invariant)',
    effects: [
      {
        event: AUDIT_EVENTS.ENTRY_WRITTEN,
        severity: 'critical',
        rationale: 'Payroll reversal is a financial correction. ' +
          'REVERSED ≠ FAILED. This is an intentional, authorized rollback. ' +
          'Audit entry is mandatory for statutory compliance and reconciliation.',
      },
      {
        event: ACTIVITY_EVENTS.LOGGED,
        severity: 'critical',
        rationale: 'Reversal must be visible in the operational activity timeline ' +
          'so administrators can trace who reversed what and when.',
      },
      {
        event: NOTIFICATION_EVENTS.DISPATCHED,
        severity: 'eventual',
        rationale: 'Finance admin notification on reversal is important for operational awareness ' +
          'but does not block the reversal from completing.',
      },
    ],
  });

  // ── Leave Domain Contracts ────────────────────────────────────────────────

  DomainContractRegistry.register({
    trigger: LEAVE_EVENTS.REQUEST_SUBMITTED,
    description: 'Leave submission must propagate to audit and manager notification',
    effects: [
      {
        event: AUDIT_EVENTS.ENTRY_WRITTEN,
        severity: 'critical',
        rationale: 'Leave requests are auditable workforce events affecting payroll and compliance.',
      },
      {
        event: ACTIVITY_EVENTS.LOGGED,
        severity: 'critical',
        rationale: 'Leave request appears in the activity feed for HR operational visibility.',
      },
      {
        event: NOTIFICATION_EVENTS.DISPATCHED,
        severity: 'eventual',
        rationale: 'Manager approval notification is important for workflow continuity ' +
          'but does not block the submission from completing.',
      },
    ],
  });

  DomainContractRegistry.register({
    trigger: LEAVE_EVENTS.REQUEST_APPROVED,
    description: 'Leave approval must propagate to audit and employee notification',
    effects: [
      {
        event: AUDIT_EVENTS.ENTRY_WRITTEN,
        severity: 'critical',
        rationale: 'Leave approval changes the employee\'s entitlement balance. ' +
          'Audit trail is mandatory for payroll reconciliation.',
      },
      {
        event: ACTIVITY_EVENTS.LOGGED,
        severity: 'critical',
        rationale: 'Approval appears in operational activity for HR visibility.',
      },
      {
        event: NOTIFICATION_EVENTS.DISPATCHED,
        severity: 'best_effort',
        rationale: 'Employee confirmation notification — best-effort delivery.',
      },
    ],
  });
}
