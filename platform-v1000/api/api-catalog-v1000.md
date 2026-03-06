# API Catalog Strategy (v1000.0)

This catalog defines endpoint families and naming standards to scale beyond 500 APIs without versioning chaos.

## Base conventions
- Base path: `/api/v1`.
- Tenant scope: `X-Tenant-Id` + JWT claim validation.
- Idempotent writes: `Idempotency-Key` header on payout, payroll, offer, and document APIs.
- Pagination: cursor based (`cursor`, `limit`).
- Time format: ISO 8601 UTC.

## Endpoint families

### Auth and Access (40+)
- `/auth/login`, `/auth/refresh`, `/auth/logout`
- `/auth/mfa/setup`, `/auth/mfa/verify`
- `/auth/sessions`, `/auth/sessions/revoke/:id`
- `/roles`, `/permissions`, `/access/policies`

### Org and User (50+)
- `/tenants`, `/companies`, `/branches`, `/departments`, `/designations`
- `/users`, `/users/:id/preferences`, `/users/:id/roles`
- `/employees`, `/employees/:id/lifecycle`, `/employees/:id/documents`

### Attendance and Leave (60+)
- `/attendance/checkin`, `/attendance/checkout`
- `/attendance/records`, `/attendance/exceptions`
- `/leave/types`, `/leave/balances`, `/leave/requests`
- `/leave/approvals/:id/approve`, `/leave/approvals/:id/reject`

### Payroll and Compensation (70+)
- `/payroll/runs`, `/payroll/runs/:id/finalize`
- `/payroll/records`, `/payroll/payslips/:id`
- `/payroll/calculate/target-based`
- `/payroll/calculate/days-wise`
- `/payroll/target-plans`, `/payroll/target-achievements`
- `/payroll/bonuses`, `/payroll/deductions`, `/payroll/projections`

### Recruitment and ATS (90+)
- `/jobs`, `/jobs/:id/publish`, `/jobs/:id/close`
- `/applications`, `/applications/:id/stage`
- `/interviews`, `/interviews/:id/feedback`
- `/offers`, `/offers/:id/accept`, `/offers/:id/withdraw`
- `/candidates`, `/candidates/:id/resume`, `/candidates/search`

### Recruiter Marketplace (45+)
- `/recruiters`, `/recruiters/:id/verification`
- `/marketplace/listings`, `/marketplace/listings/:id/apply`
- `/placements`, `/placements/:id/commission`

### ERP modules (90+)
- `/finance/accounts`, `/finance/journals`, `/finance/close-period`
- `/procurement/requisitions`, `/procurement/purchase-orders`
- `/inventory/items`, `/inventory/movements`, `/inventory/reorder`
- `/vendors`, `/assets`, `/budgets`

### Document automation (40+)
- `/documents/templates`, `/documents/render`
- `/documents/events/preview`, `/documents/events/execute`
- `/documents/id-cards/generate`, `/documents/visiting-cards/generate`
- `/certificates/issue`, `/certificates/revoke`

### AI and Analytics (80+)
- `/ai/resume/parse`
- `/ai/matching/candidate-job`
- `/ai/interview/analyze`
- `/ai/workforce/attrition/predict`
- `/analytics/dashboards/*`
- `/analytics/reports/*`

### Billing and Partner APIs (50+)
- `/plans`, `/subscriptions`, `/invoices`, `/payments`
- `/usage/metrics`, `/partner/tenants`, `/partner/branding`

## Endpoint governance
- Feature teams own OpenAPI specs in service repos.
- Contract tests run in CI for backward compatibility.
- Deprecated endpoints must have migration docs and sunset date.
