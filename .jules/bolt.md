# Bolt's Journal - Critical Learnings

## 2026-10-09 - TypeORM Aggregate Output Types
**Learning:** TypeORM `QueryBuilder.getRawOne()` returns aggregate query results (`COUNT`, `SUM`) as string values in Node.js runtime (e.g., `'100'` instead of `100`). Directly doing arithmetic or strict comparisons on raw query values without `parseInt(val, 10)` or `parseFloat(val)` leads to type inconsistency and logic bugs.
**Action:** Always parse `getRawOne()` numerical fields using `parseInt(val, 10) || 0` or `parseFloat(val) || 0`.
