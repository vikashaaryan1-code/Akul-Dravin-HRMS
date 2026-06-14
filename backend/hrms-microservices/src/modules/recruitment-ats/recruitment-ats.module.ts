import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitmentAtsController } from './recruitment-ats.controller';
import { RecruitmentAtsService } from './recruitment-ats.service';
import { RecruitmentMarketplaceService } from '../recruitment/recruitment-marketplace.service';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { AtsPipelineService } from './ats-pipeline.service';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CandidateProfileEntity } from '../../database/entities/candidate-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecruitmentJobEntity, RecruitmentApplicationEntity, CandidateProfileEntity]),
    AiEngineModule,
  ],
  controllers: [RecruitmentAtsController],
  providers:   [RecruitmentAtsService, RecruitmentMarketplaceService, AtsPipelineService, RolesGuard],
  exports:     [RecruitmentAtsService, RecruitmentMarketplaceService, AtsPipelineService],
})
export class RecruitmentAtsModule {}

