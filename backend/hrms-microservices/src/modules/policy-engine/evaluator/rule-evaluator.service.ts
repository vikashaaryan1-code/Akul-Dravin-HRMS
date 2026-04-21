import { Injectable, Logger } from '@nestjs/common';
import { 
  PolicyRule, 
  PolicyRuleType, 
  EvaluationContext, 
  ExecutionMode,
  EvaluationResult 
} from '../types/policy.types';

@Injectable()
export class RuleEvaluatorService {
  private readonly logger = new Logger(RuleEvaluatorService.name);

  evaluate(rules: PolicyRule[], context: EvaluationContext): EvaluationResult {
    const appliedRules: string[] = [];
    let finalMode: ExecutionMode = ExecutionMode.ALLOW_AUTO;
    let allowed = true;
    let riskScore = 0;
    const reasons: string[] = [];

    for (const rule of rules) {
      if (rule.target && rule.target !== context.targetField) {
        continue; // Rule doesn't apply to this target
      }

      appliedRules.push(rule.id);
      const result = this.evaluateRule(rule, context);

      if (!result.allowed) {
        allowed = false;
        finalMode = this.escalateMode(finalMode, result.mode || ExecutionMode.BLOCK);
        reasons.push(`${rule.id}: ${result.reason}`);
      }

      riskScore = Math.max(riskScore, result.riskScore || 0);
    }

    return {
      mode: finalMode,
      allowed,
      riskScore,
      reason: reasons.join('; ') || 'Decision authorized by policy',
      appliedRules,
      metadata: {
        evaluatedAt: new Date().toISOString(),
        engineVersion: 'v1-deterministic',
        contextVersion: context.metadata?.version || 'LATEST'
      }
    };
  }

  private evaluateRule(rule: PolicyRule, context: EvaluationContext): Partial<EvaluationResult> {
    switch (rule.type) {
      case PolicyRuleType.NUMERIC_CAP:
        return this.evaluateNumericCap(rule, context);
      case PolicyRuleType.THRESHOLD:
        return this.evaluateThreshold(rule, context);
      case PolicyRuleType.EXECUTION_POLICY:
        return this.evaluateExecutionPolicy(rule, context);
      case PolicyRuleType.BUDGET_CONTROL:
        return this.evaluateBudgetControl(rule, context);
      case PolicyRuleType.AI_RISK_FILTER:
        return this.evaluateAiRiskFilter(rule, context);
      default:
        return { allowed: true, riskScore: 0 };
    }
  }

  private evaluateNumericCap(rule: PolicyRule, context: EvaluationContext): Partial<EvaluationResult> {
    const { max_percent } = rule.condition;
    if (max_percent === undefined) return { allowed: true };

    const currentVal = Number(context.currentValue || 0);
    const proposedVal = Number(context.proposedValue);
    
    if (currentVal === 0) return { allowed: true };

    const incrementPercent = ((proposedVal - currentVal) / currentVal) * 100;

    if (incrementPercent > max_percent) {
      return {
        allowed: false,
        mode: ExecutionMode.BLOCK,
        reason: `Increment (${incrementPercent.toFixed(2)}%) exceeds cap of ${max_percent}%`,
        riskScore: 80
      };
    }

    return { allowed: true, riskScore: 0 };
  }

  private evaluateThreshold(rule: PolicyRule, context: EvaluationContext): Partial<EvaluationResult> {
    const { gte, lte } = rule.condition;
    const value = Number(context.proposedValue);

    if (gte !== undefined && value < gte) {
      return {
        allowed: false,
        mode: ExecutionMode.REQUIRES_APPROVAL,
        reason: `Value ${value} is below required threshold of ${gte}`,
        riskScore: 40
      };
    }

    if (lte !== undefined && value > lte) {
      return {
        allowed: false,
        mode: ExecutionMode.REQUIRES_APPROVAL,
        reason: `Value ${value} is above threshold of ${lte}`,
        riskScore: 40
      };
    }

    return { allowed: true, riskScore: 0 };
  }

  private evaluateExecutionPolicy(rule: PolicyRule, context: EvaluationContext): Partial<EvaluationResult> {
    const { risk_level } = rule.condition;
    
    // Simple logic for now: High risk requires review
    if (risk_level === 'HIGH') {
      return {
        allowed: false,
        mode: ExecutionMode.REQUIRES_APPROVAL,
        reason: `High risk execution policy detected`,
        riskScore: 90
      };
    }

    return { allowed: true, riskScore: 0 };
  }

  private evaluateBudgetControl(rule: PolicyRule, context: EvaluationContext): Partial<EvaluationResult> {
    const { limit } = rule.condition;
    const proposedSpend = Number(context.proposedValue);

    if (limit !== undefined && proposedSpend > limit) {
      return {
        allowed: false,
        mode: rule.mode || ExecutionMode.BLOCK,
        reason: `Proposed spend (${proposedSpend}) exceeds cap of ${limit} ${rule.condition.currency || ''}`,
        riskScore: 100
      };
    }

    return { allowed: true, mode: ExecutionMode.ALLOW_WITH_LIMIT, riskScore: 10 };
  }

  private evaluateAiRiskFilter(rule: PolicyRule, context: EvaluationContext): Partial<EvaluationResult> {
    const { gte } = rule.condition;
    const brandScore = Number(context.proposedValue);

    if (gte !== undefined && brandScore < gte) {
      return {
        allowed: false,
        mode: ExecutionMode.REQUIRES_APPROVAL,
        reason: `Brand Safety Score (${brandScore}) falls below the required threshold of ${gte}`,
        riskScore: 70
      };
    }

    return { allowed: true, riskScore: 0 };
  }

  private escalateMode(current: ExecutionMode, target: ExecutionMode): ExecutionMode {
    const weight = { 
        [ExecutionMode.ALLOW_AUTO]: 1, 
        [ExecutionMode.ALLOW_WITH_LIMIT]: 2, 
        [ExecutionMode.REQUIRES_APPROVAL]: 3, 
        [ExecutionMode.BLOCK]: 4 
    };
    return weight[target] > weight[current] ? target : current;
  }
}
