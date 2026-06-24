# Bolt's Performance Journal ⚡

## 2025-05-15 - [Database Aggregation Optimization]
**Learning:** Sequential `count()` calls in TypeORM services create unnecessary database round-trips. These can be consolidated into a single query using `createQueryBuilder` and conditional aggregation with `SUM(CASE WHEN condition THEN 1 ELSE 0 END)`.
**Action:** Always check for multiple `count()` calls in `getStats` methods and consolidate them. Use `parseInt()` on results from `getRawOne()` as they often return strings.
