import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkTrackingController } from './work-tracking.controller';
import { WorkTrackingService } from './work-tracking.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WorkActivityEntity } from '../../database/entities/work-activity.entity';
import { WorkdaySummaryEntity } from '../../database/entities/workday-summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkActivityEntity, WorkdaySummaryEntity]),
  ],
  controllers: [WorkTrackingController],
  providers: [WorkTrackingService, RolesGuard],
  exports: [WorkTrackingService],
})
export class WorkTrackingModule {}
