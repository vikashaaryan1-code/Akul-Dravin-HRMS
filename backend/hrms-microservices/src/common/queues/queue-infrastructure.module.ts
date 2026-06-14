import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  QUEUE_AI_JOBS, QUEUE_ANALYTICS, QUEUE_PAYROLL,
  QUEUE_NOTIFICATIONS, QUEUE_GOVERNANCE, QUEUE_EMAILS,
  QUEUE_REPORTS, QUEUE_AUTOMATION, QUEUE_WEBHOOKS,
  QUEUE_SEARCH_INDEX, QUEUE_ACTIVITY_FEED, QUEUE_DOMAIN_EVENTS,
} from './queue-names';
import { DomainEventService } from '../events/domain-event.service';
import { DeadLetterService } from './dead-letter.service';
import { AiQueueProcessor } from './processors/ai-queue.processor';
import { AnalyticsQueueProcessor } from './processors/analytics-queue.processor';
import { PayrollQueueProcessor } from './processors/payroll-queue.processor';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';
import { GovernanceQueueProcessor } from './processors/governance-queue.processor';
import { AiEngineModule } from '../../modules/ai-engine/ai-engine.module';
import { AnalyticsModule } from '../../modules/analytics/analytics.module';
import { AuditModule } from '../audit/audit.module';
import { RedisModule } from '../redis/redis.module';
import { LocksModule } from '../locks/locks.module';
import { QueueMonitorService } from './queue-monitor.service';
import { CommunicationModule } from '../../modules/communication/communication.module';

/**
 * QUEUE INFRASTRUCTURE MODULE
 *
 * Central registration point for all BullMQ queues and their domain processors.
 *
 * Architecture:
 *  - Co-located with the main API process for now.
 *  - Future: extract processors to a separate worker app (entry point split).
 *    The processor code is identical — only the NestJS bootstrap changes.
 *
 * Queue configuration strategy:
 *  - All queues use the global BullModule.forRoot() Redis connection (app.module.ts).
 *  - Per-queue defaultJobOptions set sensible retry/backoff/removal policies.
 *
 * Exported:
 *  - All BullModule queues (for producer injection in domain modules)
 *  - DeadLetterService (for admin query endpoints)
 */
@Global()
@Module({
  imports: [
    // ── Register all queues ──────────────────────────────────────────────────
    BullModule.registerQueue(
      {
        name: QUEUE_AI_JOBS,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100, age: 3600 },
          removeOnFail:     { count: 500, age: 86400 },
        },
      },
      {
        name: QUEUE_ANALYTICS,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 200, age: 1800 },
          removeOnFail:     { count: 100, age: 43200 },
        },
      },
      {
        name: QUEUE_PAYROLL,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 50,  age: 604800 }, // keep 7 days
          removeOnFail:     { count: 100, age: 604800 },
        },
      },
      {
        name: QUEUE_NOTIFICATIONS,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 500, age: 3600 },
          removeOnFail:     { count: 200, age: 86400 },
        },
      },
      {
        name: QUEUE_GOVERNANCE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 200, age: 3600 },
          removeOnFail:     { count: 200, age: 86400 },
        },
      },
      // Additional queues registered without dedicated processors yet
      { name: QUEUE_EMAILS },
      { name: QUEUE_REPORTS },
      { name: QUEUE_AUTOMATION },
      { name: QUEUE_WEBHOOKS },
      { name: QUEUE_SEARCH_INDEX },
      { name: QUEUE_ACTIVITY_FEED },
      { name: QUEUE_DOMAIN_EVENTS },
      { name: 'payroll-orchestration' },
    ),

    // ── Processor dependencies ───────────────────────────────────────────────
    AiEngineModule,
    AnalyticsModule,
    AuditModule,
    RedisModule,
    LocksModule,
    CommunicationModule,
  ],
  providers: [
    // Infrastructure services
    DeadLetterService,
    DomainEventService,

    // Domain processors
    AiQueueProcessor,
    AnalyticsQueueProcessor,
    PayrollQueueProcessor,
    NotificationQueueProcessor,
    GovernanceQueueProcessor,
    QueueMonitorService,
  ],
  exports: [
    // Export queue references for producers in domain modules
    BullModule,
    DeadLetterService,
    DomainEventService,
  ],
})
export class QueueInfrastructureModule {}
