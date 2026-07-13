## 2026-07-13 - [CRM Pipeline Summary Optimization]
**Learning:** In-memory aggregation of large datasets (e.g., up to 2000 records) is a significant performance bottleneck and accuracy risk. Consolidating multiple sequential count/sum queries into a single database-level aggregation using `createQueryBuilder` with `GROUP BY` and `TenantQueryPolicy.enforce` dramatically reduces memory usage and database round-trips.
**Action:** Always prefer database-level aggregations over in-memory loops for summary statistics, especially when entity counts can be large or are arbitrarily capped.
