import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { QueueDepthService } from '../../modules/control-center/queue-depth.service';
import { metrics } from './metrics.registry';

/**
 * MetricsController — Prometheus scrape endpoint.
 *
 * Route: GET /internal/metrics
 *
 * IMPORTANT: No JWT auth — designed for Prometheus/Grafana scraper access.
 * In production, restrict at the ingress/ALB layer (IP allowlist or VPN).
 *
 * Sync behaviour:
 *  - On every scrape, refreshes hrms_queue_depth gauge from BullMQ before
 *    returning exposition text. This ensures the gauge reflects real-time
 *    queue state, not a stale cached value.
 */
@Controller('internal')
export class MetricsController {
  constructor(private readonly queueDepthService: QueueDepthService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(@Res() res: Response): Promise<void> {
    // Refresh queue depth gauges from BullMQ before exposition
    await this.queueDepthService.syncGauges();

    const output = await metrics.registry.metrics();
    res.send(output);
  }
}
