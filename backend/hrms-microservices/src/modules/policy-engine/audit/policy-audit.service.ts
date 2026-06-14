import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TenantContext } from '../../../common/context/tenant-context';
import { PolicyAuditEntity } from '../entities/policy-audit.entity';
import { WORKFORCE_EVENTS, PolicyDecisionEvent } from '../../../common/events/events.registry';

@Injectable()
export class PolicyAuditService {
  private readonly logger = new Logger(PolicyAuditService.name);

  private get auditRepo() {
    return TenantContext.getRepository(PolicyAuditEntity);
  }

  @OnEvent(WORKFORCE_EVENTS.POLICY_DECISION)
  async handlePolicyDecision(event: PolicyDecisionEvent): Promise<void> {
    const { raw_context: context, raw_result: result, policy: rulesSnapshot } = event;
    try {
      const audit = this.auditRepo.create({
        tenantId: context.tenantId,
        policyId: 'SYSTEM', // Root authority
        employeeId: context.metadata?.employeeId,
        recommendationId: context.metadata?.recommendationId,
        targetField: context.targetField,
        policy_snapshot: rulesSnapshot,
        evaluation_result: result,
        final_mode: result.mode,
        traceId: context.metadata?.traceId,
        decisionMetadata: {
          timestamp: new Date().toISOString(),
          riskScore: result.riskScore,
          context: context, // Full context preserved
        },
      });

      await this.auditRepo.save(audit);
      this.logger.log(`Forensic Audit Recorded: ${context.targetField} -> ${result.mode} [Trace: ${context.metadata?.traceId}]`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to record policy decision: ${msg}`);
    }
  }

  async findByTraceId(traceId: string): Promise<PolicyAuditEntity | null> {
    return this.auditRepo.findOne({ where: { traceId } });
  }

  async getTotalCount(): Promise<number> {
    return this.auditRepo.count();
  }
}
