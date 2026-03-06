# 02. Microservices Catalog

## Core Platform Services (NestJS)

| Group | Service | Responsibility |
|---|---|---|
| Edge | API Gateway | Unified entrypoint, routing, auth context, throttling |
| Identity | Auth Service | Login, refresh, MFA, token issuance |
| Identity | IAM Service | Roles, permissions, policy mapping |
| Identity | Session Service | Device/session lifecycle |
| Tenant | Tenant Service | Tenant registry, region policy, data residency |
| White Label | Partner Service | Branding, domains, partner clients |
| HRMS | Company Service | Companies, branches, org setup |
| HRMS | People Service | Employee profile, lifecycle, documents |
| HRMS | Org Service | Departments, designations, hierarchies |
| HRMS | Attendance Service | Check-in/out, shifts, overtime |
| HRMS | Leave Service | Leave policy, balances, approvals |
| HRMS | Payroll Service | Salary components, runs, payslips |
| HRMS | Performance Service | Goals, reviews, cycles |
| HRMS | Policy Service | HR policies, workflows, approvals |
| ERP | Finance Service | Ledgers, journals, closing |
| ERP | Procurement Service | Vendors, POs, approvals |
| ERP | Inventory Service | Warehouses, stock, valuation |
| ERP | Sales Service | Orders, invoices, receivables |
| ERP | CRM Service | Accounts, opportunities, activities |
| ERP | Projects Service | Project planning, timesheets, billing |
| ERP | Asset Service | Asset registry, depreciation |
| ERP | Expense Service | Claims, reimbursements, controls |
| Recruitment | ATS Service | Jobs, applications, stages |
| Recruitment | Interview Service | Schedules, panels, feedback |
| Recruitment | Offer Service | Offer generation, approvals |
| Marketplace | Recruiter Marketplace Service | Recruiter onboarding, assignments |
| Marketplace | Commission Service | Placement commissions, payout rules |
| Marketplace | Job Marketplace Service | Public jobs, discovery, recommendation hooks |
| Marketplace | Candidate Service | Candidate profile, resume, preferences |
| Billing | Pricing Service | Plan catalog, add-ons |
| Billing | Subscription Service | Subscription lifecycle |
| Billing | Invoicing Service | Invoice creation, tax handling |
| Billing | Payment Service | Gateway integration, webhooks |
| Analytics | Event Ingestion Service | Event capture and contract validation |
| Analytics | Metrics Service | KPI computation and aggregates |
| Analytics | Reporting Service | Dashboards, scheduled reports |
| Comms | Notification Service | Email/SMS/WhatsApp/push |
| Comms | Template Service | Message templates, localization |
| Automation | Workflow Service | BPM workflows, state transitions |
| Integration | Webhook Service | Partner callback management |
| Integration | Connector Service | ERP/Payroll/Identity third-party connectors |
| Platform | Audit Service | Immutable audit logs |
| Platform | File Service | Document/object storage orchestration |
| Platform | Search Index Service | Elasticsearch sync and reindex |
| Platform | Feature Flag Service | Tenant/plan feature gates |
| Platform | Config Service | Dynamic configuration and rollout |
| Platform | Scheduler Service | Batch and recurring jobs |
| Metaverse | Virtual Office Service | Office spaces, rooms, sessions |
| Metaverse | Presence Service | Avatar presence and collaboration state |

## AI Services (FastAPI)
- AI Orchestrator
- Resume Parser Service
- Candidate Matching Service
- Interview Analysis Service
- Emotion AI Service
- Workforce Intelligence Service
- Attrition Prediction Service
- Voice AI Service
- HR Assistant Chat Service
- Model Registry Service
- Feature Store Service
- Drift Monitoring Service

## Service Communication
- Synchronous: REST/gRPC for low-latency reads/writes.
- Asynchronous: RabbitMQ topics + outbox events for cross-domain updates.
- Real-time: Redis pub/sub streams for presence, dashboard live tiles, chatbot sessions.
