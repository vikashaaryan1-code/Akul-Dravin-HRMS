import { Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../../common/context/tenant-context';
import { PolicyDefinitionEntity } from '../entities/policy.entity';
import { PolicyScope, PolicyRule } from '../types/policy.types';

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

    if (policies.length === 0) {
      return [];
    }

    // Merge logic: Deeper scope overrides global
    // Priority: ROLE (3) > DEPARTMENT (2) > TENANT (1)
    const ruleMap = new Map<string, PolicyRule>();

    // 1. Apply Tenant Rules
    const tenantPolicy = policies.find(p => p.scope === PolicyScope.TENANT);
    tenantPolicy?.rules.forEach(rule => ruleMap.set(rule.id, rule));

    // 2. Override with Department Rules
    const deptPolicy = policies.find(p => p.scope === PolicyScope.DEPARTMENT && p.scopeId === departmentId);
    deptPolicy?.rules.forEach(rule => ruleMap.set(rule.id, rule));

    // 3. Override with Role Rules
    const rolePolicy = policies.find(p => p.scope === PolicyScope.ROLE && p.scopeId === roleId);
    rolePolicy?.rules.forEach(rule => ruleMap.set(rule.id, rule));

    return Array.from(ruleMap.values());
  }
}
