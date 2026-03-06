import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiEngineController } from './ai-engine.controller';
import { AiEngineService } from './ai-engine.service';
import { AiInsightEntity } from '../../database/entities/ai-insight.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AiInsightEntity])],
  controllers: [AiEngineController],
  providers: [AiEngineService, RolesGuard],
  exports: [AiEngineService],
})
export class AiEngineModule {}
