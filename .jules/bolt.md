# Bolt's Performance Journal

## 2026-06-06 - [Database Optimization: Single Query Aggregation]
**Learning:** Found a pattern of sequential `count()` calls in NestJS services (Employee, Project, etc.) that fetch dashboard statistics. Each `count()` call results in a separate database roundtrip.
**Action:** Use TypeORM's `createQueryBuilder` with PostgreSQL's `FILTER` clause (e.g., `COUNT(*) FILTER (WHERE status = 'active')`) to consolidate these into a single query. This significantly reduces latency and database load for high-traffic dashboard endpoints.
