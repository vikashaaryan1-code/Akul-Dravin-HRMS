# AKUL DRAVIN HRMS AI - NestJS Backend Architecture

## Stack
- Node.js + NestJS
- PostgreSQL (TypeORM)
- JWT authentication
- Role-based access control (RBAC)
- Nest TCP microservice channels
- Global validation, structured error responses, and request logging

## Microservice Structure
- API Gateway: `src/main.ts` + `src/app.module.ts`
- Auth Service (port `AUTH_SERVICE_PORT`)
- User Service (port `USER_SERVICE_PORT`)
- Company Service (port `COMPANY_SERVICE_PORT`)
- Employee Service (port `EMPLOYEE_SERVICE_PORT`)
- Attendance Service (port `ATTENDANCE_SERVICE_PORT`)
- Leave Service (port `LEAVE_SERVICE_PORT`)
- Payroll Service (port `PAYROLL_SERVICE_PORT`)
- Recruitment ATS Service (port `RECRUITMENT_ATS_SERVICE_PORT`)
- Recruiter Marketplace Service (port `RECRUITER_MARKETPLACE_SERVICE_PORT`)
- Candidate Profiles Service (port `CANDIDATE_SERVICE_PORT`)
- Job Marketplace Service (port `JOB_MARKETPLACE_SERVICE_PORT`)
- Marketplace Service (port `MARKETPLACE_SERVICE_PORT`)
- Subscription & Billing Service (port `SUBSCRIPTION_BILLING_SERVICE_PORT`)
- Analytics Service (port `ANALYTICS_SERVICE_PORT`)
- Notification Service (port `NOTIFICATION_SERVICE_PORT`)
- AI Engine Service (port `AI_ENGINE_SERVICE_PORT`)

## Project Layout
```text
backend/hrms-microservices/
  src/
    main.ts
    app.module.ts
    auth/
    common/
      decorators/
      enums/
      guards/
      middleware/
      filters/
      interceptors/
    config/
      api-routes.ts
      microservice.config.ts
    database/
      entities/
    modules/
      user/
      company/
      employee/
      attendance/
      leave/
      payroll/
      recruitment-ats/
      recruiter-marketplace/
      candidate-profiles/
      job-marketplace/
      marketplace/
      subscription-billing/
      analytics/
      notification/
      ai-engine/
```

## Security and Platform Controls
- JWT strategy: `src/auth/jwt.strategy.ts`
- Auth middleware: `src/common/middleware/auth-context.middleware.ts`
- Auth guard: `src/common/guards/jwt-auth.guard.ts`
- RBAC guard + roles decorator
- Global exception filter: `src/common/filters/http-exception.filter.ts`
- Global logging interceptor: `src/common/interceptors/logging.interceptor.ts`

## Route Inventory
Full route map is defined in `src/config/api-routes.ts` and summarized in `API_ROUTES.md`.

## Run (after installing dependencies)
```bash
npm install
npm run start:dev
```

## Notes
- `synchronize` is disabled by default in TypeORM config. Use migrations in production.
- `AuthService` currently compares plaintext password to `passwordHash` for scaffold simplicity; replace with Argon2/Bcrypt before production.
