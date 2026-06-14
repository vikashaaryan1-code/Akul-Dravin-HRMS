import { Controller, Get, Post, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { DeadLetterService } from '../../common/queues/dead-letter.service';
import { QueueMetricsService } from '../../common/queues/queue-metrics.service';
import { ALL_QUEUES, QueueName } from '../../common/queues/queue-names';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * DEAD LETTER QUEUE ADMIN CONTROLLER
 *
 * REST API for DLQ management. Used by PlatformOpsView dashboard.
 * All endpoints require JWT auth — these are admin-only operations.
 *
 *  GET    /admin/dlq                    — List dead letters (paginated, filterable)
 *  GET    /admin/dlq/snapshot           — Quick snapshot (all queues + DLQ depths)
 *  GET    /admin/dlq/:id                — Single dead letter detail + parsed payload
 *  POST   /admin/dlq/:id/replay         — Re-enqueue a failed job
 *  POST   /admin/dlq/:id/dismiss        — Mark as resolved without replaying
 */
@UseGuards(JwtAuthGuard)
@Controller('admin/dlq')
export class DeadLetterController {
  constructor(
    private readonly dlqService: DeadLetterService,
    private readonly metricsService: QueueMetricsService,
  ) {}

  // ── List dead letters ────────────────────────────────────────────────────

  @Get()
  async listDeadLetters(
    @Query('queue') queue?: string,
    @Query('tenantId') tenantId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.dlqService.getDeadLetters({
      queueName: queue as QueueName | undefined,
      tenantId,
      limit,
      offset,
    });
  }

  // ── Queue snapshot (for ops dashboard) ───────────────────────────────────

  @Get('snapshot')
  async getSnapshot() {
    const dlqMap = await this.metricsService.refreshDlqDepth([...ALL_QUEUES]);
    return {
      queues: Object.entries(dlqMap).map(([name, dlqDepth]) => ({
        name,
        dlqDepth,
        hasAlert: dlqDepth > 0,
      })),
      totalDlqEntries: Object.values(dlqMap).reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString(),
    };
  }

  // ── Single dead letter ────────────────────────────────────────────────────

  @Get(':id')
  async getDeadLetter(@Param('id') id: string) {
    const entry = await this.dlqService.getDeadLetter(id);
    if (!entry) {
      return { error: 'Dead letter not found', id };
    }
    return {
      ...entry,
      payloadParsed: entry.payload,
    };
  }

  // ── Replay ───────────────────────────────────────────────────────────────

  @Post(':id/replay')
  async replayDeadLetter(@Param('id') id: string) {
    const payload = await this.dlqService.markReplayed(id);
    if (!payload) {
      return { success: false, error: 'Dead letter not found or already replayed', id };
    }
    // Re-enqueueing requires InjectQueue — for MVP, return payload for manual re-enqueue
    // In production: inject the specific queue and add the job back
    return {
      success: true,
      message: 'Dead letter marked for replay. Re-enqueue via producer.',
      id,
      payload,
    };
  }

  // ── Dismiss ───────────────────────────────────────────────────────────────

  @Post(':id/dismiss')
  async dismissDeadLetter(@Param('id') id: string) {
    // Mark as replayed without re-enqueuing (operational dismissal)
    const payload = await this.dlqService.markReplayed(id);
    return {
      success: !!payload,
      message: payload ? 'Dead letter dismissed' : 'Not found',
      id,
    };
  }
}
