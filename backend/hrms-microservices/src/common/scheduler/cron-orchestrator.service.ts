import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_EMAILS, QUEUE_AI_JOBS, QUEUE_REPORTS, QUEUE_PAYROLL } from '../../common/queues/queue-names';
import { TokenService } from '../../auth/token.service';
import { SloService } from '../../common/alerts/slo.service';
import { ErrorBudgetService } from '../../common/alerts/error-budget.service';
import { MitigationSignalService } from '../../common/alerts/mitigation-signal.service';
import { MitigationLeaderService } from '../../common/alerts/mitigation-leader.service';
import { MitigationOutcomeService } from '../../common/alerts/mitigation-outcome.service';
import { MitigationState } from '../../common/alerts/slo.types';

/**
 * CronOrchestratorService — centralized scheduler for all platform cron tasks.
 *
 * Separation of concerns: schedulers ADD jobs to queues.
 * Workers PROCESS those jobs.
 * This prevents tight coupling and ensures each cron task is retryable.
 *
 * Schedule documentation:
 * - Token cleanup:          Daily @ 2:00 AM
 * - Weekly reports:         Every Monday @ 6:00 AM
 * - Payroll reminders:      1st of month @ 8:00 AM
 * - Platform health eval:   Every 5 minutes
 *   └── Leader-gated:       Only the elected leader evaluates mitigations
 */
@Injectable()
export class CronOrchestratorService {
  private readonly logger = new Logger(CronOrchestratorService.name);

  constructor(
    @InjectQueue(QUEUE_EMAILS)  private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_AI_JOBS) private readonly aiQueue: Queue,
    @InjectQueue(QUEUE_REPORTS) private readonly reportQueue: Queue,
    @InjectQueue(QUEUE_PAYROLL) private readonly payrollQueue: Queue,
    private readonly tokenService:       TokenService,
    private readonly sloService:         SloService,
    private readonly errorBudgetService: ErrorBudgetService,
    private readonly mitigationService:  MitigationSignalService,
    private readonly leaderService:      MitigationLeaderService,
    private readonly outcomeService:     MitigationOutcomeService,
  ) {}

  // ── Scheduled tasks ───────────────────────────────────────────────────────

  /** Prune expired refresh tokens from DB daily at 2 AM */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async pruneExpiredTokens() {
    this.logger.log('CRON: pruneExpiredTokens start');
    try {
      const deleted = await this.tokenService.pruneExpiredTokens();
      this.logger.log(`CRON: pruneExpiredTokens done — deleted ${deleted} records`);
    } catch (err) {
      this.logger.error(`CRON: pruneExpiredTokens failed: ${String(err)}`);
    }
  }

  /** Weekly HR digest email — Monday 6 AM */
  @Cron('0 6 * * 1')
  async scheduleWeeklyDigest() {
    this.logger.log('CRON: scheduleWeeklyDigest');
    await this.reportQueue.add(
      'weekly-digest',
      { type: 'weekly_hr_digest', scheduledAt: new Date().toISOString() },
      { attempts: 2, backoff: { type: 'fixed', delay: 60_000 } },
    );
  }

  /** Payroll reminder — 1st of month 8 AM */
  @Cron('0 8 1 * *')
  async schedulePayrollReminder() {
    this.logger.log('CRON: schedulePayrollReminder');
    await this.payrollQueue.add(
      'payroll-reminder',
      { reminderType: 'monthly_payroll', scheduledAt: new Date().toISOString() },
      { attempts: 1 },
    );
  }

  /** AI insight generation — weekdays 7 AM */
  @Cron('0 7 * * 1-5')
  async scheduleAiInsights() {
    this.logger.log('CRON: scheduleAiInsights');
    await this.aiQueue.add(
      'scheduled-insight',
      { type: 'general', scheduledAt: new Date().toISOString() },
      { attempts: 1 },
    );
  }

  /**
   * Platform health evaluation — every 5 minutes.
   *
   * ── Standard evaluation (all nodes) ─────────────────────────────────────
   *  All workers evaluate SLO health and fire point-in-time breach alerts.
   *  This is stateless and idempotent — safe to run on every node.
   *
   * ── Leader-gated evaluation (one elected node only) ──────────────────────
   *  Error budget computation, burn rate analysis, and mitigation signal
   *  generation are stateful operations that must run on exactly ONE evaluator.
   *  The elected leader acquires the `hrms:mitigation:evaluator:leader` Redis
   *  lease before proceeding. If leadership cannot be acquired, these steps
   *  are skipped for this tick — the next tick will try again.
   *
   * ── Outcome analysis (leader only, async) ────────────────────────────────
   *  After each tick, check for signals that just transitioned to RESOLVED
   *  or ROLLED_BACK and trigger pre/post outcome analysis.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async evaluatePlatformHealth(): Promise<void> {
    this.logger.debug('CRON: evaluatePlatformHealth — running SLO evaluation cycle');

    // ── Step 1: SLO evaluation (all nodes — stateless, idempotent) ───────
    const results    = await this.sloService.evaluateAll();
    const sloDefns   = this.sloService.getSloDefinitions();
    const breaching  = results.filter(r => r.status === 'BREACHING');

    if (breaching.length > 0) {
      this.logger.warn(
        `CRON: SLO breaches detected: ${breaching.map(r => `${r.sloId}(${r.currentValue}${r.unit})`).join(', ')}`,
      );
    }

    // ── Step 2: Leader-gated stateful evaluation ──────────────────────────
    const isLeader = await this.leaderService.tryAcquireLease();

    if (isLeader) {
      this.logger.debug('[Leader] Running leader-gated evaluation cycle');

      // Error budget + burn rates (includes dual-window alert dispatch)
      const { burnRates } = await this.errorBudgetService.computeAllBudgets(
        Object.fromEntries(sloDefns.map(d => [d.id, d])) as any
      );

      // Mitigation signal evaluation — oscillation-protected, Redis-coordinated
      const newSignals = await this.mitigationService.evaluate(burnRates);

      if (newSignals.length > 0) {
        this.logger.log(`[Leader] ${newSignals.length} mitigation signal(s) proposed this tick`);
      }

      // ── Step 3: Outcome analysis for just-resolved / rolled-back signals ─
      const closeableSignals = this.mitigationService
        .getSignals(200)
        .filter(s =>
          s.state === MitigationState.RESOLVED ||
          s.state === MitigationState.ROLLED_BACK,
        )
        // Only analyze signals that resolved in the last 10 minutes
        .filter(s => Date.now() - new Date(s.lastTransitionAt).getTime() < 10 * 60 * 1000);

      for (const sig of closeableSignals) {
        // Fire and forget — outcome analysis is non-blocking
        this.outcomeService.analyzeOutcome(sig).catch(err =>
          this.logger.warn(`[Leader] Outcome analysis failed for ${sig.id}: ${String(err)}`),
        );
      }
    } else {
      this.logger.debug('[Follower] Skipping leader-gated evaluation — not leader this tick');
    }

    // ── Step 4: Queue saturation guard (all nodes — supplemental) ─────────
    const queues = [
      { name: 'emails',   q: this.emailQueue  },
      { name: 'ai-jobs',  q: this.aiQueue     },
      { name: 'reports',  q: this.reportQueue },
      { name: 'payroll',  q: this.payrollQueue },
    ];
    for (const { name, q } of queues) {
      try {
        const waiting = await q.getWaitingCount();
        if (waiting > 500) {
          this.logger.warn(`QUEUE_SATURATION: ${name} has ${waiting} waiting jobs — potential backpressure`);
        }
      } catch { /* BullMQ queue unavailable */ }
    }
  }
}
