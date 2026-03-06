# 03. Folder Structure (Monorepo)

```text
platform-v39/
  architecture/
    01-system-architecture-diagram.md
    02-microservices-catalog.md
    03-folder-structure.md
    04-deployment-architecture.md
  api/
    openapi-v39.yaml
    endpoint-catalog-v39.md
  database/
    schema-v39.sql
    partitioning-strategy.md
  ai/
    README.md
    services/
      orchestrator/main.py
      resume-parser/main.py
      candidate-matching/main.py
      interview-analysis/main.py
      workforce-intelligence/main.py
      attrition-prediction/main.py
      hr-assistant/main.py
      emotion-ai/main.py
      voice-ai/main.py
    pipelines/
      training_pipeline.py
      feature_definitions.md
      model_registry_contract.md
  infra/
    docker-compose.v39.yml
    kubernetes/
      namespace.yaml
      configmap.yaml
      api-gateway-deployment.yaml
      ai-orchestrator-deployment.yaml
      postgres-statefulset.yaml
      redis-rabbitmq.yaml
      hpa.yaml
    terraform/
      README.md
  README.md
```

## Intended Runtime Repositories (execution phase)
- `apps/gateway` (NestJS)
- `apps/services/*` (NestJS microservices)
- `apps/ai/*` (FastAPI services)
- `packages/contracts` (OpenAPI, AsyncAPI, protobuf)
- `packages/sdk` (TypeScript/Python SDK)
- `packages/infra` (Helm/Terraform)
