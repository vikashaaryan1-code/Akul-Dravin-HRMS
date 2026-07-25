# Bolt's Performance Optimization Journal

## 2026-07-25 - Consolidating Sequential Count Queries into Conditional Aggregation
**Learning:** Sequential calls to `.count()` or custom counting conditions trigger multiple database round-trips and connection pool checkouts. In a NestJS and TypeORM architecture, we can consolidate these into a single database query using TypeORM's `createQueryBuilder` with raw select SQL fragments like `COUNT(*)` and conditional aggregation (`SUM(CASE WHEN condition THEN 1 ELSE 0 END)`). This maintains strict multi-tenant isolation via `TenantQueryPolicy.enforce` while reducing database round-trips from N to 1.
**Action:** When calculating statistics or dashboards that require counting different statuses or conditions on the same entity, always aggregate them into a single `createQueryBuilder` with conditional aggregation and apply `TenantQueryPolicy.enforce`.

## 2026-07-25 - Excluding tests and E2E specs from Frontend tsconfig
**Learning:** Standard TypeScript compiler runs in GHA pipelines can fail if test-only directories (e.g. Playwright E2E tests, testing-library unit tests) are type-checked during normal Next.js build runs. This happens when the test runner dependency framework is omitted or scoped differently.
**Action:** Ensure that folders like `"tests"` or `"e2e"` containing browser tests are added to the `"exclude"` list of the frontend tsconfig.json file to avoid type compilation failures.
