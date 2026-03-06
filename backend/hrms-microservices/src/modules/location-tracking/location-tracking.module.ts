import { Module } from '@nestjs/common';
import { LocationTrackingController } from './location-tracking.controller';
import { LocationTrackingService } from './location-tracking.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [LocationTrackingController],
  providers: [LocationTrackingService, RolesGuard],
  exports: [LocationTrackingService],
})
export class LocationTrackingModule {}
