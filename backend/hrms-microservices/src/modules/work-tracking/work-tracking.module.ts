import { Module } from '@nestjs/common';
import { WorkTrackingController } from './work-tracking.controller';
import { WorkTrackingService } from './work-tracking.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [WorkTrackingController],
  providers: [WorkTrackingService, RolesGuard],
  exports: [WorkTrackingService],
})
export class WorkTrackingModule {}
