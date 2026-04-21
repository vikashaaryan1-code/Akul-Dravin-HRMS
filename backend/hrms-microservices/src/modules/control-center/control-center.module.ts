import { Module } from '@nestjs/common';
import { ControlCenterController } from './control-center.controller';
import { ControlCenterGateway } from './control-center.gateway';
import { PolicyEngineModule } from '../policy-engine/policy-engine.module';
import { CareerGrowthModule } from '../career-growth/career-growth.module';

@Module({
  imports: [
    PolicyEngineModule,
    CareerGrowthModule,
  ],
  controllers: [ControlCenterController],
  providers: [ControlCenterGateway],
})
export class ControlCenterModule {}
