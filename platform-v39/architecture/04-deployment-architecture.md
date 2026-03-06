# 04. Deployment Architecture (Global SaaS)

## Multi-Region Topology
- Control Plane: global governance cluster.
- Data Planes: region-specific workload clusters (100+ target regions over rollout).
- Pattern: active-active by continent, active-passive within region pair.

## Core Components
- Ingress: Global Anycast + WAF + CDN.
- Service Mesh: mTLS, retries, circuit breaking.
- Compute: Kubernetes node pools (api, async, ai-gpu, analytics).
- Data:
  - PostgreSQL HA cluster per region.
  - Redis cluster for cache/session.
  - RabbitMQ cluster for commands/events.
  - Elasticsearch cluster for search.
  - Object storage for documents/media.

## CI/CD and Release
- GitHub Actions or GitLab CI pipeline.
- Stages: lint -> unit -> contract -> integration -> security scan -> deploy.
- Progressive delivery: canary -> 25% -> 50% -> 100%.
- Auto rollback on error budget breach.

## Reliability and DR
- RPO: <= 1 hour.
- RTO: <= 4 hours (critical services).
- Cross-region replication for metadata and analytics.
- Daily snapshots + immutable backup retention.

## Security and Compliance
- Secrets in KMS/HSM.
- TLS 1.3 everywhere, AES-256 at rest.
- Mandatory MFA for privileged identities.
- Regional data residency controls by tenant policy.
- Immutable audit logs streamed to SIEM.

## Observability
- Metrics: Prometheus.
- Logs: ELK.
- Traces: OpenTelemetry.
- SLO dashboards per domain (HRMS, ERP, ATS, AI).
