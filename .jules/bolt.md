## 2026-07-08 - [SurveysService & AttendanceService Optimization]
**Learning:** Found N+1 query patterns and in-memory aggregation of large datasets in `SurveysService`. Fetching all records for metrics calculation (e.g., eNPS) into application memory is a significant bottleneck as data grows.
**Action:** Always use database-level aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) for metrics and consolidated grouping for relation counts to maintain O(1) database round-trips. Always wrap these optimizations with `TenantQueryPolicy.enforce` to satisfy the codebase's governance requirements.
