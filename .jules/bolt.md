## 2026-06-07 - [Consolidating Redundant Database Queries]
**Learning:** Many backend services used sequential 'count()' calls for dashboard stats, causing multiple round-trips. Conditional aggregation with 'SUM(CASE WHEN ...)' is a highly effective O(1) round-trip optimization.
**Action:** Identify sequential 'count()' calls in analytics/stats endpoints and consolidate them using a single 'createQueryBuilder' with 'SUM(CASE WHEN ...)' for performance and dialect safety.
