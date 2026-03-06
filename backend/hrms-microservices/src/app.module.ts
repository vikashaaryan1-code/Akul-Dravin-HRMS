import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { UserModule } from './modules/user/user.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { RecruitmentAtsModule } from './modules/recruitment-ats/recruitment-ats.module';
import { RecruiterMarketplaceModule } from './modules/recruiter-marketplace/recruiter-marketplace.module';
import { CandidateProfilesModule } from './modules/candidate-profiles/candidate-profiles.module';
import { JobMarketplaceModule } from './modules/job-marketplace/job-marketplace.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { SubscriptionBillingModule } from './modules/subscription-billing/subscription-billing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DocumentCenterModule } from './modules/document-center/document-center.module';
import { EmployeeServicesModule } from './modules/employee-services/employee-services.module';
import { SalesAutomationModule } from './modules/sales-automation/sales-automation.module';
import { CrmModule } from './modules/crm/crm.module';
import { MarketingAutomationModule } from './modules/marketing-automation/marketing-automation.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HelpdeskModule } from './modules/helpdesk/helpdesk.module';
import { ProcurementVendorModule } from './modules/procurement-vendor/procurement-vendor.module';
import { PermissionControlModule } from './modules/permission-control/permission-control.module';
import { WorkTrackingModule } from './modules/work-tracking/work-tracking.module';
import { LocationTrackingModule } from './modules/location-tracking/location-tracking.module';
import { PerformanceManagementModule } from './modules/performance-management/performance-management.module';
import { TaskManagementModule } from './modules/task-management/task-management.module';
import { WorkflowAutomationModule } from './modules/workflow-automation/workflow-automation.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';
import { AuthContextMiddleware } from './common/middleware/auth-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change_this_for_production',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'akul_dravin_hrms'),
        autoLoadEntities: true,
        synchronize: false,
        logging: false,
      }),
    }),
    AuthModule,
    UserModule,
    CompanyModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    RecruitmentAtsModule,
    RecruiterMarketplaceModule,
    CandidateProfilesModule,
    JobMarketplaceModule,
    MarketplaceModule,
    SubscriptionBillingModule,
    AnalyticsModule,
    NotificationModule,
    DocumentCenterModule,
    EmployeeServicesModule,
    SalesAutomationModule,
    CrmModule,
    MarketingAutomationModule,
    FinanceModule,
    HelpdeskModule,
    ProcurementVendorModule,
    PermissionControlModule,
    WorkTrackingModule,
    LocationTrackingModule,
    PerformanceManagementModule,
    TaskManagementModule,
    WorkflowAutomationModule,
    AiEngineModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthContextMiddleware).forRoutes('*');
  }
}





