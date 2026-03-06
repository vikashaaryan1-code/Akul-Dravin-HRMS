# System Architecture (v1000.0)

## 1. Logical layers
1. Client layer
- Next.js web app.
- React Native mobile apps.
- Partner API clients.
- Voice AI channels.
- Metaverse client gateway.

2. Edge and API layer
- Cloudflare WAF + CDN + bot protection.
- Global load balancer with geo-routing.
- API gateway (Kong/Nginx) with OAuth2, rate limit, quota, request signing.

3. Platform service layer (NestJS microservices)
- Domain microservices (HRMS, ATS, ERP, marketplace, billing, analytics).
- Internal API mesh (REST + gRPC/event contracts).
- Workflow orchestration service for automation triggers.

4. AI intelligence layer (Python/FastAPI)
- Resume parsing, matching, interview analysis.
- Attrition and workforce prediction.
- Recommendation, anomaly, and fraud engines.
- Model serving gateway and feature store access.

5. Data and search layer
- PostgreSQL (OLTP, tenant-scoped transactional data).
- TimescaleDB (high-volume time-series analytics).
- Redis (cache, distributed locks, queue state).
- Elasticsearch (job/candidate/document search).
- Object storage (documents, ID cards, certificates, generated files).

6. Platform operations layer
- RabbitMQ for async workflow events and retries.
- Observability stack (Prometheus, Grafana, ELK, OpenTelemetry).
- Security tooling (SIEM, audit pipelines, secret manager, key rotation).
- CI/CD and Infrastructure-as-Code pipelines.

## 2. Text diagram
```
[Web/Mobile/Voice/Metaverse Clients]
              |
      [Cloudflare Edge]
              |
   [API Gateway + AuthN/AuthZ]
              |
 ---------------------------------------------------
 | NestJS Domain Services + Workflow Orchestrator  |
 ---------------------------------------------------
      |             |                |
 [PostgreSQL]    [RabbitMQ]      [Redis]
      |             |                |
 [TimescaleDB] [AI FastAPI Mesh] [Elasticsearch]
      |             |
 [Object Storage + Document Renderer]
              |
      [Monitoring + Security + DR]
```

## 3. Multi-tenant isolation strategy
- Shared database, shared schema, strict `tenant_id` scoping.
- Row-level security policy for all tenant tables.
- Tenant-aware JWT claims and middleware enforcement.
- Encryption key scoping for sensitive tenant payloads.
- Tenant usage limits enforced at gateway and service layers.

## 4. Reliability design
- Active-active multi-region for API and worker planes.
- Region-local write preference with replica fan-out.
- Automated failover using health-based traffic steering.
- Queue DLQ policies for all side-effecting workflows.
- SLO model: 99.999% critical path, error budget enforcement.
