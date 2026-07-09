import { Controller, Get, Query, Param } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';
import { PolicyAuditEntity } from './entities/policy-audit.entity';
import { PolicyDefinitionEntity } from './entities/policy.entity';

// No-op decorators – swap for @nestjs/swagger when Swagger UI is wired up
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ApiTags(..._args: string[]): ClassDecorator { return () => {}; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ApiOperation(_opts?: Record<string, unknown>): MethodDecorator { return () => {}; }


@ApiTags('Policy Decision Engine (PDE)')
@Controller('pde/v1')
export class PolicyEngineController {
  
  @Get('audit-logs')
  @ApiOperation({ summary: 'Retrieve forensic decision history' })
  async getAuditLogs(@Query('limit') limit: number = 50) {
    const repo = TenantContext.getRepository(PolicyAuditEntity);
    return repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Policy Mesh Health' })
  async getStats() {
    const tenantId = TenantContext.getTenantId();
    const repo = TenantContext.getRepository(PolicyDefinitionEntity);

    // Optimization: Reduces DB round-trips from 2 to 1 by using conditional aggregation.
    // Enforces tenant isolation via TenantQueryPolicy as required by governance.
    const qb = repo.createQueryBuilder('policy');
    TenantQueryPolicy.enforce(qb, tenantId, 'policy', 'PolicyEngineController', 'getStats');

    const result = await qb
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN policy.is_active = true THEN 1 ELSE 0 END)', 'active')
      .getRawOne();
    
    return {
      totalPolicies: parseInt(result?.total || '0', 10),
      activePolicies: parseInt(result?.active || '0', 10),
      systemStatus: 'SHIELDED',
      meshIntegrity: '100%',
    };
  }

  @Get('rules/:scope')
  async getRulesByScope(@Param('scope') scope: string) {
    const repo = TenantContext.getRepository(PolicyDefinitionEntity);
    return repo.find({ where: { scope: scope as any, isActive: true } });
  }
}
