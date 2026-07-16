# Bolt's Performance Journal

## 2026-07-16 - [TypeORM QueryBuilder Property Mapping]
**Learning:** When using TypeORM's `createQueryBuilder`, the strings passed to `orderBy`, `where`, and `addSelect` callbacks (like `subQuery.where()`) must refer to the **Entity Property Names** (e.g., `createdAt`), not the raw database column names (e.g., `created_at`), unless using raw SQL fragments. Mixing them up causes `EntityPropertyNotFoundError`.
**Action:** Always verify entity property names in the entity definition before using them in `QueryBuilder` methods.
