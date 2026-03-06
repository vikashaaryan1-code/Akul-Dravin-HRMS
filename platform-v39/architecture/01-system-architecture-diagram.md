# 01. Complete System Architecture Diagram Description

## Logical Architecture (text diagram)

```text
[Web / Mobile / Partner Portals / Metaverse Client]
            |
            v
[Global CDN + WAF + API Gateway + Rate Limit + Bot Defense]
            |
            v
[Identity Plane]
  - AuthN (JWT/OAuth2)
  - AuthZ (RBAC + ABAC + policy engine)
  - Session + Device Trust + MFA
            |
            v
[Domain Microservices Plane]
  - HRMS Core
  - ERP Core
  - Recruitment ATS
  - Recruiter Marketplace
  - Job Marketplace
  - Candidate Ecosystem
  - Billing + White Label
  - Notification + Workflow
  - Analytics Query Services
            |
            +---------------------------+
            |                           |
            v                           v
[Event Backbone]                  [AI Orchestration Plane]
  - RabbitMQ (commands)             - AI Gateway
  - Redis Streams (real-time)       - Resume Parser
  - CDC/Event outbox                - Candidate Matching
                                    - Interview + Emotion AI
                                    - Workforce Forecasting
                                    - Attrition Prediction
                                    - Voice Assistant + Chatbot
            |
            +---------------------------+
                        |
                        v
[Data Platform]
  - PostgreSQL (OLTP, partitioned, tenant-aware)
  - Elasticsearch (search)
  - Redis (cache/session)
  - Object Storage (documents, audio, video)
  - Data Lake + Feature Store
  - Warehouse + OLAP marts
                        |
                        v
[Observability + Security + Operations]
  - OpenTelemetry, Prometheus, Grafana, ELK
  - SIEM/SOAR + immutable audit trails
  - Secrets/KMS + key rotation
  - SLO/SLI, canary, autoscaling, DR automation
```

## Physical Deployment View
- Multi-region active-active Kubernetes clusters.
- Region pair strategy: `primary + hot-standby` per geography.
- Global traffic manager: latency + geo policy + health failover.
- Data residency by tenant policy (EU, India, Middle East, US, APAC).
- Per-tenant encryption domain and policy guardrails.

## Critical Design Choices
- Database-per-service is not required for every service; use domain schema-per-service with strict ownership for transactional integrity.
- Event-driven integration with outbox/inbox pattern to avoid distributed transaction coupling.
- Tenant isolation: `tenant_id` in all domain tables + PostgreSQL RLS + service-level policy checks.
- AI inference decoupled from core transaction path for resilience.
- Search indexing async via CDC pipeline.

## NFR and Scale Controls
- P95 API read <= 300ms, write <= 500ms.
- Horizontal pod autoscaling with queue-depth and CPU triggers.
- Partitioning for high-volume tables (analytics, attendance, audit, inference logs).
- Cold data archival and lifecycle retention by compliance policy.
