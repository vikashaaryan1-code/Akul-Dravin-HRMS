/**
 * DOMAIN EVENTS — CANONICAL NAMESPACE REGISTRY
 *
 * Convention: <context>.<aggregate>.<event>
 *
 * This file IS the architectural truth about what domain events exist
 * in the platform. All event names across all modules MUST be sourced
 * from here — never from ad-hoc string literals.
 *
 * Why a const object instead of enum?
 *  - String literal values are directly usable as NestJS EventEmitter keys.
 *  - No enum-to-string coercion needed.
 *  - Tree-shakeable by bundler.
 *  - Readable in traces, logs, and monitoring dashboards.
 *
 * Naming invariant: <context>.<aggregate>.<event>
 *  context   = bounded domain (task, audit, search, payroll, leave, etc.)
 *  aggregate = the root entity being acted upon
 *  event     = past-tense verb describing what happened
 *
 * Adding a new event:
 *  1. Add the const entry here (in the correct context group).
 *  2. Register it in DomainContractRegistry if it has required downstream effects.
 *  3. Tests that assert propagation will automatically cover the new event.
 *
 * Renaming an event:
 *  1. Add the new name here.
 *  2. Update the DomainContractRegistry entry.
 *  3. Deprecate the old name with a comment — do not delete until all
 *     consumers are migrated.
 */

// ── Task Context ────────────────────────────────────────────────────────────
export const TASK_EVENTS = {
  /** A new task was created and saved to the database. */
  CREATED:    'task.assignment.created',
  /** A task was updated (status, assignee, due date, or fields). */
  UPDATED:    'task.assignment.updated',
  /** A task was marked complete by the assignee or manager. */
  COMPLETED:  'task.assignment.completed',
  /** A task was deleted (soft or hard). */
  DELETED:    'task.assignment.deleted',
  /** A task was assigned to a new employee. */
  REASSIGNED: 'task.assignment.reassigned',
} as const;

// ── Audit Context ───────────────────────────────────────────────────────────
export const AUDIT_EVENTS = {
  /** An auditable action was written to the audit trail. */
  ENTRY_WRITTEN: 'audit.entry.written',
  /** A forensic audit trail was sealed (tamper-evident). */
  TRAIL_SEALED:  'audit.trail.sealed',
} as const;

// ── Search Context ──────────────────────────────────────────────────────────
export const SEARCH_EVENTS = {
  /** A document was indexed or re-indexed in the search index. */
  DOCUMENT_INDEXED:  'search.document.indexed',
  /** A document was removed from the search index. */
  DOCUMENT_REMOVED:  'search.document.removed',
} as const;

// ── Notification Context ────────────────────────────────────────────────────
export const NOTIFICATION_EVENTS = {
  /** A notification was dispatched to one or more recipients. */
  DISPATCHED: 'notification.message.dispatched',
  /** A notification dispatch failed after all retries. */
  FAILED:     'notification.message.failed',
} as const;

// ── Activity Context ────────────────────────────────────────────────────────
export const ACTIVITY_EVENTS = {
  /** An activity entry was written to the unified activity feed. */
  LOGGED: 'activity.feed.logged',
} as const;

// ── Payroll Context ─────────────────────────────────────────────────────────
export const PAYROLL_EVENTS = {
  /** A payroll batch was submitted for processing. */
  BATCH_SUBMITTED:  'payroll.batch.submitted',
  /** A payroll batch completed processing successfully. */
  BATCH_COMPLETED:  'payroll.batch.completed',
  /** A payroll batch was intentionally reversed by an authorized actor. */
  BATCH_REVERSED:   'payroll.batch.reversed',
  /** A payroll batch processing attempt failed (infrastructure/banking error). */
  BATCH_FAILED:     'payroll.batch.failed',
  /** An individual payroll item was processed (success or failure). */
  ITEM_PROCESSED:   'payroll.item.processed',
} as const;

// ── Leave Context ────────────────────────────────────────────────────────────
export const LEAVE_EVENTS = {
  /** A leave request was submitted by an employee. */
  REQUEST_SUBMITTED: 'leave.request.submitted',
  /** A leave request was approved by a manager. */
  REQUEST_APPROVED:  'leave.request.approved',
  /** A leave request was rejected. */
  REQUEST_REJECTED:  'leave.request.rejected',
  /** A leave request was cancelled by the employee. */
  REQUEST_CANCELLED: 'leave.request.cancelled',
} as const;

// ── Workflow Context ─────────────────────────────────────────────────────────
export const WORKFLOW_EVENTS = {
  /** A workflow execution was triggered. */
  EXECUTION_STARTED:    'workflow.execution.started',
  /** A workflow execution completed successfully. */
  EXECUTION_COMPLETED:  'workflow.execution.completed',
  /** A workflow execution failed. */
  EXECUTION_FAILED:     'workflow.execution.failed',
} as const;

// ── Unified type: all canonical domain event names ───────────────────────────
type EventMap =
  | typeof TASK_EVENTS
  | typeof AUDIT_EVENTS
  | typeof SEARCH_EVENTS
  | typeof NOTIFICATION_EVENTS
  | typeof ACTIVITY_EVENTS
  | typeof PAYROLL_EVENTS
  | typeof LEAVE_EVENTS
  | typeof WORKFLOW_EVENTS;

/** Union of all canonical domain event string values. */
export type DomainEventName =
  | typeof TASK_EVENTS[keyof typeof TASK_EVENTS]
  | typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS]
  | typeof SEARCH_EVENTS[keyof typeof SEARCH_EVENTS]
  | typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS]
  | typeof ACTIVITY_EVENTS[keyof typeof ACTIVITY_EVENTS]
  | typeof PAYROLL_EVENTS[keyof typeof PAYROLL_EVENTS]
  | typeof LEAVE_EVENTS[keyof typeof LEAVE_EVENTS]
  | typeof WORKFLOW_EVENTS[keyof typeof WORKFLOW_EVENTS];
