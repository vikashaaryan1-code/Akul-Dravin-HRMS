## 2025-05-22 - [Optimized Dashboard Stats via Conditional Aggregation]
**Learning:** Many service modules in this NestJS/TypeORM backend use sequential await repo.count() calls for dashboard statistics, which causes multiple database round-trips. These can be consolidated into a single query using conditional aggregation (SUM/CASE) via TypeORM's createQueryBuilder.
**Action:** Identify and consolidate sequential count/aggregation queries in getStats-style methods to reduce network latency and database load.
