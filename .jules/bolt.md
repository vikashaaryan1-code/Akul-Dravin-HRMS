## 2025-05-15 - [Consolidating Stats Queries]
**Learning:** Multiple sequential `count()` calls for statistics are a common pattern in this codebase, causing unnecessary database roundtrips. Consolidating them using `createQueryBuilder` and conditional aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) significantly improves performance by reducing O(N) queries to O(1) relative to the number of statistics being fetched.

**Action:** When implementing or updating `getStats` methods, always use a single query with conditional aggregation instead of multiple `count()` calls.
