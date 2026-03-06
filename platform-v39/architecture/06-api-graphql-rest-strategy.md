# 06. API Strategy (REST + GraphQL)

## API Modes
- REST: command and transactional workflows.
- GraphQL: dashboard aggregation and custom reporting queries.

## REST Principles
- Versioned routes: `/api/v1`
- Idempotency for critical writes
- Signed webhooks for external integrations

## GraphQL Gateway
- Single graph endpoint: `/graphql`
- Schema stitching/federation across domain services
- Query complexity limits + persisted queries
- Field-level authorization with tenant scope checks

## GraphQL Core Domains
- `hrms` (employees, attendance, leave, payroll)
- `erp` (finance, procurement, inventory)
- `recruitment` (jobs, candidates, interviews)
- `marketplace` (recruiters, placements, commissions)
- `analytics` (dashboards, KPI aggregates)
- `ai` (recommendations, model metadata)

## Contract Governance
- OpenAPI for REST
- GraphQL schema registry + breaking-change checks
- AsyncAPI for event contracts
