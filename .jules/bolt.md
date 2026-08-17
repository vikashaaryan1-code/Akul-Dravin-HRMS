## 2026-08-17 - Consolidating analytics SQL aggregations with CTE and JSON aggregation

**Learning:** `WorkforceAnalyticsService.getHeadcountSnapshot` previously issued 4 separate SQL queries against the `employees` table (totals, by department, by employment type, by designation). Using a CTE (`WITH base AS ...`) with conditional filtering (`FILTER (WHERE ...)`) and subqueries wrapped in `json_agg(json_build_object(...))` allows consolidating multiple grouping aggregations into a single SQL query execution, reducing database round-trips from 4 to 1 while scanning `employees` only once.

**Action:** Look for analytics services performing multiple grouping queries against the same filtered base table and consolidate them into a single query using CTEs and PostgreSQL JSON aggregation.
