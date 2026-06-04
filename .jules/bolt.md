## 2025-05-22 - Efficient Conditional Aggregation with PostgreSQL FILTER
**Learning:** PostgreSQL's `FILTER (WHERE ...)` clause allows performing multiple conditional counts in a single query and single table scan. This is vastly superior to sequential `Repository.count()` calls which trigger multiple database round-trips and redundant scans.
**Action:** Use `.select("COUNT(*) FILTER (WHERE ...)")` in TypeORM `createQueryBuilder` for dashboard statistics and similar aggregation tasks.

## 2025-05-22 - Employee Entity Naming Mismatch
**Learning:** The `Employee` entity uses `companyId` as its organizational identifier, but `EmployeeService` parameters are often named `tenantId`. Using the wrong property name in TypeORM `where` clauses causes runtime errors.
**Action:** Explicitly map `tenantId` parameters to `companyId` when querying the `Employee` repository.
