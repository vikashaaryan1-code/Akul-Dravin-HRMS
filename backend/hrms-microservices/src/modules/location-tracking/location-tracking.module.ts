import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationTrackingController } from './location-tracking.controller';
import { LocationTrackingService } from './location-tracking.service';
import { FieldTrackingService } from './field-tracking.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LocationPingEntity } from '../../database/entities/location-ping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LocationPingEntity])],
  controllers: [LocationTrackingController],
  providers: [LocationTrackingService, FieldTrackingService, RolesGuard],
  exports: [LocationTrackingService, FieldTrackingService],
})
export class LocationTrackingModule {}
