## 2025-05-22 - [Pattern] Sequential Queries and In-memory Aggregation
**Learning:** Found a recurring anti-pattern in `getStats` methods where multiple database counts or full record fetches are performed. In `AttendanceService.getStats`, full records are fetched and then filtered/reduced in memory.
**Action:** Use TypeORM's `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN ...)`) to perform these operations in a single database query.
