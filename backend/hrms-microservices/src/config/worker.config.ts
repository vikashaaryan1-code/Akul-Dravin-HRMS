// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  WORKER SPLIT INVARIANT — READ BEFORE TOUCHING THIS FILE           ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║  DO NOT call resolveWorkerModules() in bootstrap while processors are   ║
// ║  still registered inside feature modules (A2zEngineModule,              ║
// ║  PayrollModule, NotificationModule).                                    ║
// ║                                                                         ║
// ║  CONSEQUENCE: both paths register the same @Processor class →           ║
// ║  every BullMQ job executes TWICE (duplicate logs, alerts, DB writes).   ║
// ║                                                                         ║
// ║  REQUIRED before activating resolveWorkerModules():                     ║
// ║  1. Remove all @Processor classes from feature module providers[]       ║
// ║  2. Move processors into dedicated worker-only modules                  ║
// ║  3. Create worker.ts entry point — separate process, no HTTP server     ║
// ║  4. Update docker-compose.yml to run worker.ts processes                ║
// ║                                                                         ║
// ║  See: docs/WORKER_SPLIT_PLAN.md for the full migration checklist.       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { DynamicModule, Type } from '@nestjs/common';
import { PayrollBatchProcessor } from '../modules/payroll/payroll-batch.processor';
import { A2zRolloutProcessor } from '../modules/a2z-engine/a2z-rollout.processor';
import { NotificationProcessor } from '../modules/notification/notification.processor';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_PAYROLL, QUEUE_AUTOMATION, QUEUE_NOTIFICATIONS } from '../common/queues/queue-names';

export type WorkerType = 'payroll' | 'rollout' | 'notifications' | 'all';

/**
 * resolveWorkerModules — returns the minimal set of BullMQ queue registrations
 * and processors for the requested WORKER_TYPE.
 *
 * Used by main.ts to boot a targeted worker process (no HTTP server) or the
 * full monolith (HTTP + all workers).
 *
 *   WORKER_TYPE=payroll       node dist/main.js   # payroll-only worker
 *   WORKER_TYPE=rollout       node dist/main.js   # rollout-only worker
 *   WORKER_TYPE=notifications node dist/main.js   # notifications-only worker
 *   WORKER_TYPE=all           node dist/main.js   # all workers (default)
 *   (unset)                                        # full monolith + all workers
 */
export function resolveWorkerModules(workerType: WorkerType): {
  queues: DynamicModule[];
  processors: Type<unknown>[];
} {
  // ── RUNTIME ACTIVATION GATE ──────────────────────────────────────────
  // Must set WORKER_SPLIT_ACTIVE=true in env AFTER completing all steps in
  // docs/WORKER_SPLIT_PLAN.md (removing processors from feature modules, etc.).
  //
  // Without that env var this function is unreachable — calling it means
  // the activation sequence was bypassed, which WILL cause double job execution.
  if (process.env.WORKER_SPLIT_ACTIVE !== 'true') {
    throw new Error(
      '[WORKER SPLIT BLOCKED] resolveWorkerModules() called without WORKER_SPLIT_ACTIVE=true. ' +
      'Processors are still registered inside feature modules. ' +
      'Activating worker split now WILL cause every BullMQ job to execute twice. ' +
      'Complete all steps in docs/WORKER_SPLIT_PLAN.md before setting WORKER_SPLIT_ACTIVE=true.',
    );
  }
  // ────────────────────────────────────────────────────────────

  switch (workerType) {
    case 'payroll':
      return {
        queues:     [BullModule.registerQueue({ name: QUEUE_PAYROLL })],
        processors: [PayrollBatchProcessor],
      };
    case 'rollout':
      return {
        queues:     [BullModule.registerQueue({ name: QUEUE_AUTOMATION })],
        processors: [A2zRolloutProcessor],
      };
    case 'notifications':
      return {
        queues:     [BullModule.registerQueue({ name: QUEUE_NOTIFICATIONS })],
        processors: [NotificationProcessor],
      };
    case 'all':
    default:
      return {
        queues: [
          BullModule.registerQueue({ name: QUEUE_PAYROLL }),
          BullModule.registerQueue({ name: QUEUE_AUTOMATION }),
          BullModule.registerQueue({ name: QUEUE_NOTIFICATIONS }),
        ],
        processors: [PayrollBatchProcessor, A2zRolloutProcessor, NotificationProcessor],
      };
  }
}
