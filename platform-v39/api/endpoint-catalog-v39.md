# API Endpoint Catalog v39

## Versioning Standard
- Base path: `/api/v1`
- Tenant header: `X-Tenant-Id`
- Idempotency key required on critical writes.

## Endpoint Volume Plan (500+)

| Domain | Estimated Endpoints |
|---|---:|
| Identity + IAM | 52 |
| Tenant + White Label | 34 |
| HRMS Core | 126 |
| ERP Core | 142 |
| Recruitment ATS | 74 |
| Recruiter Marketplace | 36 |
| Job Marketplace + Candidate | 44 |
| Billing + Payments | 38 |
| Analytics + Reporting | 28 |
| Notification + Workflow | 22 |
| AI Services | 44 |
| Metaverse Office | 18 |
| **Total** | **658** |

## Route Families

### Identity + IAM
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/mfa/challenge`
- `POST /auth/mfa/verify`
- `GET /iam/roles`
- `POST /iam/roles`
- `GET /iam/permissions`
- `POST /iam/policies/evaluate`

### HRMS Core
- `/companies`, `/branches`, `/departments`, `/designations`
- `/employees`, `/employee-documents`, `/employee-lifecycle`
- `/attendance`, `/shifts`, `/overtime`, `/attendance-corrections`
- `/leave-types`, `/leave-policies`, `/leave-balances`, `/leave-requests`
- `/payroll-cycles`, `/payroll-runs`, `/payslips`, `/salary-structures`

### ERP Core
- `/finance/accounts`, `/finance/journals`, `/finance/close`
- `/procurement/vendors`, `/procurement/purchase-orders`
- `/inventory/items`, `/inventory/warehouses`, `/inventory/movements`
- `/sales/customers`, `/sales/orders`, `/sales/invoices`
- `/projects`, `/timesheets`, `/expenses`, `/assets`

### Recruitment + Marketplace
- `/recruitment/jobs`, `/applications`, `/interviews`, `/offers`, `/hires`
- `/recruiters`, `/assignments`, `/commissions`, `/payouts`
- `/job-marketplace/jobs`, `/search`, `/recommendations`
- `/candidates/profiles`, `/resumes`, `/preferences`

### AI and Analytics
- `/ai/resume-parser/parse`
- `/ai/matching/score`
- `/ai/interview/analyze`
- `/ai/emotion/detect`
- `/ai/workforce/forecast`
- `/ai/attrition/predict`
- `/ai/chatbot/respond`
- `/analytics/events`, `/analytics/kpis`, `/analytics/reports`

### Metaverse
- `/metaverse/offices`, `/rooms`, `/presence`, `/sessions`

## Security Gates
- Public: selected marketplace read routes only.
- JWT: authenticated user routes.
- JWT + RBAC + ABAC: all enterprise and tenant-sensitive routes.
- Webhook signature verification for inbound payment/integration callbacks.
