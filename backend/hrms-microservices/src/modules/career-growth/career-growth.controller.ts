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
    const repo = TenantContext.getRepository(CareerGrowthEntity);
    const total = await repo.count();
    const executed = await repo.count({ where: { status: 'executed' as any } });
    const gated = await repo.count({ where: { status: 'gated' as any } });

    return {
      totalEvents: total,
      executedPromotions: executed,
      gatedDecisions: gated,
      autonomyRate: total > 0 ? ((executed / total) * 100).toFixed(1) + '%' : '0%',
    };
  }
}
