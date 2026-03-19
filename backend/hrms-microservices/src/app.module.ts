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
import { DepartmentModule } from './modules/department/department.module';
import { DesignationModule } from './modules/designation/designation.module';
import { LeaveTypeModule } from './modules/leave-type/leave-type.module';
import { LeaveRequestModule } from './modules/leave-request/leave-request.module';
import { EmployeeDocumentModule } from './modules/employee-document/employee-document.module';
import { JobModule } from './modules/job/job.module';
import { JobApplicationModule } from './modules/job-application/job-application.module';
import { ApplicationModule } from './modules/application/application.module';
import { InterviewModule } from './modules/interview/interview.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { TaskModule } from './modules/task/task.module';
import { BranchModule } from './modules/branch/branch.module';
import { RoleModule } from './modules/role/role.module';
import { ReportModule } from './modules/report/report.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { ShiftModule } from './modules/shift/shift.module';
import { OvertimeModule } from './modules/overtime/overtime.module';
import { AssetModule } from './modules/asset/asset.module';
import { TrainingModule } from './modules/training/training.module';
import { RecruiterModule } from './modules/recruiter/recruiter.module';
import { OfferModule } from './modules/offer/offer.module';
import { SalaryStructureModule } from './modules/salary-structure/salary-structure.module';
import { PolicyModule } from './modules/policy/policy.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { HolidayModule } from './modules/holiday/holiday.module';
import { TimesheetModule } from './modules/timesheet/timesheet.module';
import { AppraisalModule } from './modules/appraisal/appraisal.module';
import { GoalModule } from './modules/goal/goal.module';
import { ProjectModule } from './modules/project/project.module';
import { ClientModule } from './modules/client/client.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { MeetingModule } from './modules/meeting/meeting.module';
import { TicketModule } from './modules/ticket/ticket.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ExitModule } from './modules/exit/exit.module';
import { CommissionModule } from './modules/commission/commission.module';
import { PlacementModule } from './modules/placement/placement.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { SkillModule } from './modules/skill/skill.module';
import { CertificateModule } from './modules/certificate/certificate.module';
import { BenefitModule } from './modules/benefit/benefit.module';
import { AiResumeParserModule } from './modules/ai-resume-parser/ai-resume-parser.module';
import { AiMatchingModule } from './modules/ai-matching/ai-matching.module';
import { PaymentModule } from './modules/payment/payment.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { ExportModule } from './modules/export/export.module';
import { DocumentGeneratorModule } from './modules/document-generator/document-generator.module';
import { WhiteLabelModule } from './modules/white-label/white-label.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { BackgroundVerificationModule } from './modules/background-verification/background-verification.module';
import { VideoInterviewModule } from './modules/video-interview/video-interview.module';
import { PingPlanModule } from './modules/ping-plan/ping-plan.module';
import { PerformanceRewardsModule } from './modules/performance-rewards/performance-rewards.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { FeaturePermissionsModule } from './modules/feature-permissions/feature-permissions.module';
import { AuthContextMiddleware } from './common/middleware/auth-context.middleware';
import { PerformanceMiddleware } from './common/middleware/performance.middleware';

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
        synchronize: true,
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
    DepartmentModule,
    DesignationModule,
    LeaveTypeModule,
    LeaveRequestModule,
    EmployeeDocumentModule,
    JobModule,
    JobApplicationModule,
    ApplicationModule,
    InterviewModule,
    SubscriptionModule,
    PerformanceModule,
    AuditLogModule,
    TaskModule,
    BranchModule,
    RoleModule,
    ReportModule,
    ExpenseModule,
    ShiftModule,
    OvertimeModule,
    AssetModule,
    TrainingModule,
    RecruiterModule,
    OfferModule,
    SalaryStructureModule,
    PolicyModule,
    AnnouncementModule,
    HolidayModule,
    TimesheetModule,
    AppraisalModule,
    GoalModule,
    ProjectModule,
    ClientModule,
    InvoiceModule,
    MeetingModule,
    TicketModule,
    FeedbackModule,
    OnboardingModule,
    ExitModule,
    CommissionModule,
    PlacementModule,
    CandidateModule,
    SkillModule,
    CertificateModule,
    BenefitModule,
    AiResumeParserModule,
    AiMatchingModule,
    PaymentModule,
    MfaModule,
    ExportModule,
    DocumentGeneratorModule,
    WhiteLabelModule,
    WhatsappModule,
    BackgroundVerificationModule,
    VideoInterviewModule,
    PingPlanModule,
    PerformanceRewardsModule,
    WebhookModule,
    FeaturePermissionsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PerformanceMiddleware).forRoutes('*');
    consumer.apply(AuthContextMiddleware).forRoutes('*');
  }
}





