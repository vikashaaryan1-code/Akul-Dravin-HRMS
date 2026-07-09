# Bolt's Performance Journal

## 2025-05-15 - [Sequential Database Counts]
**Learning:** Multiple sequential `repo.count()` calls in Controller/Service `getStats` methods create unnecessary database round-trips.
**Action:** Consolidate multiple counts into a single query using TypeORM `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`).

## 2025-05-15 - [Governance Enforcement in Aggregations]
**Learning:** Using `repo.count()` often bypasses explicit tenant isolation in this codebase. Switching to `createQueryBuilder` requires manual enforcement using `TenantQueryPolicy.enforce()`.
**Action:** Always use `TenantQueryPolicy.enforce()` when refactoring to `createQueryBuilder` to maintain multi-tenant security.
