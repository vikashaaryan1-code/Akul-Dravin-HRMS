# Bolt's Performance Journal

## 2025-05-22 - [Database Aggregation Optimization Pattern]
**Learning:** Consolidating multiple sequential database count queries into a single query using conditional aggregation (e.g., `SUM(CASE WHEN condition THEN 1 ELSE 0 END)`) significantly reduces database roundtrips and overall latency. This pattern is particularly effective for dashboard "stats" endpoints.
**Action:** Always check for sequential `.count()` calls in `getStats` methods and refactor them into a single Query Builder call with conditional aggregation where possible. Ensure that results from `getRawOne()` are parsed to integers, as PostgreSQL/TypeORM often returns them as strings.
