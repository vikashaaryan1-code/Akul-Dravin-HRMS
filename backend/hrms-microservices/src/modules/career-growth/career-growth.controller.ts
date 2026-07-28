import { Controller, Get, Query } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
import { CareerGrowthEntity } from '../../database/entities/career-growth.entity';
import { TenantQueryPolicy } from '../../common/governance/tenant/tenant-query-policy';

// No-op decorators – swap for @nestjs/swagger when Swagger UI is wired up
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ApiTags(..._args: string[]): ClassDecorator { return () => {}; }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ApiOperation(_opts?: Record<string, unknown>): MethodDecorator { return () => {}; }


@ApiTags('Career & Growth Performance')
@Controller('career-growth/v1')
export class CareerGrowthController {
  
  @Get('pipeline')
  @ApiOperation({ summary: 'Autonomous Workforce Evolution Pipeline' })
  async getPipeline(@Query('limit') limit: number = 30) {
    const repo = TenantContext.getRepository(CareerGrowthEntity);
    return repo.find({
      relations: ['employee'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  @Get('stats')
  async getStats() {
    const repo = TenantContext.getRepository(CareerGrowthEntity);
    const tenantId = TenantContext.getRequiredTenantId();

    // Consolidate three count queries into one single query with conditional aggregation
    // and enforce multi-tenant isolation via TenantQueryPolicy.
    const qb = repo.createQueryBuilder('cg');
    TenantQueryPolicy.enforce(qb, tenantId, 'cg', 'CareerGrowthController', 'getStats');

    const result = await qb
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN cg.status = 'executed' THEN 1 ELSE 0 END)", 'executed')
      .addSelect("SUM(CASE WHEN cg.status = 'gated' THEN 1 ELSE 0 END)", 'gated')
      .getRawOne();

    const total = parseInt(result?.total ?? '0', 10);
    const executed = parseInt(result?.executed ?? '0', 10);
    const gated = parseInt(result?.gated ?? '0', 10);

    return {
      totalEvents: total,
      executedPromotions: executed,
      gatedDecisions: gated,
      autonomyRate: total > 0 ? ((executed / total) * 100).toFixed(1) + '%' : '0%',
    };
  }
}
