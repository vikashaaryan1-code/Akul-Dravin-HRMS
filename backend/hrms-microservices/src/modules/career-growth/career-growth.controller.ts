import { Controller, Get, Query } from '@nestjs/common';
import { TenantContext } from '../../common/context/tenant-context';
import { CareerGrowthEntity } from '../../database/entities/career-growth.entity';

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
    const tenantId = TenantContext.getRequiredTenantId();
    const repo = TenantContext.getRepository(CareerGrowthEntity);

    // Optimized: Consolidate 3 counts into a single query using conditional aggregation
    // This reduces DB round-trips from 3 to 1.
    const stats = await repo
      .createQueryBuilder('event')
      .where('event.tenantId = :tenantId', { tenantId })
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN event.status = 'executed' THEN 1 ELSE 0 END)", 'executed')
      .addSelect("SUM(CASE WHEN event.status = 'gated' THEN 1 ELSE 0 END)", 'gated')
      .getRawOne();

    const total = parseInt(stats.total, 10) || 0;
    const executed = parseInt(stats.executed, 10) || 0;
    const gated = parseInt(stats.gated, 10) || 0;

    return {
      totalEvents: total,
      executedPromotions: executed,
      gatedDecisions: gated,
      autonomyRate: total > 0 ? ((executed / total) * 100).toFixed(1) + '%' : '0%',
    };
  }
}
