import { Controller, Get, HttpCode, Inject, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { QUEUE_NOTIFICATIONS, QUEUE_EMAILS, QUEUE_AI_JOBS, QUEUE_AUTOMATION } from '../../common/queues/queue-names';
import { RedisService } from '../../redis/redis.service';

type CheckStatus = 'ok' | 'down' | 'degraded';

interface QueueStats { waiting: number; active: number; failed: number }

interface HealthReport {
  status:    CheckStatus;
  version:   string;
  nodeEnv:   string;
  timestamp: string;
  uptime:    number;
  memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number };
  checks: {
    database:      CheckStatus;
    redis:         CheckStatus;
    queues:        CheckStatus;
    migrations:    CheckStatus;
    aiProvider:    'configured' | 'fallback';
  };
  queues?: Record<string, QueueStats>;
  migrations?: { last: string; count: number };
}

/**
 * GET /health — comprehensive health check for Railway / Docker / CI gates.
 *
 * HTTP 200 = ok or degraded (non-critical services down)
 * HTTP 503 = database is down (app cannot function)
 *
 * No auth required — accessible to load balancers.
 */
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Optional() @Inject('REDIS_CLIENT') private readonly legacyRedis: Redis | null,
    @Optional() private readonly redisService: RedisService,
    @Optional() @InjectQueue(QUEUE_NOTIFICATIONS) private readonly notifQueue: Queue | null,
    @Optional() @InjectQueue(QUEUE_EMAILS) private readonly emailQueue: Queue | null,
    @Optional() @InjectQueue(QUEUE_AI_JOBS) private readonly aiQueue: Queue | null,
    @Optional() @InjectQueue(QUEUE_AUTOMATION) private readonly autoQueue: Queue | null,
  ) {}

  @Get()
  @HttpCode(200)
  async check(): Promise<HealthReport> {
    const checks: HealthReport['checks'] = {
      database:   'down',
      redis:      'down',
      queues:     'down',
      migrations: 'down',
      aiProvider: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY ? 'configured' : 'fallback',
    };

    // ── Database ─────────────────────────────────────────────────────────────
    let migrationsInfo: HealthReport['migrations'];
    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';

      // Check migrations table
      try {
        const rows = await this.dataSource.query(
          `SELECT name, timestamp FROM migrations ORDER BY timestamp DESC LIMIT 1`
        );
        if (rows?.length > 0) {
          const countRow = await this.dataSource.query(`SELECT COUNT(*) AS count FROM migrations`);
          migrationsInfo = { last: rows[0].name, count: parseInt(countRow[0]?.count ?? '0', 10) };
          checks.migrations = 'ok';
        }
      } catch { /* migrations table may not exist yet */ }
    } catch { /* database remains 'down' */ }

    // ── Redis ─────────────────────────────────────────────────────────────────
    try {
      if (this.redisService?.isAvailable) {
        const pong = await this.redisService.get('__health_ping__').then(() => 'PONG');
        if (pong) checks.redis = 'ok';
      } else if (this.legacyRedis) {
        const pong = await this.legacyRedis.ping();
        if (pong === 'PONG') checks.redis = 'ok';
      } else {
        checks.redis = 'degraded'; // no Redis client — app still works
      }
    } catch { checks.redis = 'down'; }

    // ── BullMQ Queues ─────────────────────────────────────────────────────────
    const queueDetails: Record<string, QueueStats> = {};
    const queuesMap = [
      ['notifications', this.notifQueue],
      ['emails', this.emailQueue],
      ['ai-jobs', this.aiQueue],
      ['automation', this.autoQueue],
    ] as const;

    let queueUp = 0;
    for (const [name, q] of queuesMap) {
      if (!q) continue;
      try {
        const [waiting, active, failed] = await Promise.all([
          q.getWaitingCount(), q.getActiveCount(), q.getFailedCount(),
        ]);
        queueDetails[name] = { waiting, active, failed };
        queueUp++;
      } catch { /* queue unavailable */ }
    }
    checks.queues = queueUp > 0 ? 'ok' : checks.redis === 'down' ? 'down' : 'degraded';

    // ── Memory ───────────────────────────────────────────────────────────────
    const mem = process.memoryUsage();
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

    // ── Overall status ────────────────────────────────────────────────────────
    const overallStatus: CheckStatus =
      checks.database === 'down' ? 'down' :
      Object.values(checks).includes('down') || Object.values(checks).includes('degraded') ? 'degraded' :
      'ok';

    const report: HealthReport = {
      status:  overallStatus,
      version: process.env.npm_package_version ?? '1.0.0',
      nodeEnv: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: { heapUsedMB: mb(mem.heapUsed), heapTotalMB: mb(mem.heapTotal), rssMB: mb(mem.rss) },
      checks,
    };

    if (Object.keys(queueDetails).length > 0) report.queues = queueDetails;
    if (migrationsInfo) report.migrations = migrationsInfo;

    return report;
  }

  /** GET /health/ready — simple liveness probe (for k8s readinessProbe) */
  @Get('ready')
  @HttpCode(200)
  async ready(): Promise<{ ready: boolean }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { ready: true };
    } catch {
      return { ready: false };
    }
  }
}

