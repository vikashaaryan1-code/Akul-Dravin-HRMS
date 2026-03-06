# Terraform Baseline

## Suggested Modules
- `network`: VPC/VNet, subnets, routing, gateways
- `kubernetes`: managed cluster, node pools, autoscaling
- `data`: PostgreSQL HA, Redis, RabbitMQ, Elasticsearch
- `security`: KMS, secrets manager, IAM roles, WAF policies
- `observability`: metrics/logging/tracing sinks

## Regions
Deploy by region-cell model:
- Cell includes API, workers, AI inference, and regional data stores.
- Global control layer for routing, policy, and tenant directory.

## Rollout
1. Bootstrap shared global services.
2. Provision first 3 production regions.
3. Validate DR failover.
4. Scale with repeatable region module.
