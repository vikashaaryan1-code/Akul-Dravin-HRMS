# AKUL DRAVIN HRMS & ERP PLATFORM v1000.0

## Enterprise System Architecture

## 1. Platform scope
The platform is a multi-tenant, cloud-native enterprise operating system covering HRMS, ERP, ATS, marketplace, payroll intelligence, document automation, and AI workforce decisioning.

Core targets:
- 1B+ records.
- 500+ API endpoints.
- 250+ ML models.
- 150+ document templates.
- 200+ workflow triggers.
- 50+ employee services.
- White-label + multi-company deployment.

## 2. Layered architecture
1. Experience Layer
- Next.js web apps for Platform Admin, Company Admin, HR Manager, Recruiter, Employee, Job Seeker.
- React Native mobile apps for employee and recruiter journeys.
- Partner integration portals and API consumers.

2. Edge + Access Layer
- Cloudflare CDN/WAF.
- API Gateway for auth, throttling, request signing, routing.
- Identity federation for SSO/OAuth2.

3. Domain Microservices Layer (NestJS)
- HRMS, ERP, ATS, Marketplace, Billing, Notification, Workflow, Analytics services.
- Sync APIs (REST/GraphQL) + async events (RabbitMQ).

4. Intelligence Layer (FastAPI + ML)
- Resume parsing, matching, forecasting, anomaly and fraud models.
- Model registry, feature store, and inference gateway.

5. Data Layer
- PostgreSQL for transactional data.
- Redis for cache/session/locks.
- Elasticsearch for full-text search.
- TimescaleDB for high-volume time series analytics.
- Object storage for generated files and media.

6. Operations Layer
- Kubernetes orchestration, service mesh, autoscaling.
- Observability (metrics, logs, traces).
- Security operations and compliance evidence automation.

## 3. Runtime interaction model
- Command path: Client -> API Gateway -> Domain Service -> PostgreSQL/Redis -> Response.
- Event path: Domain Service -> Outbox -> RabbitMQ -> Workflow Service -> Document/Notification/Service Enrollment.
- AI path: Domain Service -> AI Gateway -> Model Service -> Decision/Score -> Domain update + audit.

## 4. Multi-tenant model
- Shared services + shared PostgreSQL clusters with tenant-scoped partitioning strategy.
- Every transactional table includes tenant and company ownership metadata.
- Tenant-aware JWT claims and policy engine checks at gateway and service level.

## 5. Availability and scale
- Active-active regional API planes.
- Regional write ownership with cross-region replica strategy.
- Queue-based buffering for burst loads.
- Horizontal pod autoscaling by CPU, latency, and queue depth.

## 6. Production readiness standards
- Idempotent APIs for financial and workflow operations.
- Immutable audit logging for sensitive actions.
- Canary release and automatic rollback.
- DR drills with RTO/RPO SLO validation.
