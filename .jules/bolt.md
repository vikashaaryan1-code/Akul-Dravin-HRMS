## 2025-05-22 - [Pattern] Single Query Conditional Aggregation
**Learning:** Consolidating multiple sequential `count()` or `find()` calls into a single database query using TypeORM's `createQueryBuilder` with `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` significantly reduces database round-trips and improves performance.
**Action:** Always look for `getStats` or similar methods that perform multiple counts on the same table and refactor them to use a single aggregation query.

## 2025-05-22 - [Entity Mapping] tenantId vs companyId in Employee Entity
**Learning:** In the `Employee` module, service-level code uses `tenantId` to filter employees, but the `Employee` entity defines this property as `companyId` (mapped to `company_id` in the database).
**Action:** When using `createQueryBuilder` for the `Employee` entity, ensure filters use the entity property name `companyId` when a `tenantId` is provided by the service layer.
