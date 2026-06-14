import { Controller, Get, Header } from '@nestjs/common';
import { QueueMetricsService } from '../queues/queue-metrics.service';
import { ALL_QUEUES } from '../queues/queue-names';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * MetricsController — unified Prometheus metrics endpoint.
 *
 * GET /metrics — Prometheus text format combining:
 *  - Runtime metrics (heap, RSS, uptime)
 *  - DB connection pool depth
 *  - BullMQ job throughput counters + duration histograms
 *  - DLQ depth gauges (live DB query)
 *  - Analytics projection lag gauges
 *  - Cache operation counters
 *
 * Secured by network policy — do NOT expose publicly.
 */
@Controller('metrics')
export class MetricsController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly queueMetrics: QueueMetricsService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async metrics(): Promise<string> {
    const sections: string[] = [];

    // ── Runtime metrics ────────────────────────────────────────────────────
    const mem = process.memoryUsage();
    sections.push([
      '# HELP akul_nodejs_heap_used_bytes Node.js heap used bytes',
      '# TYPE akul_nodejs_heap_used_bytes gauge',
      `akul_nodejs_heap_used_bytes ${mem.heapUsed}`,
      `akul_nodejs_rss_bytes ${mem.rss}`,
      `akul_nodejs_uptime_seconds ${Math.floor(process.uptime())}`,
    ].join('\n'));

    // ── DB connection pool ────────────────────────────────────────────────
    try {
      const [row] = await this.dataSource.query(
        `SELECT count(*) AS active FROM pg_stat_activity WHERE datname = current_database()`,
      );
      sections.push([
        '# HELP akul_db_connections_active Active DB connections',
        '# TYPE akul_db_connections_active gauge',
        `akul_db_connections_active ${row?.active ?? 0}`,
      ].join('\n'));
    } catch { /* pg_stat_activity may be restricted */ }

    // ── Refresh DLQ depth gauges (live DB query) ───────────────────────────
    await this.queueMetrics.refreshDlqDepth([...ALL_QUEUES]);

    // ── prom-client metrics (queue + projection + cache) ──────────────────
    const queueOutput = await this.queueMetrics.getPrometheusOutput();
    sections.push(queueOutput);

    return sections.join('\n\n') + '\n';
  }
}
