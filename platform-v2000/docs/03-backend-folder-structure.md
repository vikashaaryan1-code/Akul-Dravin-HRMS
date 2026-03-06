# 03. Backend Folder Structure

## Recommended Monorepo Layout (NestJS Microservices)

```text
backend-v2000/
  package.json
  pnpm-workspace.yaml
  libs/
    common/
      auth/
      rbac/
      observability/
      messaging/
      validation/
      security/
    contracts/
      events/
      dto/
      openapi/
  services/
    api-gateway/
    auth-service/
    user-service/
    company-service/
    employee-service/
    attendance-service/
    leave-service/
    payroll-service/
    recruitment-ats-service/
    crm-service/
    sales-automation-service/
    marketing-automation-service/
    finance-accounting-service/
    helpdesk-service/
    project-management-service/
    task-management-service/
    inventory-service/
    vendor-management-service/
    procurement-service/
    document-automation-service/
    workflow-automation-service/
    analytics-service/
    ai-intelligence-service/
    notification-service/
    billing-service/
    integration-marketplace-service/
    audit-security-service/
  infra/
    docker/
    kubernetes/
    terraform/
  scripts/
    seed/
    migrations/
    load-tests/
```

## Per-Service Structure
```text
<service>/
  src/
    controllers/
    services/
    entities/
    dto/
    events/
    config/
    module.ts
    main.ts
  tests/
  Dockerfile
  README.md
```

## Current Scaffold in This Repo
- Backend scaffold path: `platform-v2000/scaffolds/backend/services/*`
- Includes 26+ service directories with standard `src` and `tests` structure.

## Coding Conventions
- Use DTO validation (`class-validator`) at API boundary.
- Business logic only in `services/`.
- No cross-service DB table writes.
- Publish domain events after transactional commit.
- Add request correlation IDs for traceability.

## Data Ownership Rule
Each microservice owns only its bounded context tables and exposes data via APIs/events. Shared DB access across services is prohibited.

## Versioning
- API versioning: `/api/v1`, `/api/v2`.
- Event versioning: `entity.action.v1` naming.
- Backward compatibility required for one major version window.
