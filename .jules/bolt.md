# Bolt's Performance Journal

## 2026-07-19 - Consolidating Sequential Count and Lookup Queries in Bank Reconciliation Reporting
**Learning:** Sequential calls to `.count` and `.findOne` on the same repository with similar filtering (e.g. `tenantId`) introduce a 3x database network round-trip overhead. TypeORM's `createQueryBuilder` with conditional aggregation (`SUM/CASE` and `MAX`) allows consolidating these counts and the latest matched timestamp lookup into a single database query. This provides significant performance wins by reducing multi-tenant query isolation latency.
**Action:** Use `createQueryBuilder` with conditional SUM and MAX when encountering sequential counts and timestamp lookups on the same database table, and always enforce tenant isolation via `TenantQueryPolicy.enforce`.
