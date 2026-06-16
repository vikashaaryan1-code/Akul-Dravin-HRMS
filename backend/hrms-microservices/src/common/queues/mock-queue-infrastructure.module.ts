import { Global, Module } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import {
  QUEUE_AI_JOBS, QUEUE_ANALYTICS, QUEUE_PAYROLL,
  QUEUE_NOTIFICATIONS, QUEUE_GOVERNANCE, QUEUE_EMAILS,
  QUEUE_REPORTS, QUEUE_AUTOMATION, QUEUE_WEBHOOKS,
  QUEUE_SEARCH_INDEX, QUEUE_ACTIVITY_FEED, QUEUE_DOMAIN_EVENTS,
} from './queue-names';
import { DomainEventService } from '../events/domain-event.service';
import { DeadLetterService } from './dead-letter.service';
import { QueueMonitorService } from './queue-monitor.service';

const mockQueue = {
  add: async () => ({ id: 'mock-job-id' }),
  process: async () => {},
  on: () => {},
  getJobCounts: async () => ({}),
  getJobs: async () => [],
  pause: async () => {},
  resume: async () => {},
};

const queueProviders = [
  QUEUE_AI_JOBS, QUEUE_ANALYTICS, QUEUE_PAYROLL,
  QUEUE_NOTIFICATIONS, QUEUE_GOVERNANCE, QUEUE_EMAILS,
  QUEUE_REPORTS, QUEUE_AUTOMATION, QUEUE_WEBHOOKS,
  QUEUE_SEARCH_INDEX, QUEUE_ACTIVITY_FEED, QUEUE_DOMAIN_EVENTS,
  'payroll-orchestration'
].map(queueName => ({
  provide: getQueueToken(queueName),
  useValue: mockQueue,
}));

@Global()
@Module({
  providers: [
    ...queueProviders,
    {
      provide: DeadLetterService,
      useValue: {
        getDeadLetters: async () => [],
        retryDeadLetter: async () => {},
      },
    },
    {
      provide: DomainEventService,
      useValue: {
        publish: async () => {},
      },
    },
    {
      provide: QueueMonitorService,
      useValue: {
        getSystemStatus: async () => ({}),
      },
    },
  ],
  exports: [
    ...queueProviders,
    DeadLetterService,
    DomainEventService,
  ],
})
export class MockQueueInfrastructureModule {}
