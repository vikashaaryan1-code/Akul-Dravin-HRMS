# Microservices Catalog (v1000.0)

## Service matrix
| Service | Core responsibility | Primary data store | Key event topics |
|---|---|---|---|
| Auth Service | SSO, MFA, token lifecycle, device trust | PostgreSQL + Redis | `auth.login`, `auth.risk_alert` |
| User Service | User identity, profile, preferences | PostgreSQL | `user.created`, `user.updated` |
| Company Service | Tenant, company, branches, org hierarchy | PostgreSQL | `org.branch.created` |
| Employee Service | Employee lifecycle, docs, profile changes | PostgreSQL + Object Storage | `employee.joined`, `employee.exited` |
| Attendance Service | Check-in/out, shift calendar, geo/biometric events | PostgreSQL + TimescaleDB | `attendance.captured` |
| Leave Service | Leave balances, approvals, policies | PostgreSQL | `leave.approved`, `leave.rejected` |
| Payroll Service | Salary calculations, payslip generation, payouts | PostgreSQL | `payroll.calculated`, `payroll.finalized` |
| Recruitment Service | Jobs, pipelines, interviews, offers | PostgreSQL + Elasticsearch | `job.published`, `application.created` |
| Candidate Service | Candidate profile, resume, skills, history | PostgreSQL + Elasticsearch | `candidate.updated`, `resume.uploaded` |
| Recruiter Service | Recruiter profile, assignments, commissions | PostgreSQL | `recruiter.placement.closed` |
| Marketplace Service | Job distribution, listing ranking, marketplace matching | Elasticsearch + PostgreSQL | `marketplace.listing.published` |
| Billing Service | Plans, subscriptions, invoices, usage billing | PostgreSQL | `subscription.renewed`, `invoice.paid` |
| Notification Service | Email, SMS, WhatsApp, push, in-app notifications | Redis + PostgreSQL | `notification.sent`, `notification.failed` |
| Analytics Service | KPIs, aggregates, report generation, dashboards | TimescaleDB + Elasticsearch | `analytics.aggregate.ready` |
| Workflow Service | Trigger orchestration and automation execution | PostgreSQL + RabbitMQ | `workflow.triggered`, `workflow.completed` |
| Document Service | Template rendering and document lifecycle | PostgreSQL + Object Storage | `document.generated`, `document.delivered` |
| AI Gateway Service | Unified routing to AI microservices | Redis + PostgreSQL | `ai.inference.completed` |

## Cross-cutting standards
- API style: REST for transactional APIs, GraphQL for dashboard aggregation, events for async side effects.
- Security: OAuth2 scopes + RBAC + ABAC + tenant scope claim.
- Error contract: standardized error envelope with trace id and remediation code.
- Idempotency: required on payroll, offer, payout, and document generation endpoints.
- Audit: all mutable workflows log actor, source, before/after payload hash.

## Internal namespaces
- `svc-auth`, `svc-hrms`, `svc-recruitment`, `svc-marketplace`, `svc-ai`, `svc-workflow`, `svc-billing`, `svc-analytics`.

## Service scaling profile
- Stateless APIs: HPA on CPU + p95 latency.
- Worker services: HPA on queue depth + message age.
- AI inference services: HPA on GPU utilization + request queue.
- Search services: shard-aware autoscaling.
