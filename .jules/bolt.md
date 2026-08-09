## 2026-08-09 - Attendance Summary Query Consolidation
**Learning:** Consolidating multiple count queries (4 counts) on the same dataset into a single conditional SQL aggregation (SUM/CASE WHEN) reduces DB round-trips from 4 to 1 while guaranteeing tenant isolation correctness at the query boundary via TenantQueryPolicy.enforce.
**Action:** Always prefer SQL-level conditional aggregation (SUM/CASE WHEN) over multiple count queries for stats summary endpoints.
