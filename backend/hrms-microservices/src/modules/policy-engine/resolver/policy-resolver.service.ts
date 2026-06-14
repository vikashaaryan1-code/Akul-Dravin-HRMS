import { Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../../common/context/tenant-context';
import { PolicyDefinitionEntity } from '../entities/policy.entity';
import { PolicyScope, PolicyRule, PolicyRuleType, ExecutionMode } from '../types/policy.types';

/**
 * System default policies applied when no tenant-configured policies exist in the DB.
 * These are safe, deterministic defaults that ensure the PDE is never a no-op.
 * Tenant admins override these by creating PolicyDefinitionEntity records.
 */
const SYSTEM_DEFAULT_RULES: PolicyRule[] = [
  {
    id: 'SYS-THRESHOLD-SCORE',
    type: PolicyRuleType.THRESHOLD,
    target: 'performance.score',
    condition: { gte: 70 },          // scores below 70 trigger REQUIRES_APPROVAL
    mode: ExecutionMode.REQUIRES_APPROVAL,
  },
  {
    id: 'SYS-NUMERIC-CAP-SALARY',
    type: PolicyRuleType.NUMERIC_CAP,
    target: 'salary.increment',
    condition: { max_percent: 40 },  // block salary increments > 40%
    mode: ExecutionMode.BLOCK,
  },
  {
    id: 'SYS-BUDGET-CONTROL',
    type: PolicyRuleType.BUDGET_CONTROL,
    target: 'budget.spend',
    condition: { limit: 5000000 },   // INR 50L spend cap before escalation
    mode: ExecutionMode.REQUIRES_APPROVAL,
  },
];

@Injectable()
export class PolicyResolverService {
  private readonly logger = new Logger(PolicyResolverService.name);

  private get policyRepo() {
    return TenantContext.getRepository(PolicyDefinitionEntity);
  }

  async resolveEffectivePolicy(
    tenantId: string,
    departmentId?: string,
    roleId?: string,
  ): Promise<PolicyRule[]> {
    this.logger.log(`Resolving policy for Tenant: ${tenantId}, Dept: ${departmentId}, Role: ${roleId}`);

    // Fetch all applicable policies in one go
    const policies = await this.policyRepo.find({
      where: [
        { tenantId, scope: PolicyScope.TENANT, isActive: true },
        { tenantId, scope: PolicyScope.DEPARTMENT, scopeId: departmentId, isActive: true },
        { tenantId, scope: PolicyScope.ROLE, scopeId: roleId, isActive: true },
      ],
      order: { version: 'DESC' },
    });

    // If no tenant policies exist, return safe system defaults.
    // This keeps the PDE deterministic on fresh tenants instead of silently
    // routing all decisions to REQUIRES_APPROVAL.
    if (policies.length === 0) {
      this.logger.warn(
        `No configured policies found for tenant=${tenantId}. Applying SYSTEM_DEFAULT_RULES.`
      );
      return [...SYSTEM_DEFAULT_RULES];
    }

    // Merge logic: Deeper scope overrides global
    // Priority: ROLE (3) > DEPARTMENT (2) > TENANT (1)
    const ruleMap = new Map<string, PolicyRule>();

    // 1. Apply Tenant Rules (broadest — lowest priority)
    const tenantPolicy = policies.find(p => p.scope === PolicyScope.TENANT);
    tenantPolicy?.rules.forEach(rule => ruleMap.set(rule.id, rule));

    // 2. Override with Department Rules
    const deptPolicy = policies.find(p => p.scope === PolicyScope.DEPARTMENT && p.scopeId === departmentId);
    deptPolicy?.rules.forEach(rule => ruleMap.set(rule.id, rule));

    // 3. Override with Role Rules (narrowest — highest priority)
    const rolePolicy = policies.find(p => p.scope === PolicyScope.ROLE && p.scopeId === roleId);
    rolePolicy?.rules.forEach(rule => ruleMap.set(rule.id, rule));

    const resolved = Array.from(ruleMap.values());
    this.logger.log(`Resolved ${resolved.length} effective rule(s) for tenant=${tenantId}`);
    return resolved;
  }
}

