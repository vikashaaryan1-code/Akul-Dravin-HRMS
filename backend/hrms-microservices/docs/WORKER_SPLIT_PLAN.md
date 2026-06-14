# Worker Split Plan

> **Status: LOCKED — Not for implementation until load test signal is received.**
>
> This document describes the exact steps to migrate from monolith mode
> (API + workers in one process) to distributed mode (separate worker processes).
>
> **Do not execute until Artillery results show a sustained queue build-up.**

---

## Current State (Monolith Mode)

```
process: main
├── HTTP API (NestJS)
├── A2zRolloutProcessor    ← registered in A2zEngineModule.providers[]
├── PayrollBatchProcessor  ← registered in PayrollModule.providers[]
└── NotificationProcessor  ← registered in NotificationModule.providers[]
```

All processors share the same Node.js event loop as the API. This is correct
and stable for beta scale. The `worker.config.ts` / `resolveWorkerModules()`
function exists as scaffolding but is **not called from bootstrap**.

---

## Target State (Distributed Mode)

```
process: api
└── HTTP API (NestJS) — no processors

process: worker-rollout
└── A2zRolloutProcessor only

process: worker-payroll
└── PayrollBatchProcessor only

process: worker-notifications
└── NotificationProcessor only
```

---

## Activation Gate (DO NOT BYPASS)

The following invariant must hold at all times:

> **A processor must be registered in exactly ONE of:**
> - the feature module's `providers[]` (monolith mode), OR
> - `resolveWorkerModules()` (distributed mode)
>
> **Never both simultaneously.**

Violating this causes every BullMQ job to execute twice —
same DB writes, same alert webhooks, same Prometheus counter increments.

---

## Migration Checklist

Execute steps in this exact order. Skipping or reordering causes double execution.

### Step 1 — Remove processors from feature modules

Edit each module to strip the processor from `providers[]`:

**`src/modules/a2z-engine/a2z-engine.module.ts`**

```diff
  providers: [
    A2zEngineService,
-   A2zRolloutProcessor,   // ← REMOVE
  ],
```

**`src/modules/payroll/payroll.module.ts`**

```diff
  providers: [
    PayrollService,
    PayrollBatchProcessor, // ← REMOVE
    RolesGuard,
  ],
```

**`src/modules/notification/notification.module.ts`**

```diff
  providers: [
    NotificationService,
    NotificationProcessor, // ← REMOVE
    RolesGuard,
  ],
```

---

### Step 2 — Create `worker.ts` entry point

Create `src/worker.ts` as a separate bootstrap (no HTTP, no middleware):

```ts
// src/worker.ts
import { NestFactory } from '@nestjs/core';
import { WorkerAppModule } from './worker-app.module';
import { GlobalLoggerService } from './common/logger/logger.service';
import * as os from 'node:os';

async function bootstrapWorker() {
  const workerType = (process.env.WORKER_TYPE ?? 'all') as WorkerType;

  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    bufferLogs: true,
  });

  const logger = app.get(GlobalLoggerService);
  app.useLogger(logger);

  await app.init();
  logger.log(
    `[WORKER] pid=${process.pid} host=${os.hostname()} type=${workerType} ` +
    `redis=${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`,
  );
}

bootstrapWorker();
```

---

### Step 3 — Create `WorkerAppModule`

```ts
// src/worker-app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { resolveWorkerModules, WorkerType } from './config/worker.config';
// Import only what workers need — no HTTP modules

const { queues, processors } = resolveWorkerModules(
  (process.env.WORKER_TYPE ?? 'all') as WorkerType,
);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({ /* same DB config */ }),
    BullModule.forRoot({ connection: { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT ?? 6379) } }),
    ...queues,
  ],
  providers: [...processors],
})
export class WorkerAppModule {}
```

---

### Step 4 — Update `tsconfig.build.json`

Add the new worker entry point so tsc compiles it:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "outDir": "./dist" },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

No changes needed — `src/worker.ts` is already covered by `"include": ["src"]`.

---

### Step 5 — Update `docker-compose.yml`

Add dedicated worker services:

```yaml
services:
  worker-rollout:
    build: ./backend/hrms-microservices
    command: node dist/worker.js
    environment:
      WORKER_TYPE: rollout
      REDIS_HOST: redis
      DB_HOST: postgres
    depends_on: [redis, postgres]
    restart: unless-stopped

  worker-payroll:
    build: ./backend/hrms-microservices
    command: node dist/worker.js
    environment:
      WORKER_TYPE: payroll
      REDIS_HOST: redis
      DB_HOST: postgres
    depends_on: [redis, postgres]
    restart: unless-stopped

  worker-notifications:
    build: ./backend/hrms-microservices
    command: node dist/worker.js
    environment:
      WORKER_TYPE: notifications
      REDIS_HOST: redis
      DB_HOST: postgres
    depends_on: [redis, postgres]
    restart: unless-stopped
```

---

### Step 6 — Update `package.json` scripts

```json
{
  "scripts": {
    "start:worker:rollout":       "WORKER_TYPE=rollout node dist/worker.js",
    "start:worker:payroll":       "WORKER_TYPE=payroll node dist/worker.js",
    "start:worker:notifications": "WORKER_TYPE=notifications node dist/worker.js"
  }
}
```

---

### Step 7 — Update Prometheus scrape config

When running multiple worker processes, each exposes its own `/metrics`.
Prometheus must scrape all targets:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: hrms-api
    static_configs:
      - targets: ['api:4001']

  - job_name: hrms-workers
    static_configs:
      - targets:
          - 'worker-rollout:4001'
          - 'worker-payroll:4001'
          - 'worker-notifications:4001'
```

> **Note:** Workers do not expose an HTTP server by default. You will need to
> add a `/metrics` endpoint to worker processes (minimal Express or NestJS
> HTTP adapter) or use push-gateway if scraping is not feasible.

---

### Step 8 — Verification (do not skip)

After migration, confirm **single execution**:

1. Submit one rollout job:
   ```bash
   POST /api/v1/a2z-engine/submit
   ```

2. Watch logs — you must see exactly:
   ```
   [JOB:x] START requestId=...
   [JOB:x] STAGE_COMPLETE stage=discovery ...
   [JOB:x] STAGE_COMPLETE stage=blueprint ...
   [JOB:x] STAGE_COMPLETE stage=execution ...
   [JOB:x] COMPLETE requestId=...
   ```
   If any line appears twice → double registration still present.

3. Check Prometheus:
   ```
   hrms_jobs_total{queue="rollout",status="started"} == 1
   hrms_jobs_total{queue="rollout",status="completed"} == 1
   ```
   If counters show 2 → processor still registered in feature module.

---

## Horizontal Metrics Note

The `metrics.registry.ts` singleton is **per-process**, which is correct.

Once multiple worker processes exist:
- Each process has its own Prometheus registry and counter state
- Grafana will aggregate across all scraped targets automatically
- Add an `instance` label to distinguish worker processes:

```ts
// future enhancement — not needed until distributed mode
promClient.collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'hrms_node_',
  labels: { instance: `${os.hostname()}-${process.pid}` },
});
```

---

## Rollback Plan

If distributed mode causes issues, revert by:

1. Re-adding processors to feature module `providers[]`
2. Removing `resolveWorkerModules()` calls from `worker-app.module.ts`
3. Stopping worker processes in docker-compose
4. Running `tsc --noEmit` to confirm clean compile
5. Verifying single-execution pattern (Step 8 above)

---

*Last updated: 2026-04-26 | Trigger: Load test signal (queue depth / p95 latency)*
