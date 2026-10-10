## 2026-10-10 - [PerformanceManagementService 3N+1 Query Bottleneck]
**Learning:** `PerformanceManagementService.getScores` performed an $O(N)$ loop over all employees in the system, running 3 database queries per employee (`attendanceRepo.find`, `taskRepo.count`, `performanceRepo.findOne`) leading to $3N+1$ database round-trips.
**Action:** Replace per-employee loop database queries with 3 bulk aggregation queries using `createQueryBuilder` with `GROUP BY` and `TenantQueryPolicy.enforce` to build O(1) in-memory maps, reducing database queries from $O(N)$ to $O(1)$ constant 4 queries.
