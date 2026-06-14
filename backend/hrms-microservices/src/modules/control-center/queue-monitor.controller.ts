import { Controller, Get } from '@nestjs/common';
import { QueueDepthService } from './queue-depth.service';

/**
 * QueueMonitorController — internal ops endpoint for queue depth visibility.
 *
 * Route: GET /internal/queue-depth
 *
 * IMPORTANT: This endpoint is intentionally NOT behind JWT auth — it is
 * designed for internal network access only (ops dashboards, k8s probes,
 * artillery pre-flight checks). In production, protect it at the
 * infrastructure level (e.g. via ingress IP allowlist or VPN-only routing).
 *
 * Response shape:
 * {
 *   "payroll":       { "waiting": 2,  "active": 1, "failed": 0, "completed": 100, "delayed": 0 },
 *   "rollout":       { "waiting": 14, "active": 3, "failed": 1, "completed": 42,  "delayed": 2 },
 *   "notifications": { "waiting": 0,  "active": 7, "failed": 0, "completed": 500, "delayed": 0 },
 *   "capturedAt":    1745589600000
 * }
 */
@Controller('internal')
export class QueueMonitorController {
  constructor(private readonly queueDepthService: QueueDepthService) {}

  @Get('queue-depth')
  getQueueDepth() {
    return this.queueDepthService.getAll();
  }
}
