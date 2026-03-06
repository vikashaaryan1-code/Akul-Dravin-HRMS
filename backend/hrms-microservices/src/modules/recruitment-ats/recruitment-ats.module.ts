import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruitmentAtsController } from './recruitment-ats.controller';
import { RecruitmentAtsService } from './recruitment-ats.service';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([RecruitmentJobEntity, RecruitmentApplicationEntity])],
  controllers: [RecruitmentAtsController],
  providers: [RecruitmentAtsService, RolesGuard],
  exports: [RecruitmentAtsService],
})
export class RecruitmentAtsModule {}
