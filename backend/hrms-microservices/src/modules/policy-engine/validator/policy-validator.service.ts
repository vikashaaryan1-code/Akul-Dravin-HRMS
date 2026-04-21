import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PolicyResolverService } from '../resolver/policy-resolver.service';
import { CreatePolicyDto } from '../dto/policy.dto';
import { PolicyScope, PolicyRuleType } from '../types/policy.types';

@Injectable()
export class PolicyValidatorService {
  private readonly logger = new Logger(PolicyValidatorService.name);

  constructor(private readonly resolver: PolicyResolverService) {}

  async validateNewPolicy(tenantId: string, dto: CreatePolicyDto): Promise<void> {
    // 1. Validate DSL Schema/Structure
    this.validateSchema(dto);

    if (dto.scope === PolicyScope.TENANT) {
      return; // Global policies are the baseline
    }

    // Fetch Global Policy to ensure department/role doesn't violate it
    const globalRules = await this.resolver.resolveEffectivePolicy(tenantId);
    
    for (const newRule of dto.rules) {
      const globalRule = globalRules.find(r => r.id === newRule.id);
      if (!globalRule) continue;

      if (newRule.type === PolicyRuleType.NUMERIC_CAP && globalRule.type === PolicyRuleType.NUMERIC_CAP) {
        if (newRule.condition.max_percent! > globalRule.condition.max_percent!) {
          throw new BadRequestException(
            `Rule ${newRule.id}: Department cap (${newRule.condition.max_percent}%) ` +
            `cannot be looser than Global cap (${globalRule.condition.max_percent}%)`
          );
        }
      }
    }
  }

  private validateSchema(dto: CreatePolicyDto) {
    for (const rule of dto.rules) {
      if (!rule.id || !rule.type) {
        throw new BadRequestException(`Rule missing mandatory id or type`);
      }

      if (rule.type === PolicyRuleType.NUMERIC_CAP && !rule.target) {
        throw new BadRequestException(`Rule ${rule.id}: NUMERIC_CAP requires a 'target' field (e.g., salary.increment)`);
      }

      if (Object.keys(rule.condition).length === 0) {
        throw new BadRequestException(`Rule ${rule.id}: Condition cannot be empty`);
      }
    }
  }
}
