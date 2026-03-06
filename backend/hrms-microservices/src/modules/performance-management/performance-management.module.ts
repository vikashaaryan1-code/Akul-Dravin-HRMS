import { Module } from '@nestjs/common';
import { PerformanceManagementController } from './performance-management.controller';
import { PerformanceManagementService } from './performance-management.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [PerformanceManagementController],
  providers: [PerformanceManagementService, RolesGuard],
  exports: [PerformanceManagementService],
})
export class PerformanceManagementModule {}
