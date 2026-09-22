# Bolt's Journal

## 2025-05-20 - Database Aggregate in LMS Completion Trend
**Learning:** `LmsService.getCompletionTrend()` was fetching up to 100 performance entity instances from PostgreSQL into Node.js memory just to compute an average `finalScore` with JS `.reduce()`. Replacing this with `createQueryBuilder` and SQL aggregate `AVG(perf.finalScore)` pushes the aggregation to PostgreSQL, minimizing memory overhead and network payload size.
**Action:** Always favor database-level SQL aggregate functions (`AVG`, `SUM`, `COUNT`) over `find()` + JS array reduction for summary metrics.
