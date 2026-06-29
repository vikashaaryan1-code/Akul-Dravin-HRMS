## 2025-05-22 - Single-query conditional aggregation for stats
**Learning:** Consolidating multiple `count()` calls into a single query using TypeORM's `createQueryBuilder` and `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` is a highly effective way to reduce database round-trips. In Node.js, these results often come back as strings, so `parseInt(..., 10) || 0` is necessary for type safety and handling empty sets.
**Action:** Use `createQueryBuilder` with conditional aggregation for any `getStats` or dashboard-like methods that currently perform multiple sequential counts.
