import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturePermissionsController } from './feature-permissions.controller';
import { FeaturePermissionsService } from './feature-permissions.service';
import { FeaturePermission } from './feature-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeaturePermission])],
  controllers: [FeaturePermissionsController],
  providers: [FeaturePermissionsService],
  exports: [FeaturePermissionsService],
})
export class FeaturePermissionsModule {}
