## 2026-07-06 - [Aggregation Optimization in Multi-Tenant Environments]
**Learning:** Consolidating sequential count queries into a single conditional aggregation (SUM/CASE) query significantly reduces database round-trips. However, when using TypeORM's `createQueryBuilder`, standard repository-level filters are bypassed. It is critical to manually apply tenant isolation via `TenantQueryPolicy.enforce` to maintain the system's governance and data integrity standards.
**Action:** Always use `TenantQueryPolicy.enforce` when refactoring repository calls to `createQueryBuilder` for performance optimizations.

## 2026-07-06 - [Post-Aggregation Type Safety]
**Learning:** TypeORM's `getRawOne()` returns all aggregated fields as strings (e.g., "15" instead of 15), even for `COUNT` and `SUM`. This can lead to subtle bugs in arithmetic or rate calculations (e.g., `"10" / "20"` might work in JS but is unsafe).
**Action:** Explicitly cast raw results using `parseInt(result.field, 10) || 0` to ensure type safety in the service layer.
