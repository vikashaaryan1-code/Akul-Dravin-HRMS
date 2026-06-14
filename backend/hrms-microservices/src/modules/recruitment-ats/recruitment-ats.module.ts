import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { RecruitmentAtsController } from './recruitment-ats.controller';
import { RecruitmentAtsService } from './recruitment-ats.service';
import { RecruitmentMarketplaceService } from '../recruitment/recruitment-marketplace.service';
import { AiEngineModule } from '../ai-engine/ai-engine.module';
import { AtsPipelineService } from './ats-pipeline.service';
import { ResumeParsingService } from './resume-parsing.service';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CandidateProfileEntity } from '../../database/entities/candidate-profile.entity';
import { QUEUE_AI_JOBS } from '../../common/queues/queue-names';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecruitmentJobEntity, RecruitmentApplicationEntity, CandidateProfileEntity]),
    BullModule.registerQueue({ name: QUEUE_AI_JOBS }),
    AiEngineModule,
  ],
  controllers: [RecruitmentAtsController],
  providers:   [RecruitmentAtsService, RecruitmentMarketplaceService, AtsPipelineService, ResumeParsingService, RolesGuard],
  exports:     [RecruitmentAtsService, RecruitmentMarketplaceService, AtsPipelineService, ResumeParsingService],
})
export class RecruitmentAtsModule {}
