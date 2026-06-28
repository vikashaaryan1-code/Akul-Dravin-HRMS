## 2025-03-08 - [Single-Query Database Aggregation]
**Learning:** Sequential database counts (e.g., in `getStats` methods) create unnecessary round-trips. Replacing them with a single `createQueryBuilder` call using conditional aggregation (`SUM(CASE WHEN...)`) significantly reduces database overhead and latency. Result fields from `getRawOne()` in TypeORM often return as strings, so `parseInt(..., 10) || 0` is necessary for type safety.
**Action:** Always look for sequential `count` or `find` operations that can be consolidated into a single aggregation query.
