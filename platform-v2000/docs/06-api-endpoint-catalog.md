# 06. API Endpoint Catalog

## API Standards
- Base URL: `/api/v1`
- Auth: JWT Bearer + tenant context
- Authorization: RBAC permission checks
- Response envelope: `{ data, meta, error }`
- Idempotency required for financial and workflow command APIs

## Endpoint Capacity Plan (500+)
| Service | Planned Endpoints |
|---|---:|
| auth-service | 24 |
| user-service | 28 |
| company-service | 24 |
| employee-service | 42 |
| attendance-service | 36 |
| leave-service | 24 |
| payroll-service | 40 |
| recruitment-ats-service | 46 |
| crm-service | 38 |
| sales-automation-service | 44 |
| marketing-automation-service | 36 |
| finance-accounting-service | 44 |
| helpdesk-service | 32 |
| project-management-service | 28 |
| task-management-service | 30 |
| inventory-service | 30 |
| vendor-management-service | 24 |
| procurement-service | 30 |
| document-automation-service | 28 |
| workflow-automation-service | 30 |
| analytics-service | 34 |
| ai-intelligence-service | 34 |
| notification-service | 20 |
| integration-marketplace-service | 22 |
| billing-service | 24 |
| audit-security-service | 24 |
| **Total** | **854** |

## Core Endpoint Set (Representative)

### Authentication
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/mfa/verify`

### HRMS
- `GET /employees`
- `GET /employees/:id`
- `POST /employees`
- `PATCH /employees/:id`
- `POST /employees/:id/promote`
- `POST /employees/:id/terminate`

### Attendance
- `POST /attendance/check-in`
- `POST /attendance/check-out`
- `GET /attendance`
- `GET /attendance/workdays`
- `GET /attendance/shifts`

### Leave
- `GET /leave/requests`
- `POST /leave/requests`
- `PATCH /leave/requests/:id/approve`
- `PATCH /leave/requests/:id/reject`

### Payroll
- `GET /payroll`
- `POST /payroll/run`
- `POST /payroll/calculate/target-based`
- `POST /payroll/calculate/days-wise`
- `POST /payroll/commissions/sync`
- `GET /payroll/payslips/:employeeId`

### Recruitment ATS
- `GET /recruitment/jobs`
- `POST /recruitment/jobs`
- `GET /recruitment/applications`
- `PATCH /recruitment/applications/:id/stage`
- `POST /recruitment/offers`
- `POST /recruitment/onboarding/start`

### CRM
- `GET /crm/leads`
- `POST /crm/leads`
- `PATCH /crm/leads/:id/assign`
- `POST /crm/leads/:id/score`
- `GET /crm/customers`
- `GET /crm/interactions`

### Sales Automation
- `GET /sales/pipeline`
- `PATCH /sales/pipeline/stage`
- `GET /sales/deals`
- `POST /sales/deals`
- `GET /sales/targets`
- `POST /sales/commissions/calculate`

### Marketing Automation
- `GET /marketing/campaigns`
- `POST /marketing/campaigns`
- `POST /marketing/campaigns/:id/launch`
- `POST /marketing/channels/email/send`
- `POST /marketing/channels/sms/send`
- `POST /marketing/channels/whatsapp/send`
- `POST /marketing/landing-pages`

### Finance
- `GET /finance/ledger`
- `POST /finance/invoices`
- `GET /finance/invoices`
- `POST /finance/expenses`
- `GET /finance/tax/gst-report`
- `GET /finance/analytics/summary`

### Helpdesk
- `GET /helpdesk/tickets`
- `POST /helpdesk/tickets`
- `PATCH /helpdesk/tickets/:id/assign`
- `PATCH /helpdesk/tickets/:id/resolve`
- `GET /helpdesk/sla/breaches`

### Projects and Tasks
- `GET /projects`
- `POST /projects`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/:id/status`
- `GET /tasks/overdue`

### Inventory / Vendors / Procurement
- `GET /inventory/items`
- `POST /inventory/items`
- `GET /inventory/low-stock`
- `GET /vendors`
- `POST /vendors`
- `POST /procurement/purchase-orders`
- `PATCH /procurement/purchase-orders/:id/approve`

### Documents and Workflow
- `GET /documents`
- `POST /documents/generate`
- `POST /documents/certificates/generate`
- `GET /workflows`
- `POST /workflows`
- `POST /workflows/:id/trigger`

### Analytics and AI
- `GET /analytics/hr`
- `GET /analytics/sales`
- `GET /analytics/marketing`
- `GET /analytics/finance`
- `POST /ai/predictions/attrition`
- `POST /ai/predictions/sales-forecast`
- `POST /ai/predictions/revenue-forecast`
- `POST /ai/anomaly/fraud-detection`

### Security / Permissions / Audit
- `GET /permissions/roles`
- `PATCH /permissions/roles/:id`
- `GET /audit/logs`
- `GET /security/alerts`
- `POST /security/access/revoke`

### Integration Marketplace
- `GET /integrations/connectors`
- `POST /integrations/connectors/:id/connect`
- `PATCH /integrations/connectors/:id/config`
- `POST /integrations/webhooks`

## OpenAPI Generation Strategy
- Generate per-service OpenAPI specs and merge at API gateway.
- Version specs by service release tags.
- SDKs auto-generated for web/mobile clients.
