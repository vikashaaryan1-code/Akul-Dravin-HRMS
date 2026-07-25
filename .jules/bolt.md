# Bolt's Performance Optimization Journal

## 2026-07-25 - Consolidating Sequential Count Queries into Conditional Aggregation
**Learning:** Sequential calls to `.count()` or custom counting conditions trigger multiple database round-trips and connection pool checkouts. In a NestJS and TypeORM architecture, we can consolidate these into a single database query using TypeORM's `createQueryBuilder` with raw select SQL fragments like `COUNT(*)` and conditional aggregation (`SUM(CASE WHEN condition THEN 1 ELSE 0 END)`). This maintains strict multi-tenant isolation via `TenantQueryPolicy.enforce` while reducing database round-trips from N to 1.
**Action:** When calculating statistics or dashboards that require counting different statuses or conditions on the same entity, always aggregate them into a single `createQueryBuilder` with conditional aggregation and apply `TenantQueryPolicy.enforce`.
