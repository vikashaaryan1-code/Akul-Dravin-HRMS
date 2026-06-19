## 2025-05-15 - TypeORM getRawOne Type Casting
**Learning:** When using TypeORM's `createQueryBuilder` with aggregation functions like `COUNT` or `SUM`, the `getRawOne()` method returns results as strings (e.g., `"5"`) rather than numbers. This is a common behavior with database drivers (like `pg`) to prevent precision loss for large numbers.
**Action:** Always wrap raw aggregation results in `parseInt(result.field, 10) || 0` to ensure type safety and correct behavior in the application logic.
