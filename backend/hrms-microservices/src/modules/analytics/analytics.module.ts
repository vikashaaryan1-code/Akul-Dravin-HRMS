import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { WorkforceAnalyticsService } from './workforce-analytics.service';
import { RecruitmentAnalyticsService } from './recruitment-analytics.service';
import { RevenueAnalyticsService } from './revenue-analytics.service';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';
import { PayrollBatchEntity } from '../../database/entities/payroll-batch.entity';
import { PayrollItemEntity } from '../../database/entities/payroll-item.entity';
import { RoiService } from './roi.service';
import { RolesGuard } from '../../common/guards/roles.guard';
// import { GovernanceOrchestrationModule } from '../../common/governance/governance-orchestration.module';
import { PerformanceManagementModule } from '../performance-management/performance-management.module';
import { AnalyticsCacheService } from './analytics-cache.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEventEntity,
      PayrollBatchEntity,
      PayrollItemEntity,
    ]),
    PerformanceManagementModule,
    // GovernanceOrchestrationModule,
  ],
  controllers: [AnalyticsController, DashboardController],
  providers: [
    AnalyticsService,
    RoiService,
    RolesGuard,
    WorkforceAnalyticsService,
    RecruitmentAnalyticsService,
    RevenueAnalyticsService,
    AnalyticsCacheService,
  ],
  exports: [
    AnalyticsService,
    RoiService,
    WorkforceAnalyticsService,
    RecruitmentAnalyticsService,
    RevenueAnalyticsService,
    AnalyticsCacheService,
  ],
})
export class AnalyticsModule {}
