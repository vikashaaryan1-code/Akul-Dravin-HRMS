import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiEngineController } from './ai-engine.controller';
import { ForensicAdvisoryController } from './forensic-advisory.controller';
import { AiEngineService } from './ai-engine.service';
import { ForensicAdvisoryService } from './forensic-advisory.service';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AiInsightEntity])],
  controllers: [AiEngineController, ForensicAdvisoryController],
  providers: [AiEngineService, ForensicAdvisoryService, RolesGuard],
  exports: [AiEngineService, ForensicAdvisoryService],
})
export class AiEngineModule {}
