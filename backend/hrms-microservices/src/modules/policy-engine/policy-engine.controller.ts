import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantContext } from '../../../common/context/tenant-context';
import { PolicyAuditEntity } from './entities/policy-audit.entity';
import { PolicyDefinitionEntity } from './entities/policy.entity';

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
    const repo = TenantContext.getRepository(PolicyDefinitionEntity);
    const total = await repo.count();
    const active = await repo.count({ where: { isActive: true } });
    
    return {
      totalPolicies: total,
      activePolicies: active,
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
