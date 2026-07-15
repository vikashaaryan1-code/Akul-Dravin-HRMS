## 2026-07-15 - [SuperAdminStats]
**Learning:** Consolidating multiple `count()` calls into a single `createQueryBuilder` with conditional aggregation (`SUM(CASE WHEN...)`) significantly reduces database round-trips and engine overhead compared to `Promise.all` at the application layer.
**Action:** Always prefer conditional aggregation for multi-status count summaries to minimize DB connection pressure and improve response latency.

## 2026-07-15 - [BuildOptimization]
**Learning:** Including large test directories in `tsc` checks without the required dev-dependencies installed in the CI environment leads to build failures and unnecessary overhead.
**Action:** Exclude test-only directories from the main `tsconfig.json` to keep build-time type checking focused on source code and improve CI speed.
