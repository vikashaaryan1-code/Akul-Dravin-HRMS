## 2026-07-05 - [Pattern] Single-Query Conditional Aggregation for Stats
**Learning:** Multiple sequential `count()` calls in a single endpoint are a common bottleneck in this codebase. Consolidating them into a single query using TypeORM's `createQueryBuilder` and `SUM(CASE WHEN status = 'X' THEN 1 ELSE 0 END)` significantly reduces database round-trips.
**Action:** Always scan for multiple `count()` or `find()` calls in `getStats` methods and consolidate them. Remember that `getRawOne()` returns results as strings in this environment; use `parseInt(val, 10) || 0` to maintain type safety.
