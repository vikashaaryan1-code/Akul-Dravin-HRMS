## 2026-07-15 - [SuperAdminStats]
**Learning:** Consolidating multiple `count()` calls into a single `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN...)`) significantly reduces database round-trips and engine overhead compared to `Promise.all` at the application layer.
**Action:** Always prefer conditional aggregation for multi-status count summaries to minimize DB connection pressure and improve response latency.
