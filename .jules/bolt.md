# Bolt's Journal - Performance Optimization

This journal tracks critical performance learnings and decisions to optimize the HRMS application.

## 2026-07-27 - [Career Growth Stats Optimization]
**Learning:** Sequential repository calls (like `.count()`) create unnecessary database round-trips. When computing multi-status metrics (such as active vs total vs gated promotions), a single aggregate query using `createQueryBuilder` with conditional `SUM(CASE WHEN ...)` or `COUNT(CASE WHEN ...)` aggregates these numbers in one round-trip.
**Action:** Consolidate multiple count queries in `CareerGrowthController.getStats` into a single, governed, high-performance database query while enforcing tenant isolation with `TenantQueryPolicy.enforce`.
