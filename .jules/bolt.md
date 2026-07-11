## 2026-07-11 - [PerformanceManagementService.getScores Optimization]
**Learning:** Found a 3N+1 query bottleneck in `PerformanceManagementService.getScores` where it fetched attendance, tasks, and performance reviews in a loop per employee. Consolidating this into a single query with subqueries significantly reduces database round-trips.
**Action:** Use `createQueryBuilder` with subqueries for aggregations when multiple related entity counts/sums are needed per row.

## 2026-07-11 - [Mocking Subqueries in TypeORM]
**Learning:** When mocking TypeORM's `createQueryBuilder` for methods that use the `addSelect(subQuery => ...)` pattern, the mock must manually call the callback with a mocked subquery object to avoid `TypeError: Cannot read properties of undefined (reading 'select')`.
**Action:** In `test-optimization.ts` style scripts, ensure `addSelect` mock handles the function callback properly.
