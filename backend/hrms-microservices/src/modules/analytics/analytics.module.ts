import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { RoiService } from './roi.service';
import { PerformanceManagementModule } from '../performance-management/performance-management.module';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsEventEntity, PayrollBatchEntity, PayrollItemEntity]),
    PerformanceManagementModule
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RoiService, RolesGuard],
  exports: [AnalyticsService, RoiService],
})
export class AnalyticsModule {}
