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
import { AdminModule } from './modules/admin/admin.module';
import { AuthContextMiddleware } from './common/middleware/auth-context.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { TenantContext } from './common/context/tenant-context';
import { SettingsService } from './common/settings/settings.service';
import { ControlCenterModule } from './modules/control-center/control-center.module';
import { A2zEngineModule } from './modules/a2z-engine/a2z-engine.module';
import { HealthModule } from './modules/health/health.module';
import { LmsModule } from './modules/lms/lms.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { LoggerModule } from './common/logger/logger.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from './common/redis/redis.module';
import { AppRedisModule } from './redis/redis.module';
import { LocksModule } from './common/locks/locks.module';
import { AuditModule } from './common/audit/audit.module';
import { AuditLogModule } from './common/audit/audit-log.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';
import { AuthHardeningModule } from './auth/auth-hardening.module';
import { SearchModule } from './modules/search/search.module';
import { ActivityFeedModule } from './modules/activity/activity-feed.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { CorrelationMiddleware } from './common/middleware/correlation.middleware';
import { GovernanceModule } from './modules/governance/governance.module';
import { QueueInfrastructureModule } from './common/queues/queue-infrastructure.module';
import { DataOpsModule } from './modules/data-ops/data-ops.module';
import { AutonomousAuditInterceptor } from './common/interceptors/autonomous-audit.interceptor';
import { UniversalCachingInterceptor } from './common/interceptors/caching.interceptor';

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
      // Hard-fail in production if JWT_SECRET is not set.
      // A missing secret would sign tokens with a known default — a critical vulnerability.
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error('[BOOT] JWT_SECRET environment variable is not set. Refusing to start in production.');
        }
        return secret ?? 'dev-only-secret-change-in-production';
      })(),
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
    A2zEngineModule,
    HealthModule,
    LmsModule,
    GamificationModule,
    PerformanceModule,
    LoggerModule,
    ThrottlerModule.forRoot([
      {
        // Default tier — general API traffic (status polling, reads, etc.)
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
      {
        // Auth tier — login, token refresh, 2FA verify. Prevents credential stuffing.
        // Complements LoginGuardService brute-force protection at the business layer.
        name: 'auth',
        ttl: 60_000,
        limit: 5,
      },
      {
        // Payroll tier — applied explicitly on financial mutation endpoints.
        name: 'payroll',
        ttl: 60_000,
        limit: 10,
      },
      {
        // Webhook tier — Stripe events (Stripe retries up to 3× over 48h)
        // Real protection is Stripe signature verification; this is defence-in-depth.
        name: 'webhook',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        // Prevent command queuing when Redis is down — stops log flooding + memory pressure.
        // BullMQ requires maxRetriesPerRequest: null (not 0 or 3) for worker connections.
        enableOfflineQueue: false,
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => Math.min(times * 500, 10_000),
      },
    }),
    RedisModule,
    AppRedisModule,
    LocksModule,
    AuditModule,
    AuditLogModule,
    SuperAdminModule,
    WhiteLabelModule,
    AuthHardeningModule,
    SearchModule,
    ActivityFeedModule,
    ObservabilityModule,
    GovernanceModule,
    QueueInfrastructureModule,
    DataOpsModule,
    AdminModule,
  ],
  providers: [
    SettingsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UniversalCachingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AutonomousAuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly dataSource: DataSource) {
    TenantContext.setDataSource(this.dataSource);
  }

  configure(consumer: MiddlewareConsumer) {
    // Correlation ID runs FIRST — injects X-Correlation-ID for all downstream logging
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });

    // Request logger runs second
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });

    consumer
      .apply(AuthContextMiddleware, TenantMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
