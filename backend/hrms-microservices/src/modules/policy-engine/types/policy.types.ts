export enum PolicyScope {
  TENANT = 'TENANT',
  DEPARTMENT = 'DEPARTMENT',
  ROLE = 'ROLE',
}

export enum PolicyRuleType {
  NUMERIC_CAP = 'NUMERIC_CAP',
  THRESHOLD = 'THRESHOLD',
  EXECUTION_POLICY = 'EXECUTION_POLICY',
  // Growth OS extensions
  BUDGET_CONTROL = 'BUDGET_CONTROL',
  AI_RISK_FILTER = 'AI_RISK_FILTER',
}

export enum ExecutionMode {
  ALLOW_AUTO = 'ALLOW_AUTO',
  ALLOW_WITH_LIMIT = 'ALLOW_WITH_LIMIT',
  REQUIRES_APPROVAL = 'REQUIRES_APPROVAL',
  BLOCK = 'BLOCK',
}

export interface PolicyRuleCondition {
  max_percent?: number;
  gte?: number;
  lte?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  budget_impact?: string;
  // Growth OS extensions
  limit?: number;
  currency?: string;
}

export interface PolicyRule {
  id: string;
  type: PolicyRuleType;
  target?: string;
  condition: PolicyRuleCondition;
  action?: string;
  mode?: ExecutionMode;
}

export interface PolicyDefinition {
  scope: PolicyScope;
  scopeId?: string;
  rules: PolicyRule[];
}

export interface EvaluationContext {
  tenantId: string;
  departmentId?: string;
  roleId?: string;
  domain?: 'WORKFORCE' | 'FINANCIAL' | 'MARTECH';
  targetField: string;
  proposedValue: any;
  currentValue?: any;
  isHighRisk?: boolean;
  metadata?: Record<string, any>;
}

export interface EvaluationResult {
  mode: ExecutionMode;
  allowed: boolean;
  riskScore: number;
  reason: string;
  appliedRules: string[];
}
