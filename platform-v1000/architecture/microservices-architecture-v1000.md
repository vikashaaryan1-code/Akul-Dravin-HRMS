# Microservices Architecture (v1000.0)

## Service boundaries
| Service | Domain | Owns data | Exposes | Key automation/events |
|---|---|---|---|---|
| auth-service | Authentication, OAuth2, SSO, session security | auth tables, token/session cache | REST + GraphQL | login risk alerts, MFA events |
| user-service | User identity and preferences | users, role-mapping | REST | user lifecycle events |
| company-service | Tenant, company, branch, department, designation | org hierarchy | REST | org change events |
| employee-service | Employee profile and lifecycle | employee master, profile docs | REST + GraphQL | join, transfer, exit events |
| attendance-service | Attendance and shift capture | attendance tables, shift calendars | REST | attendance anomaly events |
| leave-service | Leave policy and approvals | leave types, leave requests | REST | leave approval/rejection events |
| payroll-service | Salary engine and payouts | payroll records, target/day-wise tables | REST | payroll calculated/finalized events |
| recruitment-service | ATS pipeline and offers | jobs, applications, interviews, offers | REST + GraphQL | offer accepted/declined events |
| candidate-service | Candidate profiles and resume data | candidate entities + search index references | REST | profile updated, resume parsed |
| recruiter-service | Recruiter marketplace participation | recruiter profiles, commissions | REST | placement closure events |
| marketplace-service | Public/private job marketplace | listings, visibility, ranking metadata | REST | listing publish/expire events |
| document-service | Template rendering and secure distribution | template and generated doc metadata | REST + events | doc generated/delivered |
| workflow-service | Trigger orchestration and action execution | trigger definitions, run logs | REST + events | 200+ trigger execution |
| employee-services-service | Insurance/financial/wellness/L&D enrollments | service catalog + enrollments | REST | auto-enrollment events |
| notification-service | Email/SMS/push/whatsapp delivery | notification jobs and outcomes | REST + events | delivery success/failure |
| analytics-service | Metrics, reports, dashboards | aggregates, cube metadata | GraphQL + REST | scheduled report events |
| billing-service | plans, subscriptions, invoices, usage | billing and invoice entities | REST | subscription lifecycle events |
| ai-gateway-service | model routing, response policies | inference audit store | REST | inference completion events |

## Internal standards for every microservice
- `controllers/`: HTTP/GraphQL adapters.
- `services/`: business logic and orchestration.
- `entities/` and `repositories/`: persistence model.
- `dto/`: payload validation.
- `exceptions/`: typed error mapping.
- `interceptors/` and `middlewares/`: tracing and logging.
- `events/`: event contracts + consumers.
- `tests/`: unit + integration + contract tests.

## Shared contracts
- Common auth claim schema: `tenant_id`, `company_id`, `role`, `scopes`.
- Standard error envelope: `trace_id`, `code`, `message`, `details`.
- Idempotency required for payroll, billing, workflow, and document endpoints.
- Event naming: `<domain>.<entity>.<action>`.

## Event backbone
- RabbitMQ exchanges by domain (`hrms`, `payroll`, `recruitment`, `workflow`, `billing`, `ai`).
- DLQ per consumer group.
- Replay support for failed workflow runs.

## Scaling model
- API services: HPA by p95 latency + CPU.
- Worker services: HPA by queue depth + oldest message age.
- AI services: HPA by request queue and GPU utilization.
