## 2025-05-15 - Multiple Database Round-trips in Stats Endpoints
**Learning:** Sequential `count()` calls for different statuses create unnecessary database round-trips. Using TypeORM's `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN condition THEN 1 ELSE 0 END)`) allows fetching all metrics in a single query, significantly improving efficiency.
**Action:** Consolidate multiple count operations into a single query using conditional aggregation. Ensure type safety by using `parseInt` on the raw results, as database drivers often return them as strings.

## 2025-05-15 - Entity Property vs. Service Parameter Naming
**Learning:** In this codebase, the `Employee` entity uses `companyId` as its organizational identifier (mapped to `company_id` in DB), but the service layer methods often receive this value as a parameter named `tenantId`. When using `createQueryBuilder`, you must use the entity property name (`companyId`), not the service parameter name or the raw column name.
**Action:** Always verify the entity property name when switching from `Repository.find()` or `Repository.count()` (which may allow some property aliasing in some configurations or just happen to work if the parameter name matches a previous iteration) to `createQueryBuilder`.
