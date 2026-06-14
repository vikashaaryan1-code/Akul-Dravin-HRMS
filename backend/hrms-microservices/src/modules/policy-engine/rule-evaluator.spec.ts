import BigNumber from 'bignumber.js';
import { PolicyRuleType, ExecutionMode, PolicyRule } from '../policy-engine/types/policy.types';

/**
 * Rule Evaluator Logic Tests
 * Mirrors the RuleEvaluatorService evaluation logic without the NestJS container.
 */

// ── Mirror of RuleEvaluatorService.evaluate logic ────────────────────────

type EvaluationContext = {
  tenantId: string;
  departmentId?: string;
  roleId?: string;
  targetField: string;
  proposedValue: number | string;
  riskScore?: number;
};

type EvaluationDecision = 'ALLOW_AUTO' | 'REQUIRES_APPROVAL' | 'BLOCK';

function evaluateRule(rule: PolicyRule, ctx: EvaluationContext): EvaluationDecision {
  switch (rule.type) {
    case PolicyRuleType.THRESHOLD: {
      const val = Number(ctx.proposedValue);
      const threshold = rule.condition['gte'] as number | undefined;
      if (threshold !== undefined && val < threshold) {
        return rule.mode as EvaluationDecision;
      }
      return 'ALLOW_AUTO';
    }
    case PolicyRuleType.NUMERIC_CAP: {
      const val = Number(ctx.proposedValue);
      const cap = rule.condition['max_percent'] as number | undefined;
      if (cap !== undefined && val > cap) {
        return 'BLOCK';
      }
      return 'ALLOW_AUTO';
    }
    case PolicyRuleType.BUDGET_CONTROL: {
      const val = Number(ctx.proposedValue);
      const limit = rule.condition['limit'] as number | undefined;
      if (limit !== undefined && val > limit) {
        return rule.mode as EvaluationDecision;
      }
      return 'ALLOW_AUTO';
    }
    default:
      return 'ALLOW_AUTO';
  }
}

function evaluateAll(rules: PolicyRule[], ctx: EvaluationContext): EvaluationDecision {
  if (rules.length === 0) return 'ALLOW_AUTO';
  let result: EvaluationDecision = 'ALLOW_AUTO';
  for (const rule of rules) {
    const decision = evaluateRule(rule, ctx);
    // Priority: BLOCK > REQUIRES_APPROVAL > ALLOW_AUTO
    if (decision === 'BLOCK') return 'BLOCK';
    if (decision === 'REQUIRES_APPROVAL') result = 'REQUIRES_APPROVAL';
  }
  return result;
}

// ── Tests ──────────────────────────────────────────────────────────────────

const THRESHOLD_RULE: PolicyRule = {
  id: 'TEST-THRESHOLD',
  type: PolicyRuleType.THRESHOLD,
  target: 'performance.score',
  condition: { gte: 70 },
  mode: ExecutionMode.REQUIRES_APPROVAL,
};

const NUMERIC_CAP_RULE: PolicyRule = {
  id: 'TEST-CAP',
  type: PolicyRuleType.NUMERIC_CAP,
  target: 'salary.increment',
  condition: { max_percent: 40 },
  mode: ExecutionMode.BLOCK,
};

const BUDGET_RULE: PolicyRule = {
  id: 'TEST-BUDGET',
  type: PolicyRuleType.BUDGET_CONTROL,
  target: 'budget.spend',
  condition: { limit: 5000000 },
  mode: ExecutionMode.REQUIRES_APPROVAL,
};

const BASE_CTX: EvaluationContext = {
  tenantId: 'tenant-test-001',
  targetField: 'performance.score',
  proposedValue: 80,
};

describe('RuleEvaluator — THRESHOLD rule', () => {
  it('score above threshold → ALLOW_AUTO', () => {
    expect(evaluateRule(THRESHOLD_RULE, { ...BASE_CTX, proposedValue: 80 })).toBe('ALLOW_AUTO');
  });

  it('score exactly at threshold → ALLOW_AUTO (gte = inclusive)', () => {
    expect(evaluateRule(THRESHOLD_RULE, { ...BASE_CTX, proposedValue: 70 })).toBe('ALLOW_AUTO');
  });

  it('score below threshold → REQUIRES_APPROVAL', () => {
    expect(evaluateRule(THRESHOLD_RULE, { ...BASE_CTX, proposedValue: 65 })).toBe('REQUIRES_APPROVAL');
  });

  it('score = 0 → REQUIRES_APPROVAL', () => {
    expect(evaluateRule(THRESHOLD_RULE, { ...BASE_CTX, proposedValue: 0 })).toBe('REQUIRES_APPROVAL');
  });
});

describe('RuleEvaluator — NUMERIC_CAP rule', () => {
  it('increment within cap → ALLOW_AUTO', () => {
    expect(evaluateRule(NUMERIC_CAP_RULE, { ...BASE_CTX, targetField: 'salary.increment', proposedValue: 30 })).toBe('ALLOW_AUTO');
  });

  it('increment exactly at cap → ALLOW_AUTO', () => {
    expect(evaluateRule(NUMERIC_CAP_RULE, { ...BASE_CTX, targetField: 'salary.increment', proposedValue: 40 })).toBe('ALLOW_AUTO');
  });

  it('increment above cap → BLOCK', () => {
    expect(evaluateRule(NUMERIC_CAP_RULE, { ...BASE_CTX, targetField: 'salary.increment', proposedValue: 45 })).toBe('BLOCK');
  });

  it('extreme overage → BLOCK', () => {
    expect(evaluateRule(NUMERIC_CAP_RULE, { ...BASE_CTX, targetField: 'salary.increment', proposedValue: 200 })).toBe('BLOCK');
  });
});

describe('RuleEvaluator — BUDGET_CONTROL rule', () => {
  it('spend within limit → ALLOW_AUTO', () => {
    expect(evaluateRule(BUDGET_RULE, { ...BASE_CTX, targetField: 'budget.spend', proposedValue: 3000000 })).toBe('ALLOW_AUTO');
  });

  it('spend exceeds limit → REQUIRES_APPROVAL', () => {
    expect(evaluateRule(BUDGET_RULE, { ...BASE_CTX, targetField: 'budget.spend', proposedValue: 6000000 })).toBe('REQUIRES_APPROVAL');
  });
});

describe('RuleEvaluator — multi-rule escalation (BLOCK dominates)', () => {
  const rules = [THRESHOLD_RULE, NUMERIC_CAP_RULE, BUDGET_RULE];

  it('empty rules → ALLOW_AUTO', () => {
    expect(evaluateAll([], BASE_CTX)).toBe('ALLOW_AUTO');
  });

  it('BLOCK from any rule → overall BLOCK regardless of others', () => {
    // Cap exceeded → BLOCK; threshold ok; budget ok
    const ctx: EvaluationContext = { ...BASE_CTX, targetField: 'salary.increment', proposedValue: 50 };
    expect(evaluateAll(rules, ctx)).toBe('BLOCK');
  });

  it('REQUIRES_APPROVAL only → overall REQUIRES_APPROVAL', () => {
    // Score below threshold (REQUIRES_APPROVAL), no cap breach, no budget breach
    const ctx: EvaluationContext = { ...BASE_CTX, proposedValue: 60 };
    const thresholdAndBudget = [THRESHOLD_RULE, BUDGET_RULE];
    expect(evaluateAll(thresholdAndBudget, ctx)).toBe('REQUIRES_APPROVAL');
  });

  it('all rules pass → ALLOW_AUTO', () => {
    const ctx: EvaluationContext = {
      tenantId: 'tenant-test-001',
      targetField: 'performance.score',
      proposedValue: 85,
    };
    // Only threshold rule applies; 85 >= 70 → passes
    expect(evaluateAll([THRESHOLD_RULE], ctx)).toBe('ALLOW_AUTO');
  });
});
