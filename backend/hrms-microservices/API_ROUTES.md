# API Routes

## Authentication Service
- `POST /api/v1/auth/login`

## User Service
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`

## Company Management
- `GET /api/v1/companies`
- `GET /api/v1/companies/:id`
- `POST /api/v1/companies`
- `PATCH /api/v1/companies/:id`

## Employee Management
- `GET /api/v1/employees`
- `GET /api/v1/employees/:id`
- `POST /api/v1/employees`
- `PATCH /api/v1/employees/:id`

## Attendance System
- `GET /api/v1/attendance`
- `GET /api/v1/attendance/:id`
- `POST /api/v1/attendance`
- `PATCH /api/v1/attendance/:id`

## Leave Service
- `GET /api/v1/leave/types`
- `POST /api/v1/leave/types`
- `GET /api/v1/leave/requests`
- `GET /api/v1/leave/requests/:id`
- `POST /api/v1/leave/requests`
- `PATCH /api/v1/leave/requests/:id/status`

## Payroll Engine
- `GET /api/v1/payroll`
- `GET /api/v1/payroll/:id`
- `POST /api/v1/payroll`
- `PATCH /api/v1/payroll/:id`

## Recruitment ATS
- `GET /api/v1/recruitment/jobs`
- `POST /api/v1/recruitment/jobs`
- `PATCH /api/v1/recruitment/jobs/:id`
- `GET /api/v1/recruitment/applications`
- `POST /api/v1/recruitment/applications`
- `PATCH /api/v1/recruitment/applications/:id`

## Recruiter Marketplace
- `GET /api/v1/recruiter-marketplace/profiles`
- `GET /api/v1/recruiter-marketplace/profiles/:id`
- `POST /api/v1/recruiter-marketplace/profiles`
- `PATCH /api/v1/recruiter-marketplace/profiles/:id`

## Candidate Profiles
- `GET /api/v1/candidates`
- `GET /api/v1/candidates/:id`
- `POST /api/v1/candidates`
- `PATCH /api/v1/candidates/:id`

## Job Marketplace
- `GET /api/v1/job-marketplace/jobs`
- `GET /api/v1/job-marketplace/jobs/:id`
- `POST /api/v1/job-marketplace/jobs`
- `PATCH /api/v1/job-marketplace/jobs/:id`

## Marketplace Service
- `GET /api/v1/marketplace/listings`
- `GET /api/v1/marketplace/listings/:id`
- `POST /api/v1/marketplace/listings`
- `PATCH /api/v1/marketplace/listings/:id`

## Subscription & Billing
- `GET /api/v1/billing/subscriptions`
- `POST /api/v1/billing/subscriptions`
- `PATCH /api/v1/billing/subscriptions/:id`
- `GET /api/v1/billing/invoices`
- `POST /api/v1/billing/invoices`
- `PATCH /api/v1/billing/invoices/:id`

## Analytics Service
- `GET /api/v1/analytics/events`
- `POST /api/v1/analytics/events`
- `GET /api/v1/analytics/dashboard`

## Notification Service
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/:id`
- `POST /api/v1/notifications`
- `PATCH /api/v1/notifications/:id`

## AI Engine Service
- `GET /api/v1/ai-engine/insights`
- `GET /api/v1/ai-engine/insights/:id`
- `POST /api/v1/ai-engine/insights`
- `PATCH /api/v1/ai-engine/insights/:id`
- `POST /api/v1/ai-engine/recommendations`
