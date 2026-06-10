## 2025-05-22 - [Optimized Sequential Count Queries in getStats]
**Learning:** Sequential `count()` calls in TypeORM/NestJS services create unnecessary database roundtrips. Consolidating them into a single query using `createQueryBuilder` and conditional aggregation (`SUM(CASE WHEN condition THEN 1 ELSE 0 END)`) significantly improves performance, especially as the number of aggregated metrics grows.
**Action:** Always look for multiple sequential aggregate calls (count, sum, avg) on the same entity and consolidate them into a single query using conditional aggregation.
