# API Expansion Plan v1000.0

## Target
- 500+ REST endpoints across platform domains.
- GraphQL read aggregation gateway for dashboard and mobile consumption.

## Planned endpoint distribution

| Service | Planned Endpoints |
|---|---:|
| auth-service | 24 |
| user-service | 32 |
| company-service | 28 |
| employee-service | 54 |
| attendance-service | 42 |
| leave-service | 28 |
| payroll-service | 46 |
| recruitment-service | 58 |
| candidate-service | 34 |
| recruiter-marketplace-service | 30 |
| analytics-service | 44 |
| notification-service | 26 |
| billing-service | 30 |
| ai-engine-service | 36 |
| document-center-service | 24 |
| employee-services-service | 20 |
| workflow-automation-service | 22 |
| **Total** | **578** |

## Versioning strategy
- URI versioning: `/api/v1/...`
- Contract evolution through additive changes.
- Breaking changes only via new major path.

## Governance rules
- OpenAPI per service.
- Request/response schema linting in CI.
- Endpoint ownership by service team.
- API deprecation lifecycle with sunset headers.

## GraphQL alignment
- GraphQL layer used for read orchestration.
- Write operations remain service-owned for transactional boundaries.
