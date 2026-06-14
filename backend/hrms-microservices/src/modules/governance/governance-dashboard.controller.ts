import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GovernanceHealthService } from '../../common/governance/governance-health.service';
import { ViolationLogPersisterService } from '../../common/governance/violation-log-persister.service';
import { GovernanceDriftAnalyticsService } from '../../common/governance/governance-drift-analytics.service';
import { GovernanceScannerService } from '../../common/governance/scanner/governance-scanner.service';
import { OutboxDispatcher } from '../../common/domain-events/outbox-event.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, GOVERNANCE_ROLES } from '../../common/enums/role.enum';
import { TenantContext } from '../../common/context/tenant-context';
import { ResourceReservationService } from '../../common/alerts/resource-reservation.service';
import { WorkflowDependencyAnalyzer } from '../../common/alerts/workflow-dependency-analyzer.service';
import { WorkflowSimulator } from '../../common/alerts/workflow-simulator.service';
import { AdaptiveTTLService } from '../../common/alerts/adaptive-ttl.service';
import { MitigationPlanExecutor } from '../../common/alerts/mitigation-plan-executor.service';
import { MitigationSignalService } from '../../common/alerts/mitigation-signal.service';
import { MitigationScheduler } from '../../common/alerts/mitigation-scheduler.service';
import { CoordinationTelemetryService } from '../../common/alerts/coordination-telemetry.service';
import { StabilityReplayService } from '../../common/alerts/stability-replay.service';
import { RegulatorExplainabilityService } from '../../common/alerts/regulator-explainability.service';
import { ConstitutionalRegistryService } from '../../common/alerts/constitutional-registry.service';
import { ConstitutionalDriftService } from '../../common/alerts/constitutional-drift.service';
import { CURRENT_GOVERNANCE_MANIFEST } from '../../common/alerts/governance-algorithm-registry';
import { GovernancePrecedenceRegistry } from '../../common/alerts/governance-precedence-registry';
import { GovernanceFuzzingService } from '../../common/alerts/governance-fuzzing.service';
import { GovernanceEconomicsService } from '../../common/alerts/governance-economics.service';
import { RegulatorInteractionService, RegulatorSignal } from '../../common/alerts/governance-calculus.service';
import { GovernanceComplexityGuard } from '../../common/alerts/governance-complexity.guard';
import { GovernanceSimulationService } from '../../common/alerts/governance-simulation.service';
import { ToolchainIntegrityService } from '../../common/alerts/meta-verification.service';
import { GovernanceCompressionService } from '../../common/alerts/governance-compression.service';
import { GovernanceSkepticismEngine } from '../../common/alerts/governance-skepticism.engine';
import { GovernancePostmortemService, GovernanceIncident } from '../../common/alerts/governance-postmortem.service';
import * as path from 'path';

/**
 * GOVERNANCE DASHBOARD CONTROLLER
 *
 * The introspection surface for the governance control plane.
 * All endpoints are read-only except /replay (which triggers a safe retry
 * of a dead-lettered outbox entry).
 *
 * Access control:
 *   All endpoints: GOVERNANCE_ROLES (ROOT_OWNER, PLATFORM_ADMIN,
 *                  SUPER_ADMIN, SECURITY_AUDITOR, GOVERNANCE_AUDITOR)
 *   /replay:       ROOT_OWNER, PLATFORM_ADMIN only (mutation)
 *
 * Tenant scoping:
 *   SECURITY_AUDITOR, ROOT_OWNER, PLATFORM_ADMIN:  may pass ?tenantId= for cross-tenant view
 *   GOVERNANCE_AUDITOR, SUPER_ADMIN:               restricted to their own tenant
 *
 * Rate limiting:
 *   Dashboard reads: 60/min (observability tier)
 *   Replay actions:  5/min (mutation tier)
 *
 * Handler mutation invariant (encoded here):
 *   This controller ONLY reads governance data and triggers replay.
 *   It NEVER directly mutates PayrollBatch, LeaveRequest, or any operational entity.
 *   Replay triggers the outbox dispatcher — the mutation boundary is the
 *   TransitionPolicyEngine, not this controller.
 */
@Controller('governance')
@UseGuards(RolesGuard)
@Roles(...GOVERNANCE_ROLES)
export class GovernanceDashboardController {
  private readonly logger = new Logger(GovernanceDashboardController.name);

  /** Lazily instantiated: scanner is a plain class, not a NestJS provider. */
  private readonly scanner = new GovernanceScannerService(
    path.resolve(__dirname, '../../../../..'),
  );

  constructor(
    private readonly healthService:   GovernanceHealthService,
    private readonly persister:        ViolationLogPersisterService,
    private readonly driftAnalytics:   GovernanceDriftAnalyticsService,
    private readonly outboxDispatcher: OutboxDispatcher,
    private readonly reservation:      ResourceReservationService,
    private readonly analyzer:         WorkflowDependencyAnalyzer,
    private readonly workflowSimulator: WorkflowSimulator,
    private readonly ttlService:       AdaptiveTTLService,
    private readonly planExecutor:     MitigationPlanExecutor,
    private readonly signalService:    MitigationSignalService,
    private readonly scheduler:        MitigationScheduler,
    private readonly telemetry:        CoordinationTelemetryService,
    private readonly replay:           StabilityReplayService,
    private readonly explanator:       RegulatorExplainabilityService,
    private readonly registry:         ConstitutionalRegistryService,
    private readonly driftService:     ConstitutionalDriftService,
    private readonly precedence:       GovernancePrecedenceRegistry,
    private readonly fuzzer:           GovernanceFuzzingService,
    private readonly economics:        GovernanceEconomicsService,
    private readonly dynamics:         RegulatorInteractionService,
    private readonly complexity:       GovernanceComplexityGuard,
    private readonly govSimulation:    GovernanceSimulationService,
    private readonly integrity:        ToolchainIntegrityService,
    private readonly compression:      GovernanceCompressionService,
    private readonly skepticism:       GovernanceSkepticismEngine,
    private readonly postmortem:       GovernancePostmortemService,
  ) {}

  // ── Orchestration Introspection (Phases AT-1 to AT-4) ──────────────────────

  /**
   * GET /governance/reservations
   * Returns active and waiting resource reservations across the platform.
   */
  @Get('reservations')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getReservations() {
    return this.reservation.getReport();
  }

  /**
   * GET /governance/deadlocks
   * Performs wait-for graph analysis to detect coordination cycles (Phase AT-2).
   */
  @Get('deadlocks')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async getDeadlocks() {
    return this.analyzer.analyze(
      this.signalService.getActiveSignals(),
      this.planExecutor.getAllExecutions(),
      (this.scheduler as any).getDeferredQueue ? (this.scheduler as any).getDeferredQueue() : [],
      this.reservation.getReport().activeReservations,
    );
  }

  /**
   * GET /governance/adaptive-ttl
   * Returns telemetry-informed TTL adaptations per resource (Phase AT-4).
   */
  @Get('adaptive-ttl')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getAdaptiveTTL() {
    return this.ttlService.getReport();
  }

  /**
   * POST /governance/simulate/:planId
   * Forecasts conflict likelihood and success probability for a plan (Phase AT-3).
   */
  @Post('simulate/:planId')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async simulatePlan(@Param('planId') planId: string) {
    const plan = this.planExecutor.getPlan(planId);
    if (!plan) throw new BadRequestException(`Plan not found: ${planId}`);
    
    const activeSignals = this.signalService.getActiveSignals();
    const report = this.reservation.getReport();
    
    return this.workflowSimulator.simulate(
      plan, 
      activeSignals, 
      report.activeReservations, 
      report.waitQueues
    );
  }

  // ── GET /governance/health ─────────────────────────────────────────────────

  /**
   * Full governance health snapshot.
   * Aggregates outbox health, handler metrics, and violation counts.
   *
   * Query param `?tenantId=` available to ROOT_OWNER/PLATFORM_ADMIN
   * for cross-tenant inspection. Other roles see their own tenant only.
   */
  @Get('health')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getHealth(
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(user, queryTenantId);
    return this.healthService.getSnapshot(tenantId);
  }

  // ── GET /governance/outbox ─────────────────────────────────────────────────

  /**
   * Outbox queue health: pending, dispatching, delivered, failed counts
   * plus oldest pending age and overdue entry count.
   */
  @Get('outbox')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getOutboxHealth(
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(user, queryTenantId);
    return this.healthService.getOutboxHealth(tenantId);
  }

  // ── GET /governance/dead-letters ───────────────────────────────────────────

  /**
   * All dead-lettered outbox entries.
   * These are events that exhausted all retry attempts and require
   * manual intervention via /governance/replay/:id.
   */
  @Get('dead-letters')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getDeadLetters(
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = this.resolveTenantId(user, queryTenantId);
    const limitNum = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    return this.healthService.getDeadLettered(tenantId, limitNum);
  }

  // ── GET /governance/violations ─────────────────────────────────────────────

  /**
   * Transition violation metrics for the last 24 hours.
   * Broken down by type (ILLEGAL_TRANSITION, INSUFFICIENT_ROLE, MISSING_JUSTIFICATION)
   * and by domain (payroll, leave, workflow, etc.).
   */
  @Get('violations')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getViolations(
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(user, queryTenantId);
    return this.healthService.getViolationMetrics(tenantId);
  }

  // ── GET /governance/handlers ───────────────────────────────────────────────

  /**
   * Handler execution metrics for the last 24 hours.
   * Shows success counts and average duration per handler.
   */
  @Get('handlers')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getHandlerMetrics(
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.resolveTenantId(user, queryTenantId);
    return this.healthService.getHandlerHealth(tenantId);
  }

  // ── GET /governance/replay/envelope/:envelopeId ────────────────────────────

  /**
   * REPLAY INSPECTOR — by envelope ID
   *
   * Find the outbox entry for a specific event envelope.
   * Shows delivery status, attempt count, and handler execution history.
   */
  @Get('replay/envelope/:envelopeId')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async inspectByEnvelope(
    @Param('envelopeId', new ParseUUIDPipe()) envelopeId: string,
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.requireTenantId(user, queryTenantId);
    const [outboxEntry, handlerHistory] = await Promise.all([
      this.healthService.findByEnvelopeId(envelopeId, tenantId),
      this.healthService.getHandlerExecutionHistory(envelopeId, tenantId),
    ]);
    return { outboxEntry, handlerHistory };
  }

  // ── GET /governance/replay/aggregate/:aggregateId ──────────────────────────

  /**
   * REPLAY INSPECTOR — by aggregate ID
   *
   * All outbox entries for a specific aggregate (PayrollBatch, LeaveRequest, etc.)
   * in chronological order. Shows the full event emission history for an entity.
   */
  @Get('replay/aggregate/:aggregateId')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async inspectByAggregate(
    @Param('aggregateId', new ParseUUIDPipe()) aggregateId: string,
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.requireTenantId(user, queryTenantId);
    return this.healthService.findByAggregateId(aggregateId, tenantId);
  }

  // ── GET /governance/replay/correlation/:correlationId ─────────────────────

  /**
   * REPLAY INSPECTOR — by correlation ID
   *
   * All outbox entries sharing a correlation ID (same HTTP request).
   * Use for post-mortem: "show all events emitted by request X."
   */
  @Get('replay/correlation/:correlationId')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async inspectByCorrelation(
    @Param('correlationId') correlationId: string,
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('tenantId') queryTenantId?: string,
  ) {
    const tenantId = this.requireTenantId(user, queryTenantId);
    return this.healthService.findByCorrelationId(correlationId, tenantId);
  }

  // ── GET /governance/replay/range ───────────────────────────────────────────

  /**
   * REPLAY INSPECTOR — by time range
   *
   * All outbox entries within a time window.
   * Use for incident post-mortems: "show all events between 14:00 and 15:00."
   *
   * Query params:
   *   from      ISO timestamp (required)
   *   to        ISO timestamp (required)
   *   eventName Optional filter by event type
   */
  @Get('replay/range')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async inspectByTimeRange(
    @CurrentUser() user: { sub: string; role?: string; roles?: string[] },
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('tenantId') queryTenantId?: string,
    @Query('eventName') eventName?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('Both "from" and "to" query parameters are required (ISO timestamps).');
    }
    const fromDate = new Date(from);
    const toDate   = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('"from" and "to" must be valid ISO timestamps.');
    }
    if (toDate.getTime() - fromDate.getTime() > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Time range cannot exceed 24 hours per query.');
    }

    const tenantId = this.requireTenantId(user, queryTenantId);
    return this.healthService.findByTimeRange(fromDate, toDate, tenantId, eventName);
  }

  // ── GET /governance/violations/static ───────────────────────────────────────

  /**
   * STATIC VIOLATION DASHBOARD
   *
   * Returns the most recent static-analysis violations persisted from the
   * governance scanner. Shows the current architectural debt picture.
   *
   * Query params:
   *   limit    Max rows (default: 50, max: 200)
   */
  @Get('violations/static')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getStaticViolations(
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? Math.min(parseInt(limit, 10), 200) : 50;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    return this.persister.getRecentStaticViolations({ since, limit: limitNum });
  }

  // ── GET /governance/violations/chronic ────────────────────────────────────

  /**
   * CHRONIC VIOLATION DASHBOARD
   *
   * Returns static analysis violations that have recurred across multiple
   * scanner runs — these represent persistent architectural debt.
   *
   * Query params:
   *   threshold   Minimum occurrenceCount to qualify as chronic (default: 3)
   */
  @Get('violations/chronic')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async getChronicViolations(
    @Query('threshold') threshold?: string,
  ) {
    const thresholdNum = threshold ? Math.max(parseInt(threshold, 10), 2) : 3;
    return this.persister.getChronicViolations(thresholdNum);
  }

  // ── POST /governance/scan ─────────────────────────────────────────────────

  /**
   * LIVE GOVERNANCE SCAN
   *
   * Triggers the AST-based static analysis scan and persists violations
   * to ViolationLogEntity. Safe to call from the dashboard — runs in
   * dashboard mode (no process.exit), persists results to DB.
   *
   * Authorization: ROOT_OWNER, PLATFORM_ADMIN only (reads source tree).
   *
   * Returns a ScanResult summary with violation counts and details.
   * For the full SARIF output, use the governance:scan:sarif npm script.
   */
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  async triggerScan(
    @CurrentUser() user: { sub: string },
  ) {
    // Hard block in production — governance scans read the source tree, generate SARIF,
    // and create DB churn. All three are operationally dangerous on production servers.
    // Emergency prod scanning must go through CI/CD runners or a maintenance CLI,
    // not through public HTTP surfaces that could be triggered by any admin session.
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Governance scans are disabled in production. ' +
        'Use the CI pipeline (npm run governance:scan) or a maintenance CLI runner.',
      );
    }

    this.logger.log(`GOVERNANCE_SCAN: triggered by actor=${user.sub}`);

    const result = await this.scanner.scan({
      mode: 'ci',
      persister: (violations) => this.persister.persistScanViolations(violations).then(() => undefined),
    });

    this.logger.log(
      `GOVERNANCE_SCAN: complete — ${result.totalViolations} violations ` +
      `(critical=${result.criticalCount}, high=${result.highCount}, medium=${result.mediumCount})`,
    );

    return {
      scannedAt:       result.scannedAt,
      engine:          result.astMode ? 'ast' : 'regex',
      totalViolations: result.totalViolations,
      criticalCount:   result.criticalCount,
      highCount:       result.highCount,
      mediumCount:     result.mediumCount,
      clean:           result.clean,
      violations:      result.violations.map((v) => ({
        ruleId:        v.ruleId,
        severity:      v.severity,
        violationType: v.violationType,
        file:          v.filePath,
        line:          v.lineNumber,
        pattern:       v.pattern,
        message:       v.message,
        fingerprint:   v.fingerprint,
      })),
    };
  }

  // ── POST /governance/replay/:outboxId ──────────────────────────────────────

  /**
   * MANUAL REPLAY — Reset a dead-lettered outbox entry for re-dispatch.
   *
   * Authorization: ROOT_OWNER, PLATFORM_ADMIN only.
   * This is a mutation (resets outbox status to PENDING) — stricter RBAC applies.
   *
   * Handler idempotency (Commit 7) ensures that even if the event was partially
   * processed, handlers will skip duplicate execution via ReplayProtectionStore.
   *
   * To force full handler re-execution (e.g., after fixing a broken handler),
   * first call the idempotency clear endpoint (Commit 10) then replay.
   */
  @Post('replay/:outboxId')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN)
  async triggerReplay(
    @Param('outboxId', new ParseUUIDPipe()) outboxId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: { sub: string },
    @Query('tenantId') queryTenantId?: string,
  ) {
    if (!body?.reason?.trim()) {
      throw new BadRequestException('A "reason" is required for manual replay — audit trail must be complete.');
    }

    const tenantId = TenantContext.getRequiredTenantId();

    this.logger.log(
      `MANUAL_REPLAY: outboxId=${outboxId} actor=${user.sub} reason="${body.reason}"`,
    );

    await this.outboxDispatcher.resetForReplay(outboxId, queryTenantId ?? tenantId);

    return {
      message:  'Outbox entry reset to PENDING. Dispatcher will deliver within 5 seconds.',
      outboxId,
      actor:    user.sub,
      reason:   body.reason,
      resetAt:  new Date().toISOString(),
    };
  }

  // ── GET /governance/drift ────────────────────────────────────────────────────

  /**
   * Full governance drift report.
   *
   * Returns a composite snapshot of architectural health over time:
   *   - severity breakdown (CRITICAL/HIGH/MEDIUM/LOW active violation counts)
   *   - drift score + trend direction (IMPROVING / STABLE / DEGRADING)
   *   - hotspot files sorted by cumulative recurrence
   *   - per-rule violation summary
   *   - daily new-violation + recurrence trend series
   *
   * Query params:
   *   ?windowDays=30     — how many calendar days the trend covers (default 30, max 90)
   *   ?hotspotLimit=10   — max hotspot files to return (default 10, max 50)
   *
   * Platform-wide (not tenant-scoped): static violations describe source code,
   * not tenant operational data.
   */
  @Get('drift')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getDriftReport(
    @Query('windowDays')   rawWindowDays?:   string,
    @Query('hotspotLimit') rawHotspotLimit?: string,
  ) {
    const windowDays   = Math.min(90,  Math.max(1, parseInt(rawWindowDays   ?? '30', 10) || 30));
    const hotspotLimit = Math.min(50,  Math.max(1, parseInt(rawHotspotLimit ?? '10', 10) || 10));

    const report = await this.driftAnalytics.getFullReport(windowDays, hotspotLimit);
    return { ok: true, data: report };
  }

  /**
   * Drift score only — lightweight polling endpoint for dashboards/alerting.
   *
   * Clients can poll this at high frequency to detect regression spikes
   * without paying the cost of the full report fan-out.
   *
   * trend values:
   *   IMPROVING  — fewer new violations this week than last week
   *   STABLE     — same count as last week
   *   DEGRADING  — more new violations this week than last week
   */
  @Get('drift/score')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getDriftScore() {
    const score = await this.driftAnalytics.getDriftScore();
    return { ok: true, data: score };
  }

  /**
   * Active violation severity breakdown.
   * Suitable for a status-page widget or executive summary card.
   */
  @Get('drift/severity')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getSeverityBreakdown() {
    const severity = await this.driftAnalytics.getSeverityBreakdown();
    return { ok: true, data: severity };
  }

  /**
   * Top N hotspot files — files with the highest cumulative governance debt.
   * Sorted by total occurrence_count descending (chronic files surface first).
   *
   * ?limit=10     — max files to return (default 10, max 50)
   * ?windowDays=7 — how far back to look at last_seen_at (default 7)
   */
  @Get('drift/hotspots')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getHotspots(
    @Query('limit')      rawLimit?:      string,
    @Query('windowDays') rawWindowDays?: string,
  ) {
    const limit      = Math.min(50, Math.max(1, parseInt(rawLimit      ?? '10', 10) || 10));
    const windowDays = Math.min(90, Math.max(1, parseInt(rawWindowDays ?? '7',  10) || 7));
    const since      = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const hotspots = await this.driftAnalytics.getHotspots(since, limit);
    return { ok: true, data: hotspots, meta: { limit, windowDays } };
  }

  /**
   * Daily violation trend series.
   * Returns one DayBucket per calendar day over the last N days.
   *
   * Each bucket has:
   *   newViolations — net-new debt first detected that day
   *   activeHits    — total scanner hits (new + recurrences)
   *
   * ?windowDays=30 — how many days to cover (default 30, max 90)
   */
  @Get('drift/trend')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getDriftTrend(@Query('windowDays') rawWindowDays?: string) {
    const windowDays = Math.min(90, Math.max(1, parseInt(rawWindowDays ?? '30', 10) || 30));
    const trend      = await this.driftAnalytics.getTrend(windowDays);
    return { ok: true, data: trend, meta: { windowDays, buckets: trend.length } };
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  /**
   * Resolve tenantId for read endpoints.
   * Platform operators may inspect any tenant; others see their own tenant only.
   */
  private resolveTenantId(
    user: { role?: string; roles?: string[] },
    queryTenantId?: string,
  ): string | null {
    const roles = user.roles ?? (user.role ? [user.role] : []);
    const isPlatformOp = roles.some((r) =>
      [Role.ROOT_OWNER as string, Role.PLATFORM_ADMIN as string, Role.SECURITY_AUDITOR as string].includes(r),
    );

    if (isPlatformOp && !queryTenantId) {
      return null; // platform-wide view
    }
    if (isPlatformOp && queryTenantId) {
      return queryTenantId; // targeted cross-tenant inspection
    }

    // GOVERNANCE_AUDITOR, SUPER_ADMIN, others: own tenant only
    return TenantContext.getRequiredTenantId();
  }

  /**
   * Resolve tenantId for inspection endpoints that require a specific tenant
   * (replay inspector cannot be platform-wide — must target a specific tenant).
   */
  private requireTenantId(
    user: { role?: string; roles?: string[] },
    queryTenantId?: string,
  ): string {
    const roles = user.roles ?? (user.role ? [user.role] : []);
    const isPlatformOp = roles.some((r) =>
      [Role.ROOT_OWNER as string, Role.PLATFORM_ADMIN as string, Role.SECURITY_AUDITOR as string].includes(r),
    );

    if (isPlatformOp && queryTenantId) return queryTenantId;
    return TenantContext.getRequiredTenantId();
  }

  /**
   * Phase AV: Coordination Dynamics Telemetry.
   * Provides time-series history of entropy, pressure, and stability events.
   */
  @Get('telemetry')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async getTelemetry() {
    return this.telemetry.getHistory();
  }

  /**
   * GET /governance/telemetry/incidents
   * Reconstructs causal coordination narratives (Phase AV-Final).
   */
  @Get('telemetry/incidents')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async getIncidents() {
    return this.replay.getIncidents();
  }

  /**
   * GET /governance/telemetry/recommendations
   * Stability policy advisor: suggests tuning for kernel coefficients (Phase AV-Final).
   */
  @Get('telemetry/recommendations')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getRecommendations() {
    return this.replay.getRecommendations();
  }

  /**
   * GET /governance/explain/:id
   * Regulator Explainability Engine: translates raw thermodynamics into human reasoning (Phase AX).
   */
  @Get('explain/:id')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async explainDecision(@Param('id') id: string) {
    const history = this.telemetry.getHistory();
    const event = history.events.find(e => e.id === id);
    if (!event) return { error: 'Event not found' };

    const report = this.reservation.getReport();
    
    return this.explanator.generateReasoning(
      event.type === 'CONSTITUTIONAL_REJECTION' ? 'CONSTITUTIONAL_OVERRIDE' : (event.type === 'SUPERSESSION' ? 'SUPERSEDED' : 'GRANTED'),
      report.stats.kernelMode,
      report.stats.coordinationEntropy,
      report.stats.oscillationOnsetRisk,
      report.stats.starvationIndex, // Using starvation as a proxy for energy in this context
      event.metadata?.reason || ''
    );
  }

  /**
   * GET /governance/constitution/history
   * Constitutional Registry: view versioned operational laws (Phase AY).
   */
  @Get('constitution/history')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getConstitutionHistory() {
    return this.registry.getHistory();
  }

  /**
   * GET /governance/constitution/drift
   * Constitutional Drift Monitor: detects divergence between law and behavior (Phase AY).
   */
  @Get('constitution/drift')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getConstitutionDrift() {
    return this.driftService.analyzeDrift();
  }

  /**
   * GET /governance/algorithm/manifest
   * Governance Algorithm Registry: view pinned versions of evaluation logic (Phase BA).
   */
  @Get('algorithm/manifest')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getAlgorithmManifest() {
    return CURRENT_GOVERNANCE_MANIFEST;
  }

  /**
   * GET /governance/hierarchy
   * Governance Precedence: view the immutable authority hierarchy (Phase Ω).
   */
  @Get('hierarchy')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getGovernanceHierarchy() {
    return this.precedence.getHierarchy();
  }

  /**
   * POST /governance/simulate/storm
   * Adversarial Simulation: trigger a supersession storm fuzz test (Phase Ω).
   */
  @Post('simulate/storm')
  @Throttle({ default: { ttl: 300_000, limit: 1 } })
  async triggerFuzzTest() {
    this.fuzzer.simulateSupersessionStorm();
    return { status: 'SIMULATION_STARTED', type: 'SUPERSESSION_STORM' };
  }

  /**
   * GET /governance/economics
   * Governance Economics: view the thermodynamic cost and sustainability SLOs (Phase Σ).
   */
  @Get('economics')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getGovernanceEconomics() {
    return this.economics.getEconomicsReport();
  }

  /**
   * GET /governance/dynamics
   * Introspect regulator interactions (Phase ∞-Terminal).
   */
  @Get('dynamics')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getRegulatorDynamics(@Query('gains') gains: string) {
    const parsedGains = JSON.parse(gains || '{}');
    return this.dynamics.analyzeStability(parsedGains);
  }

  /**
   * POST /governance/simulate/counterfactual
   * Flight Simulator: run a counterfactual trial of a proposed constitution (Phase ∞).
   */
  @Post('simulate/counterfactual')
  @Throttle({ default: { ttl: 300_000, limit: 1 } })
  async runCounterfactualTrial(@Body() body: { scenario: 'STORM' | 'PEAK', gains: Record<RegulatorSignal, number> }) {
    return this.govSimulation.simulateCounterfactual(body.scenario, body.gains);
  }

  /**
   * POST /governance/integrity/verify
   * Perform a recursive integrity check on the coordination toolchain (Phase ∞-Terminal).
   */
  @Post('integrity/verify')
  @Throttle({ default: { ttl: 60_000, limit: 1 } })
  async verifyToolchainIntegrity() {
    const isStable = await this.integrity.verifyToolchainIntegrity();
    return { status: isStable ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_BREACHED', timestamp: new Date().toISOString() };
  }

  /**
   * POST /governance/compression/fold
   * Identify and fold redundant governance rules (Phase ∞-Terminal).
   */
  @Post('compression/fold')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getCompressionOpportunities() {
    return this.compression.analyzeCompressionOpportunities([]);
  }

  /**
   * GET /governance/humility
   * Operational Humility: view the confidence scores and assumption boundaries (Phase ℵ-Final).
   */
  @Get('humility')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getOperationalHumility() {
    return this.skepticism.evaluateConfidence('GLOBAL', false);
  }

  /**
   * GET /governance/rituals
   * Failure Metabolism: view the history of institutional failure rituals (Phase Ω-Final).
   */
  @Get('rituals')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async getGovernanceRituals() {
    return this.postmortem.getIncidentHistory();
  }

  /**
   * POST /governance/rituals/record
   * Record a Failure Ritual: document a systemic misalignment (Phase Ω-Final).
   */
  @Post('rituals/record')
  @Throttle({ default: { ttl: 60_000, limit: 1 } })
  async recordFailureRitual(@Body() incident: Omit<GovernanceIncident, 'timestamp'>) {
    return this.postmortem.recordPostmortem(incident);
  }
}
