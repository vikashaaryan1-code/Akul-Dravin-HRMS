# Backend Folder Structure (v1000.0)

## Recommended monorepo layout
```text
backend/
  apps/
    api-gateway/
      src/
        main.ts
        app.module.ts
        modules/
          auth-proxy/
          rate-limit/
          routing/
    auth-service/
      src/
        modules/
          auth/
            controllers/
            services/
            dto/
            entities/
            guards/
            strategies/
            events/
          session/
          oauth/
          sso/
    user-service/
    company-service/
    employee-service/
    attendance-service/
    leave-service/
    payroll-service/
    recruitment-service/
    candidate-service/
    recruiter-service/
    marketplace-service/
    document-service/
    workflow-service/
    employee-services-service/
    analytics-service/
    billing-service/
    notification-service/
    ai-gateway-service/
  packages/
    common/
      src/
        auth/
        middleware/
        logging/
        errors/
        events/
        validation/
        tenant/
    contracts/
      openapi/
      graphql/
      events/
    database/
      migrations/
      seed/
      sql/
    observability/
      tracing/
      metrics/
      dashboards/
  tools/
    scripts/
    generators/
  infra/
    docker/
    k8s/
```

## Per-service source skeleton
```text
src/
  main.ts
  app.module.ts
  config/
  modules/
    <domain>/
      controllers/
      services/
      repositories/
      entities/
      dto/
      mappers/
      events/
      policies/
      validators/
      exceptions/
      __tests__/
  common/
    interceptors/
    filters/
    guards/
    pipes/
```

## Quality gates
- Unit test coverage >= 80% for domain services.
- Contract tests for public APIs and events.
- Schema migration checks in CI.
- Security checks (SAST/dependency scan) before deploy.
