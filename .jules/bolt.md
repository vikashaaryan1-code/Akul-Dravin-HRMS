## 2025-05-15 - [Database Stats Consolidation]
**Learning:** Sequential `count()` calls in NestJS services create unnecessary database roundtrips. Using `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) can reduce roundtrips by 66-75% for stats-heavy endpoints. Note that PostgreSQL-specific `FILTER` is more readable but `CASE WHEN` is more portable in TypeORM.
**Action:** Always scan for `getStats` or similar methods with multiple sequential `count()` calls and consolidate them using a single `createQueryBuilder` query.
