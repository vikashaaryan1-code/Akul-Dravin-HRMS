import { Global, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { ControlCenterModule } from '../../modules/control-center/control-center.module';

/**
 * MetricsModule — global module that exposes the Prometheus scrape endpoint.
 *
 * @Global() so the metrics registry constants (imported directly from
 * metrics.registry.ts) are available everywhere without re-importing the module.
 *
 * Imports ControlCenterModule to access QueueDepthService for gauge sync.
 */
@Global()
@Module({
  imports: [ControlCenterModule],
  controllers: [MetricsController],
})
export class MetricsModule {}
