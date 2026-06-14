/**
 * GOVERNANCE SPAN FACTORY
 *
 * Lightweight, OTel-compatible structured span abstraction for governance operations.
 *
 * Design principles:
 *   1. Zero hard dependencies — works with no OTel SDK installed.
 *      If no SDK is registered, spans are no-ops that still collect timing.
 *   2. OTel-compatible interface — drop-in replacement when OTel SDK is added.
 *   3. Always produces a timing record — even without a tracer.
 *   4. Context-aware — carries correlation ID and tenant throughout the span.
 *
 * OTel integration path:
 *   Phase 1 (now): structured timing + structured log output via Logger.
 *   Phase 2 (Commit 8): plug in @opentelemetry/api tracer.
 *   Phase 3 (Commit 9): connect to Jaeger/Tempo backend.
 *
 * The factory is stateless — all spans are independent.
 *
 * Usage:
 *   const span = GovernanceSpanFactory.start(GovernanceOperation.TRANSITION_EXECUTE, {
 *     aggregateId: batch.id,
 *     aggregateType: 'PayrollBatch',
 *     correlationId: actor.correlationId,
 *     tenantId,
 *   });
 *
 *   try {
 *     // ... do work ...
 *     span.tag('toStatus', 'REVERSED');
 *     span.end();
 *   } catch (err) {
 *     span.endWithError(err instanceof Error ? err : new Error(String(err)));
 *     throw err;
 *   }
 */

import { Logger } from '@nestjs/common';

// ── Operation Namespace ───────────────────────────────────────────────────────

/**
 * All governance operation types that can be instrumented.
 * Follow naming: governance.<subsystem>.<operation>
 *
 * These names will become OTel span names in Phase 2.
 * Keep them stable — renaming breaks existing dashboards.
 */
export const GovernanceOperation = {
  /** A state transition through TransitionPolicyEngine. */
  TRANSITION_EXECUTE:    'governance.transition.execute',
  /** A domain event contract assertion (DomainContractRegistry). */
  CONTRACT_ASSERT:       'governance.contract.assert',
  /** A projection handler execution within DomainEventBus. */
  HANDLER_EXECUTE:       'governance.handler.execute',
  /** A replay protection store lookup (hasProcessed). */
  REPLAY_CHECK:          'governance.replay.check',
  /** A replay protection mark (markProcessed). */
  REPLAY_MARK:           'governance.replay.mark',
  /** A SQL query introspection pass (QueryIntrospector). */
  QUERY_INTROSPECT:      'governance.query.introspect',
  /** A tenant scope validation (TenantQueryPolicy). */
  TENANT_SCOPE_VALIDATE: 'governance.tenant.validate',
} as const;

export type GovernanceOperationName = typeof GovernanceOperation[keyof typeof GovernanceOperation];

// ── Span Interface ────────────────────────────────────────────────────────────

/**
 * GOVERNANCE SPAN
 *
 * A single timed observation of a governance operation.
 * Compatible with OTel Span semantics — .tag() maps to span.setAttribute().
 *
 * The span collects timing even without OTel; the structured output is
 * emitted as a JSON log line that can be ingested by any log aggregator.
 */
export interface GovernanceSpan {
  /**
   * Attach metadata to the span — appears in logs and (Phase 2) OTel attributes.
   * Keys are plain strings; values are primitives (string/number/boolean).
   */
  tag(key: string, value: string | number | boolean): GovernanceSpan;

  /**
   * End the span successfully. Computes duration and emits structured log.
   */
  end(): void;

  /**
   * End the span with an error. Marks status=ERROR and emits error log.
   */
  endWithError(error: Error): void;

  /** Duration in milliseconds from start to end(). Only valid after end(). */
  readonly durationMs: number | undefined;
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface SpanContext {
  /** HTTP request correlation ID — threads this span back to the request. */
  correlationId?: string;
  /** Tenant scope — added to all span tags. */
  tenantId?: string;
  /** Root aggregate ID being operated on. */
  aggregateId?: string;
  /** Root aggregate type. */
  aggregateType?: string;
  /** Actor performing the operation. */
  actorId?: string;
}

// ── Implementation ────────────────────────────────────────────────────────────

class GovernanceSpanImpl implements GovernanceSpan {
  private readonly startTime: number;
  private readonly tags: Record<string, string | number | boolean>;
  private _durationMs: number | undefined;
  private ended = false;
  private readonly logger: Logger;

  constructor(
    private readonly operation: GovernanceOperationName,
    private readonly context: SpanContext,
    logger: Logger,
  ) {
    this.startTime = Date.now();
    this.tags = {};
    this.logger = logger;

    // Tag standard context fields from the start
    if (context.tenantId)      this.tags['tenantId']      = context.tenantId;
    if (context.correlationId) this.tags['correlationId'] = context.correlationId;
    if (context.aggregateId)   this.tags['aggregateId']   = context.aggregateId;
    if (context.aggregateType) this.tags['aggregateType'] = context.aggregateType;
    if (context.actorId)       this.tags['actorId']       = context.actorId;
  }

  tag(key: string, value: string | number | boolean): GovernanceSpan {
    this.tags[key] = value;
    return this;
  }

  end(): void {
    if (this.ended) return;
    this.ended = true;
    this._durationMs = Date.now() - this.startTime;

    this.logger.debug(
      JSON.stringify({
        span:        this.operation,
        status:      'OK',
        durationMs:  this._durationMs,
        ...this.tags,
      }),
    );
  }

  endWithError(error: Error): void {
    if (this.ended) return;
    this.ended = true;
    this._durationMs = Date.now() - this.startTime;

    this.logger.warn(
      JSON.stringify({
        span:        this.operation,
        status:      'ERROR',
        durationMs:  this._durationMs,
        error:       error.message,
        errorType:   error.name,
        ...this.tags,
      }),
    );
  }

  get durationMs(): number | undefined {
    return this._durationMs;
  }
}

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * GOVERNANCE SPAN FACTORY
 *
 * Stateless factory. Call start() to begin a timed span.
 * Always call end() or endWithError() — use try/catch to guarantee it.
 *
 * In Phase 2, this factory will be updated to create real OTel spans.
 * All call sites remain identical — the factory absorbs the SDK change.
 */
export class GovernanceSpanFactory {
  private static readonly logger = new Logger('GovernanceSpan');

  /**
   * Start a new governance span.
   *
   * @param operation  Operation name from GovernanceOperation constants.
   * @param context    Contextual tags — all optional, included if present.
   * @returns A GovernanceSpan that must be ended (end() or endWithError()).
   */
  static start(
    operation: GovernanceOperationName,
    context: SpanContext = {},
  ): GovernanceSpan {
    return new GovernanceSpanImpl(operation, context, GovernanceSpanFactory.logger);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IDEMPOTENT HANDLER WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

import { DomainEventEnvelope, ProjectionHandler } from './domain-event.types';
import { ReplayProtectionStore } from './replay-protection-store';

/**
 * IDEMPOTENT HANDLER WRAPPER
 *
 * Wraps any ProjectionHandler to make it replay-safe.
 * Checks the ReplayProtectionStore before executing — skips if already processed.
 * Marks processed in the store after successful execution.
 *
 * Usage:
 *   const idempotentAudit = IdempotentHandler.wrap(auditHandler, replayStore);
 *   bus.registerHandler(idempotentAudit);
 *
 * Execution order:
 *   1. GovernanceSpan starts.
 *   2. ReplayProtectionStore.hasProcessed() checked.
 *   3. If already processed → span ends, skip.
 *   4. If not processed → inner.handle() executes.
 *   5. After success → ReplayProtectionStore.markProcessed() called.
 *   6. Span ends (with timing).
 *
 * TTL strategy per severity:
 *   critical    → PERMANENT_TTL (audit records must be forever idempotent)
 *   eventual    → 30 days (search can be re-indexed if truly needed)
 *   best_effort → 7 days (notifications are ephemeral)
 *
 * This wrapper does NOT change the handler's severity — the bus still
 * enforces the same failure semantics as before.
 */
export class IdempotentHandler<T = Record<string, unknown>>
  implements ProjectionHandler<T>
{
  readonly handles: ReadonlyArray<import('../governance/events/domain-events').DomainEventName>;
  readonly severity: 'critical' | 'eventual' | 'best_effort';
  readonly name: string;

  private static readonly TTL_BY_SEVERITY: Record<
    'critical' | 'eventual' | 'best_effort',
    number | null
  > = {
    critical:    null,  // permanent — audit records never expire
    eventual:    30,    // days — search/activity can be replayed if needed
    best_effort: 7,     // days — notifications are ephemeral
  };

  constructor(
    private readonly inner: ProjectionHandler<T>,
    private readonly replayStore: ReplayProtectionStore,
  ) {
    this.handles  = inner.handles;
    this.severity = inner.severity;
    this.name     = `Idempotent(${inner.name})`;
  }

  async handle(envelope: DomainEventEnvelope<T>): Promise<void> {
    const span = GovernanceSpanFactory.start(GovernanceOperation.HANDLER_EXECUTE, {
      tenantId:      envelope.tenantId,
      correlationId: envelope.correlationId,
      aggregateId:   envelope.aggregateId,
      aggregateType: envelope.aggregateType,
      actorId:       envelope.actorId,
    })
      .tag('handler', this.inner.name)
      .tag('event',   envelope.event)
      .tag('eventId', envelope.id);

    // ── Replay check ─────────────────────────────────────────────────────────
    const replaySpan = GovernanceSpanFactory.start(GovernanceOperation.REPLAY_CHECK, {
      tenantId: envelope.tenantId,
    }).tag('eventId', envelope.id).tag('handler', this.inner.name);

    const alreadyProcessed = await this.replayStore.hasProcessed(
      envelope.id,
      this.inner.name,
    );
    replaySpan.end();

    if (alreadyProcessed) {
      span.tag('skipped', true).tag('reason', 'already_processed');
      span.end();
      return;
    }

    // ── Execute inner handler ────────────────────────────────────────────────
    const start = Date.now();
    try {
      await this.inner.handle(envelope);
    } catch (err) {
      span.endWithError(err instanceof Error ? err : new Error(String(err)));
      throw err; // preserve original severity semantics
    }

    const durationMs = Date.now() - start;

    // ── Mark processed (AFTER success) ───────────────────────────────────────
    const markSpan = GovernanceSpanFactory.start(GovernanceOperation.REPLAY_MARK, {
      tenantId: envelope.tenantId,
    }).tag('eventId', envelope.id).tag('handler', this.inner.name);

    await this.replayStore.markProcessed(
      envelope.id,
      this.inner.name,
      {
        tenantId:      envelope.tenantId,
        eventName:     envelope.event,
        aggregateId:   envelope.aggregateId,
        aggregateType: envelope.aggregateType,
        durationMs,
      },
      IdempotentHandler.TTL_BY_SEVERITY[this.inner.severity],
    );
    markSpan.end();

    span.tag('durationMs', durationMs).end();
  }

  /**
   * Factory: wrap an existing handler.
   * Preferred over the constructor for readability at call sites.
   */
  static wrap<T = Record<string, unknown>>(
    handler: ProjectionHandler<T>,
    replayStore: ReplayProtectionStore,
  ): IdempotentHandler<T> {
    return new IdempotentHandler(handler, replayStore);
  }
}
