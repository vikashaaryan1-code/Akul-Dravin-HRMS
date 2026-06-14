import { Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../../common/context/tenant-context';
import { PolicyAuditEntity } from '../entities/policy-audit.entity';
import { RuleEvaluatorService } from '../evaluator/rule-evaluator.service';
import { PolicyAuditService } from '../audit/policy-audit.service';
import { PolicyResolverService } from '../resolver/policy-resolver.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WORKFORCE_EVENTS, PolicyDecisionEvent } from '../../../common/events/events.registry';
import { EvaluationContext, EvaluationResult, ExecutionMode } from '../types/policy.types';


@Injectable()
export class ExecutionGatekeeperService {
  private readonly logger = new Logger(ExecutionGatekeeperService.name);

  constructor(
    private readonly resolver: PolicyResolverService,
    private readonly evaluator: RuleEvaluatorService,
    private readonly auditService: PolicyAuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async validateDecision(context: EvaluationContext): Promise<EvaluationResult> {
    this.logger.log(`PDE Gatekeeper validating decision for field: ${context.targetField}`);

    // 1. Resolve effective rules for the context
    const rules = await this.resolver.resolveEffectivePolicy(
      context.tenantId,
      context.departmentId,
      context.roleId,
    );

    // --- Hardening: Fail-Safe Logic ---
    if (rules.length === 0) {
      this.logger.warn(`No rules found for context: ${JSON.stringify(context)}. Defaulting to REQUIRES_APPROVAL for safety.`);
      return {
        mode: ExecutionMode.REQUIRES_APPROVAL,
        allowed: false,
        riskScore: 50,
        reason: 'No applicable policy found; defaulting to REQUIRES_APPROVAL mode.',
        appliedRules: [],
      };
    }

    // 2. 🧬 Evaluate rules against the proposal
    const result = this.evaluator.evaluate(rules, context);

    // --- Safety Lattice: Layer 2 Hardening ---
    if (context.domain === 'MARTECH' && context.isHighRisk) {
      this.logger.log(`High-Risk MARTECH event detected. Enforcing Safety Trap.`);
      // If the evaluator says ALLOW_AUTO but it's high risk, we escalate to REQUIRES_APPROVAL
      if (result.mode === ExecutionMode.ALLOW_AUTO || result.mode === ExecutionMode.ALLOW_WITH_LIMIT) {
        result.mode = ExecutionMode.REQUIRES_APPROVAL;
        result.reason = `Autonomous proposal trapped for Human Authority (High-Risk Domain: ${context.targetField})`;
      }
    }

    // 3. 🧬 EMIT EVENT: Inform the Workforce OS Mesh
    this.broadcastDecision(context, result, rules);

    return result;
  }

  private broadcastDecision(context: EvaluationContext, result: EvaluationResult, rules: any[]) {
    const event = new PolicyDecisionEvent();
    event.employee = context.metadata?.employeeId || 'SYSTEM';
    event.decision = context.targetField;
    event.mode = result.mode;
    event.policy = rules.length > 0 ? rules[0].id : 'SYSTEM_DEFAULT';
    event.risk = result.riskScore > 0.7 ? 'HIGH' : result.riskScore > 0.4 ? 'MEDIUM' : 'LOW';
    event.timestamp = new Date().toISOString();
    event.traceId = context.metadata?.traceId;
    event.raw_result = result;
    event.raw_context = context;

    this.eventEmitter.emit(WORKFORCE_EVENTS.POLICY_DECISION, event);
  }
}
