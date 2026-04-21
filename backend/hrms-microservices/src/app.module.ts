import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { UserModule } from './modules/user/user.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RecruitmentAtsModule } from './modules/recruitment-ats/recruitment-ats.module';
import { RecruiterMarketplaceModule } from './modules/recruiter-marketplace/recruiter-marketplace.module';
import { CandidateProfilesModule } from './modules/candidate-profiles/candidate-profiles.module';
import { JobMarketplaceModule } from './modules/job-marketplace/job-marketplace.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { SubscriptionBillingModule } from './modules/subscription-billing/subscription-billing.module';
import { DocumentCenterModule } from './modules/document-center/document-center.module';
import { WorkflowAutomationModule } from './modules/workflow-automation/workflow-automation.module';
import { SalesAutomationModule } from './modules/sales-automation/sales-automation.module';
import { CrmModule } from './modules/crm/crm.module';
import { MarketingAutomationModule } from './modules/marketing-automation/marketing-automation.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { HelpdeskModule } from './modules/helpdesk/helpdesk.module';
import { ProcurementVendorModule } from './modules/procurement-vendor/procurement-vendor.module';
import { PermissionControlModule } from './modules/permission-control/permission-control.module';
import { WorkTrackingModule } from './modules/work-tracking/work-tracking.module';
import { LocationTrackingModule } from './modules/location-tracking/location-tracking.module';
import { PerformanceManagementModule } from './modules/performance-management/performance-management.module';
import { TaskManagementModule } from './modules/task-management/task-management.module';
import { EmployeeServicesModule } from './modules/employee-services/employee-services.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';
import { PublicSiteModule } from './modules/public-site/public-site.module';
import { SmartPlatformModule } from './modules/smart-platform/smart-platform.module';
import { PolicyEngineModule } from './modules/policy-engine/policy-engine.module';
import { CareerGrowthModule } from './modules/career-growth/career-growth.module';
import { CommunicationTelephonyModule } from './modules/communication-telephony/communication-telephony.module';
import { AuthContextMiddleware } from './common/middleware/auth-context.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { TenantContext } from './common/context/tenant-context';
import { SettingsService } from './common/settings/settings.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'akul_dravin_hrms',
      autoLoadEntities: true,
      synchronize: false, // Schema is managed via migration_user / db:harden
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change_this_for_production',
    }),
    AuthModule,
    CompanyModule,
    UserModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    AnalyticsModule,
    NotificationModule,
    RecruitmentAtsModule,
    RecruiterMarketplaceModule,
    CandidateProfilesModule,
    JobMarketplaceModule,
    MarketplaceModule,
    SubscriptionBillingModule,
    DocumentCenterModule,
    WorkflowAutomationModule,
    SalesAutomationModule,
    CrmModule,
    MarketingAutomationModule,
    FinanceModule,
    ReportingModule,
    HelpdeskModule,
    ProcurementVendorModule,
    PermissionControlModule,
    WorkTrackingModule,
    LocationTrackingModule,
    PerformanceManagementModule,
    TaskManagementModule,
    EmployeeServicesModule,
    AiEngineModule,
    PublicSiteModule,
    SmartPlatformModule,
    PolicyEngineModule,
    CareerGrowthModule,
    CommunicationTelephonyModule,
    ControlCenterModule,
    RedisModule,
  ],
  providers: [
    SettingsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly dataSource: DataSource) {
    TenantContext.setDataSource(this.dataSource);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthContextMiddleware, TenantMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
