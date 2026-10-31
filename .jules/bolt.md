# Bolt's Journal - Critical Learnings Only

## 2026-10-31 - Consolidating Tenant Counts in SuperAdminService
**Learning:** Repositories often execute multiple `.count()` calls on the same table with different `where` clauses (`status = 'active'`, `status = 'trial'`, etc.). Each `.count()` triggers an individual `SELECT COUNT(*)` query to PostgreSQL.
**Action:** Consolidate multiple status count queries into a single `createQueryBuilder` execution using conditional aggregation (`COUNT(CASE WHEN t.status = '...' THEN 1 END)::int`) to minimize database round-trips and table scans.
