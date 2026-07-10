# Bolt Performance Journal ⚡

## 2026-07-10 - Consolidating Governance Health Outbox Queries
**Learning:** The `getOutboxHealth` method was performing 6 sequential database queries (4 status counts, 1 `findOne` for oldest pending, and 1 count for overdue entries). In a high-traffic environment, these sequential round-trips add significant latency and database overhead.
**Action:** Use TypeORM's `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN condition THEN 1 ELSE 0 END)`) and `MIN` to fetch multiple metrics (counts and timestamps) in a single database round-trip. This is a highly effective pattern for dashboard-style summary methods.
