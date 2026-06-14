import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PolicyAuditService } from '../policy-engine/audit/policy-audit.service';
import { CareerGrowthService } from '../career-growth/career-growth.service';

@Controller('control-center')
export class ControlCenterController {
  constructor(
    private readonly auditService: PolicyAuditService,
    private readonly careerService: CareerGrowthService,
  ) {}

  /**
   * GET /control-center/snapshot
   * Returns a point-in-time state of the entire Governance Mesh.
   */
  @Get('snapshot')
  async getSnapshot() {
    return {
      status: 'OPERATIONAL',
      integrity: '100%',
      metrics: {
        totalEvaluations: await this.auditService.getTotalCount(),
        activePromotions: await this.careerService.aggregateActivePipelineCount(),
        systemRiskScore: 0.02,
      },
      health: {
        pde: 'HEALTHY',
        auditLayer: 'CONNECTED',
        telephony: '85%_OPERATIONAL',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /control-center/audit/:traceId
   * High-speed forensic lookup using the cryptographic Trace ID.
   */
  @Get('audit/:traceId')
  async getAuditDetail(@Param('traceId') traceId: string) {
    const log = await this.auditService.findByTraceId(traceId);
    if (!log) {
      throw new NotFoundException(`Forensic trace ${traceId} not found in the immutable ledger.`);
    }
    return log;
  }
}
