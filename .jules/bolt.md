## 2026-07-11 - [PerformanceManagementService.getScores Optimization]
**Learning:** Found a 3N+1 query bottleneck in `PerformanceManagementService.getScores` where it fetched attendance, tasks, and performance reviews in a loop per employee. Consolidating this into a single query with subqueries significantly reduces database round-trips.
**Action:** Use `createQueryBuilder` with subqueries for aggregations when multiple related entity counts/sums are needed per row.

## 2026-07-11 - [CI Environment and Subproject Builds]
**Learning:** In projects where subpackages have their own `package.json` and `tsconfig.json`, root `npm install` may not suffice for subpackage builds if they aren't defined as workspaces. This can lead to missing types (`jest`, `node`) during subpackage builds.
**Action:** Always ensure subpackages have their dependencies installed within their own `node_modules` before running `tsc` or `npm test` from their directories. Use `rootDir` and `ignoreDeprecations` in `tsconfig.json` to handle modern TypeScript versions and specific source layouts.
