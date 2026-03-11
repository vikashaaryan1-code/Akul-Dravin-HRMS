import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacementController } from './placement.controller';
import { PlacementService } from './placement.service';
import { Placement } from './placement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Placement])],
  controllers: [PlacementController],
  providers: [PlacementService],
  exports: [PlacementService],
})
export class PlacementModule {}
