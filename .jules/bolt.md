
## 2026-08-27 - Single Query Aggregation for Work Tracking Analytics
**Learning:** `WorkTrackingService.getProductivitySummary` previously fetched up to 500 complete entity instances into Node.js memory to perform array reductions in JavaScript. Converting this to TypeORM `createQueryBuilder` with SQL aggregate functions (`COUNT`, `SUM`, `AVG`) reduces memory overhead, eliminates unnecessary network serialization of 500 entity instances, and runs computations natively in PostgreSQL.
**Action:** When aggregating entity metrics in NestJS services, use TypeORM's `createQueryBuilder` with `select` aggregate expressions (`COUNT`, `SUM`, `AVG`, `COALESCE`) combined with `TenantQueryPolicy.enforce` for database-level aggregation instead of loading entities in-memory.
