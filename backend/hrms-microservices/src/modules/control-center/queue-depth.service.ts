import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_PAYROLL, QUEUE_AUTOMATION, QUEUE_NOTIFICATIONS } from '../../common/queues/queue-names';
import { metrics } from '../../common/metrics/metrics.registry';

export interface QueueDepthSnapshot {
  waiting:   number;
  active:    number;
  failed:    number;
  completed: number;
  delayed:   number;
}

export interface AllQueueDepths {
  payroll:       QueueDepthSnapshot;
  automation:    QueueDepthSnapshot;
  notifications: QueueDepthSnapshot;
  /** Epoch ms when snapshot was taken */
  capturedAt:    number;
}

/**
 * QueueDepthService — aggregates BullMQ job counts for all three workload queues.
 *
 * Used by the internal monitoring endpoint and by PayrollService backpressure check.
 * Also syncs live counts into the Prometheus queueDepth gauge on every scrape.
 */
@Injectable()
export class QueueDepthService {
  constructor(
    @InjectQueue(QUEUE_PAYROLL)
    private readonly payrollQueue: Queue,
    @InjectQueue(QUEUE_AUTOMATION)
    private readonly automationQueue: Queue,
    @InjectQueue(QUEUE_NOTIFICATIONS)
    private readonly notifQueue: Queue,
  ) {}

  async getAll(): Promise<AllQueueDepths> {
    const [payroll, automation, notif] = await Promise.all([
      this.payrollQueue.getJobCounts('waiting', 'active', 'failed', 'completed', 'delayed'),
      this.automationQueue.getJobCounts('waiting', 'active', 'failed', 'completed', 'delayed'),
      this.notifQueue.getJobCounts('waiting', 'active', 'failed', 'completed', 'delayed'),
    ]);

    return {
      payroll:       this.toSnapshot(payroll),
      automation:    this.toSnapshot(automation),
      notifications: this.toSnapshot(notif),
      capturedAt:    Date.now(),
    };
  }

  /**
   * Sync live BullMQ job counts into the hrms_queue_depth Prometheus gauge.
   * Called by MetricsController on every /internal/metrics scrape — pull-based,
   * no background polling needed.
   */
  async syncGauges(): Promise<void> {
    const snapshot = await this.getAll();
    const queues: Array<[string, QueueDepthSnapshot]> = [
      [QUEUE_PAYROLL,       snapshot.payroll],
      [QUEUE_AUTOMATION,    snapshot.automation],
      [QUEUE_NOTIFICATIONS, snapshot.notifications],
    ];
    const states = ['waiting', 'active', 'failed', 'completed', 'delayed'] as const;

    for (const [queueName, depths] of queues) {
      for (const state of states) {
        metrics.queueDepth.set({ queue: queueName, state }, depths[state]);
      }
    }
  }

  private toSnapshot(counts: Record<string, number>): QueueDepthSnapshot {
    return {
      waiting:   counts['waiting']   ?? 0,
      active:    counts['active']    ?? 0,
      failed:    counts['failed']    ?? 0,
      completed: counts['completed'] ?? 0,
      delayed:   counts['delayed']   ?? 0,
    };
  }
}
