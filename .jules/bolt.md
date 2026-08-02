# Bolt's Performance Journal

## 2026-08-02 - [Optimizing Attendance Summary with Conditional Aggregation]
**Learning:** In TypeORM/NestJS codebases with multi-tenant isolation, utilizing `.count()` sequentially on a single repository for different status conditions produces multiple sequential database round-trips. Each query does table/index scans under a multi-tenant scope, leading to high latency at scale. By using `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN status = ... THEN 1 ELSE 0 END)`), we can collapse these operations into exactly one query. We must always call `TenantQueryPolicy.enforce` on the custom query builder to maintain multi-tenant correctness.
**Action:** Use conditional aggregation on TypeORM query builders for multi-status count APIs, reducing database round-trips from N to 1. Always enforce tenant isolation at the query builder boundary.
