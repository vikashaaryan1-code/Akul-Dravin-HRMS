import { Module } from '@nestjs/common';
import { OkrService } from './okr.service';
import { AppraisalService } from './appraisal.service';
import { PerformanceController } from './performance.controller';

@Module({
  controllers: [PerformanceController],
  providers: [OkrService, AppraisalService],
  exports: [OkrService, AppraisalService],
})
export class PerformanceModule {}
