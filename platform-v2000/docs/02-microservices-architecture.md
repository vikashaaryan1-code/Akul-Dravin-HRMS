# 02. Microservices Architecture

## Service Topology

### Platform Core Services
- `api-gateway`: request routing, rate limit, auth token validation, tenant resolution.
- `auth-service`: login, refresh, SSO, MFA, session policies.
- `user-service`: user profile, identity metadata.
- `permission-service`: roles, permissions, policy grants/revokes.
- `audit-security-service`: audit logs, threat signals, risk events.
- `notification-service`: email, SMS, WhatsApp, in-app notifications.
- `integration-marketplace-service`: connector lifecycle and external integrations.
- `billing-service`: plans, subscriptions, invoices, usage metering.

### Business Domain Services
- `company-service`
- `employee-service`
- `attendance-service`
- `leave-service`
- `payroll-service`
- `recruitment-ats-service`
- `crm-service`
- `sales-automation-service`
- `marketing-automation-service`
- `finance-accounting-service`
- `helpdesk-service`
- `project-management-service`
- `task-management-service`
- `inventory-service`
- `vendor-management-service`
- `procurement-service`
- `document-automation-service`
- `workflow-automation-service`
- `analytics-service`
- `ai-intelligence-service`

## Communication Pattern
- Synchronous: REST/gRPC for command/query APIs.
- Asynchronous: Kafka/NATS for domain events.
- Realtime: WebSocket/SSE via gateway notification channel.

## Canonical Event Streams
- `employee.joined`
- `attendance.checked_in`
- `leave.approved`
- `payroll.processed`
- `candidate.hired`
- `lead.created`
- `deal.closed_won`
- `campaign.launched`
- `invoice.generated`
- `ticket.escalated`
- `task.overdue`
- `inventory.low_stock`
- `purchase_order.approved`
- `workflow.failed`

## Domain Ownership Matrix
| Service | Owns Data | Consumes Events | Produces Events |
|---|---|---|---|
| employee-service | employees, lifecycle | user.created | employee.joined, employee.updated |
| attendance-service | attendance, shifts | employee.joined | attendance.checked_in, attendance.checked_out |
| payroll-service | payroll_runs, payslips | attendance.*, sales.target.* | payroll.processed, payslip.generated |
| crm-service | leads, contacts, accounts | marketing.lead.captured | lead.created, lead.qualified |
| sales-automation-service | deals, targets, commissions | lead.qualified | deal.closed_won, commission.calculated |
| marketing-automation-service | campaigns, audiences | customer.segment.updated | campaign.sent, campaign.converted |
| finance-accounting-service | ledger, invoices, expenses, taxes | payroll.processed, deal.closed_won | invoice.generated, tax.report.ready |
| workflow-automation-service | rules, executions | all business events | workflow.triggered, workflow.completed |
| ai-intelligence-service | model registry, predictions | analytics.features.ready | prediction.generated, anomaly.detected |
| analytics-service | analytics_events, aggregates | all domain events | dashboard.aggregate.updated |

## Deployment Units
- Each service packaged as independent container image.
- Each service has:
  - its own schema or database namespace.
  - independent autoscaling profile.
  - dedicated CI pipeline and versioning.

## Resilience Controls
- Circuit breakers and retry with exponential backoff.
- Idempotency keys for command APIs.
- Dead-letter queues for failed event processing.
- Bulkhead isolation for critical modules (payroll, finance, auth).

## Suggested Service Count for v2000
- Core services: 8
- Business services: 18
- Intelligence/automation services: 3
- Total independently deployable services: 29
