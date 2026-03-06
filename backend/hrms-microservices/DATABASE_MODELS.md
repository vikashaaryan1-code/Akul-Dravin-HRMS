# Database Models

PostgreSQL models are implemented as TypeORM entities under `src/database/entities`.

| Entity Class | Table Name | Module |
|---|---|---|
| `UserEntity` | `users` | Authentication + User Service |
| `CompanyEntity` | `companies` | Company Management |
| `EmployeeEntity` | `employees` | Employee Management |
| `AttendanceEntity` | `attendance_records` | Attendance System |
| `LeaveTypeEntity` | `leave_types` | Leave Service |
| `LeaveRequestEntity` | `leave_requests` | Leave Service |
| `PayrollEntity` | `payroll_records` | Payroll Engine |
| `RecruitmentJobEntity` | `recruitment_jobs` | Recruitment ATS |
| `RecruitmentApplicationEntity` | `recruitment_applications` | Recruitment ATS |
| `RecruiterProfileEntity` | `recruiter_profiles` | Recruiter Marketplace |
| `CandidateProfileEntity` | `candidate_profiles` | Candidate Profiles |
| `MarketplaceJobEntity` | `marketplace_jobs` | Job Marketplace |
| `MarketplaceListingEntity` | `marketplace_listings` | Marketplace Service |
| `SubscriptionEntity` | `subscriptions` | Subscription & Billing |
| `InvoiceEntity` | `invoices` | Subscription & Billing |
| `AnalyticsEventEntity` | `analytics_events` | Analytics Service |
| `NotificationEntity` | `notifications` | Notification Service |
| `AiInsightEntity` | `ai_insights` | AI Engine Service |
