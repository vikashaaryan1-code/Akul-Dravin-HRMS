# Bolt's Performance Journal

## 2025-05-15 - [Anti-pattern: Sequential Database Counts]
**Learning:** Found multiple instances where `getStats` methods were making 3-4 separate `count()` calls to the database. This creates unnecessary network roundtrips and increased latency, especially as the database grows or under high load.
**Action:** Consolidate multiple counts into a single query using TypeORM `createQueryBuilder` and conditional aggregation (e.g., `SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`). This reduces N roundtrips to 1.
