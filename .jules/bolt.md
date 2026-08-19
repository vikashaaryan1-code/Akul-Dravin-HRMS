## 2025-05-18 - TypeORM QueryBuilder .where() vs .andWhere() with TenantQueryPolicy
**Learning:** Calling `.where()` on a TypeORM `SelectQueryBuilder` after `TenantQueryPolicy.enforce()` overwrites the entire `WHERE` clause, silently removing the `tenant_id` constraint.
**Action:** Always use `.andWhere()` when appending conditions to a query builder that has been scoped with `TenantQueryPolicy.enforce()`.
