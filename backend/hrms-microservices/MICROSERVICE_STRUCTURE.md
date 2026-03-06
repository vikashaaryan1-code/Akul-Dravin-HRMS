# Microservice Structure

| Service | Route Prefix | Controller Folder | TCP Port Env |
|---|---|---|---|
| Authentication Service | `/api/v1/auth` | `src/auth` | `AUTH_SERVICE_PORT` |
| User Service | `/api/v1/users` | `src/modules/user` | `USER_SERVICE_PORT` |
| Company Management | `/api/v1/companies` | `src/modules/company` | `COMPANY_SERVICE_PORT` |
| Employee Management | `/api/v1/employees` | `src/modules/employee` | `EMPLOYEE_SERVICE_PORT` |
| Attendance System | `/api/v1/attendance` | `src/modules/attendance` | `ATTENDANCE_SERVICE_PORT` |
| Leave Service | `/api/v1/leave` | `src/modules/leave` | `LEAVE_SERVICE_PORT` |
| Payroll Engine | `/api/v1/payroll` | `src/modules/payroll` | `PAYROLL_SERVICE_PORT` |
| Recruitment ATS | `/api/v1/recruitment` | `src/modules/recruitment-ats` | `RECRUITMENT_ATS_SERVICE_PORT` |
| Recruiter Marketplace | `/api/v1/recruiter-marketplace` | `src/modules/recruiter-marketplace` | `RECRUITER_MARKETPLACE_SERVICE_PORT` |
| Candidate Profiles | `/api/v1/candidates` | `src/modules/candidate-profiles` | `CANDIDATE_SERVICE_PORT` |
| Job Marketplace | `/api/v1/job-marketplace` | `src/modules/job-marketplace` | `JOB_MARKETPLACE_SERVICE_PORT` |
| Marketplace Service | `/api/v1/marketplace` | `src/modules/marketplace` | `MARKETPLACE_SERVICE_PORT` |
| Subscription & Billing | `/api/v1/billing` | `src/modules/subscription-billing` | `SUBSCRIPTION_BILLING_SERVICE_PORT` |
| Analytics Service | `/api/v1/analytics` | `src/modules/analytics` | `ANALYTICS_SERVICE_PORT` |
| Notification Service | `/api/v1/notifications` | `src/modules/notification` | `NOTIFICATION_SERVICE_PORT` |
| AI Engine Service | `/api/v1/ai-engine` | `src/modules/ai-engine` | `AI_ENGINE_SERVICE_PORT` |

## Cross-Cutting Platform Controls
- Global request validation: `ValidationPipe`
- Global exception normalization: `HttpExceptionFilter`
- Request latency + error logging: `LoggingInterceptor`
- Auth context middleware + JWT + RBAC guards

All ports are configured in `.env.example` and wired by `src/config/microservice.config.ts`.
